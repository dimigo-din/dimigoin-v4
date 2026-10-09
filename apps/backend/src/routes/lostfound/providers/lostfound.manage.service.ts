import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { eq } from "drizzle-orm";
import { CacheService } from "#/common/modules/cache.module";
import { lostfoundReport } from "#/db/schema";
import type { LostfoundStatus } from "$mapper/types";
import { DRIZZLE, type DrizzleDB } from "$modules/drizzle.module";
import { findOrThrow } from "$utils/findOrThrow.util";
import { PushManageService } from "~push/providers";

type LostfoundWebhookData = {
  id: string;
  status: LostfoundStatus;
  objectName: string;
  lastSeenPlace: string;
  body: string;
  createdAt: Date | string;
  img: Array<{ url: string }>;
  user: { name: string } | null;
};

@Injectable()
export class LostfoundManageService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly config: ConfigService,
    private readonly cacheService: CacheService,
    private readonly pushService: PushManageService,
  ) {}

  async sendWebhook(data: LostfoundWebhookData, apiOrigin: string) {
    const webhookUrl = this.config.getOrThrow<string>("LOSTFOUND_WEBHOOK_URL");
    const webhookEndpoint = new URL(webhookUrl);
    webhookEndpoint.searchParams.set("with_components", "true");
    const approveUrl = new URL(
      `/manage/lostfound/approve/${encodeURIComponent(data.id)}`,
      apiOrigin,
    );
    const isLost = data.status === "lost";

    return await fetch(webhookEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "분실물 알림",
        avatar_url: "https://dimigoin.io/dimigoin.png",
        embeds: [
          {
            title: "새 게시물이 등록되었습니다.",
            description: "아래 버튼을 눌러 알림을 허락해주세요.",
            color: 0x3498db,
            fields: [
              {
                name: "물건",
                value: data.objectName,
              },
              {
                name: "상세 내용",
                value: data.body || "내용 없음",
              },
              {
                name: "구분",
                value: isLost ? "분실물" : "습득물",
                inline: true,
              },
              {
                name: isLost ? "마지막으로 본 장소" : "습득 장소",
                value: data.lastSeenPlace || "정보 없음",
                inline: true,
              },
              {
                name: "작성자",
                value: data.user?.name || "알 수 없음",
                inline: true,
              },
            ],
            timestamp: new Date(data.createdAt).toISOString(),
          },
          ...data.img.map(({ url }) => ({ image: { url } })),
        ],
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 5,
                label: "알림 전송 승인",
                url: approveUrl.toString(),
              },
            ],
          },
        ],
      }),
    });
  }

  async tryAcquire() {
    return await this.cacheService.setLostfoundNotification();
  }

  async sendNotification(id: string) {
    const report = await findOrThrow(
      this.db.query.lostfoundReport.findFirst({
        where: { RAW: (t, { eq }) => eq(t.id, id) },
      }),
    );
    const isLost = report.status === "lost";
    const reportType = isLost ? "분실물" : "습득물";

    return await this.pushService.sendToAll({
      title: `새 ${reportType}`,
      body: report.objectName,
      category: "school_information",
      url: `/lostfound/detail?id=${encodeURIComponent(report.id)}`,
      data: { reportId: report.id, status: report.status },
      actions: [],
      icon: "https://dimigoin.io/dimigoin.png",
      badge: "https://dimigoin.io/dimigoin.png",
    });
  }

  async isSent(id: string) {
    const report = await findOrThrow(
      this.db.query.lostfoundReport.findFirst({
        columns: {
          isSent: true,
        },
        where: {
          id: {
            eq: id,
          },
        },
      }),
    );

    return report.isSent;
  }

  async markSent(id: string) {
    return await findOrThrow(
      this.db
        .update(lostfoundReport)
        .set({ isSent: true })
        .where(eq(lostfoundReport.id, id))
        .returning({ id: lostfoundReport.id, isSent: lostfoundReport.isSent })
        .then(([report]) => report),
    );
  }

  async release() {
    return await this.cacheService.releaseLostfoundNotification();
  }
}
