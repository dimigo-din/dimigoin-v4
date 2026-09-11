import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EmptyFilter, eq, sql } from "drizzle-orm";
import { lostfoundComment, lostfoundImg, lostfoundReport } from "#/db/schema";
import { lostfoundReportWithCommentImgUser, lostfoundReportWithImgUser } from "#/db/with";
import { ErrorMsg } from "$mapper/error";
import { UserJWT } from "$mapper/types";
import { CacheService } from "$modules/cache.module";
import { DRIZZLE, type DrizzleDB } from "$modules/drizzle.module";
import { R2 } from "$modules/r2.module";
import { findOrThrow } from "$utils/findOrThrow.util";
import { andWhere } from "$utils/where.util";
import { FileDTO } from "~facility/dto/facility.dto";
import {
  GetReportListDTO,
  LostfoundReportIdDTO,
  PostCommentDTO,
  ReportLostfoundDTO,
} from "~lostfound/dto";

type LostfoundImgRow = { id: string; name: string; location: string };

@Injectable()
export class LostfoundStudentService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    @Inject(R2) private readonly r2: S3Client,
    private readonly config: ConfigService,
    private readonly cacheService: CacheService,
  ) {}

  private get bucket() {
    return this.config.get<string>("R2_BUCKET_NAME") ?? "";
  }

  /** 이미지 레코드를 바로 접근 가능한 링크로 변환합니다. */
  private toImgLinks(img: Array<LostfoundImgRow>) {
    const publicUrl = this.config.get<string>("R2_PUBLIC_URL");

    return img.map((i) => ({
      id: i.id,
      name: i.name,
      url: `${publicUrl}/${i.location}`,
    }));
  }

  private withImgLinks<T extends { img: Array<LostfoundImgRow> }>(report: T) {
    return { ...report, img: this.toImgLinks(report.img) };
  }

  async reportList(userJwt: UserJWT, data: GetReportListDTO) {
    // page 는 쿼리스트링이라 문자열로 들어올 수 있고, 음수 offset 은 쿼리 자체를 실패시킵니다.
    const page = Math.floor(Number(data.page));
    const offset = (Number.isFinite(page) && page > 1 ? page - 1 : 0) * 10;
    const status = data.status;
    // 쿼리스트링이라 boolean 이 아니라 문자열로 들어옵니다.
    // "true" 는 내 제보만, "false" 는 내 제보를 뺀 나머지, 없으면 전체입니다.
    const mine = data.mine;

    const reports = await this.db.query.lostfoundReport.findMany({
      where:
        status || mine || data.isConcluded
          ? {
              RAW: (t, { and, eq, ne }) =>
                andWhere(
                  and,
                  status ? eq(t.status, status) : undefined,
                  mine === "true" ? eq(t.userId, userJwt.id) : undefined,
                  mine === "false" ? ne(t.userId, userJwt.id) : undefined,
                  data.isConcluded ? eq(t.isConcluded, data.isConcluded) : undefined
                ),
            }
          : EmptyFilter,
      with: lostfoundReportWithImgUser,
      limit: 10,
      offset: offset,
      // 아직 찾는 중(lost)인 제보를 먼저, 그 안에서는 최신순으로 보여줍니다.
      // enum 선언 순서에 기대지 않도록 상태를 직접 비교합니다.
      orderBy: (lostfoundReport, { desc }) => [
        desc(sql`${lostfoundReport.status} = 'lost'`),
        desc(lostfoundReport.createdAt),
      ],
    });

    return reports.map((r) => ({
      ...this.withImgLinks(r),
      user: r.user ? { id: r.user.id } : null,
    }));
  }

  async getReport(data: LostfoundReportIdDTO) {
    const report = await findOrThrow(
      this.db.query.lostfoundReport.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.id) },
        with: lostfoundReportWithCommentImgUser,
      }),
    );

    return this.withImgLinks(report);
  }

  async createReport(userJwt: UserJWT, data: ReportLostfoundDTO, files: Array<FileDTO>) {
    if (!(await this.cacheService.lostfoundReportRateLimit(userJwt.id))) {
      throw new HttpException(ErrorMsg.RateLimit_Exceeded(), HttpStatus.TOO_MANY_REQUESTS);
    }

    const dbUser = await findOrThrow(
      this.db.query.user.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, userJwt.id) } }),
    );

    const [report] = await this.db
      .insert(lostfoundReport)
      .values({
        objectName: data.object_name,
        lastSeenPlace: data.last_seen_place,
        body: data.body,
        userId: dbUser.id,
        status: data.status
      })
      .returning();

    if (!report) {
      throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
    }

    if (files.length > 0) {
      for (const file of files) {
        await this.r2.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: file.filename,
            Body: file.buffer,
            ContentType: file.mimetype,
          }),
        );
      }

      await this.db.insert(lostfoundImg).values(
        files.map((file) => ({
          name: file.originalname,
          location: file.filename ?? "",
          parentId: report.id,
        })),
      );
    }

    const created = await findOrThrow(
      this.db.query.lostfoundReport.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, report.id) },
        with: lostfoundReportWithImgUser,
      }),
    );

    return this.withImgLinks(created);
  }

  /** 작성자 본인만 자신의 분실물을 찾았음(found)으로 표시할 수 있습니다. */
  async markFound(userJwt: UserJWT, data: LostfoundReportIdDTO) {
    const report = await findOrThrow(
      this.db.query.lostfoundReport.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.id) },
      }),
    );

    if (report.userId !== userJwt.id) {
      throw new HttpException(ErrorMsg.PermissionDenied_Resource(), HttpStatus.FORBIDDEN);
    }

    await this.db
      .update(lostfoundReport)
      .set({ isConcluded: true })
      .where(eq(lostfoundReport.id, report.id));

    const updated = await findOrThrow(
      this.db.query.lostfoundReport.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, report.id) },
        with: lostfoundReportWithImgUser,
      }),
    );

    return this.withImgLinks(updated);
  }

  async writeComment(userJwt: UserJWT, data: PostCommentDTO) {
    const dbUser = await findOrThrow(
      this.db.query.user.findFirst({ where: { RAW: (t, { eq }) => eq(t.id, userJwt.id) } }),
    );

    await findOrThrow(
      this.db.query.lostfoundReport.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, data.post) },
      }),
    );

    const [comment] = await this.db
      .insert(lostfoundComment)
      .values({
        parentId: data.post,
        text: data.text,
        userId: dbUser.id,
      })
      .returning();

    if (!comment) {
      throw new HttpException(ErrorMsg.Resource_NotFound(), HttpStatus.NOT_FOUND);
    }

    return comment;
  }
}
