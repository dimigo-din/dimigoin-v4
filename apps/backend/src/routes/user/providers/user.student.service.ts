import { TZDate } from "@date-fns/tz";
import { Inject, Injectable } from "@nestjs/common";
import { format } from "date-fns";
import { isNull } from "drizzle-orm";
import { laundryApplyWithTimeAndMachine } from "#/db/with";
import type { UserJWT } from "$mapper/types";
import { CacheService } from "$modules/cache.module";
import { DRIZZLE, type DrizzleDB } from "$modules/drizzle.module";
import { andWhere } from "$utils/where.util";
import type { ComciData } from "~user/dto";
import { UserManageService } from "./user.manage.service";

const COMCI_BASE = "http://comci.net:4082";
const SCHOOL_NAME = "한국디"; // 아~ 한국디~
const SCHOOL_NAME_EUC_KR = "%C7%D1%B1%B9%B5%F0%C1%F6%C5%D0%B9%CC%B5%F0%BE%EE%B0%ED%B5%EE%C7%D0";

const fetchComciJson = async <T>(path: string): Promise<T> => {
  const text = await (await fetch(`${COMCI_BASE}/${path}`)).text();
  return JSON.parse(text.replace(/\0/g, "")) as T;
};

const capture = (source: string, pattern: RegExp) => source.match(pattern)![1]!;

const decodeComciScript = (page: string) =>
  Array.from(page.matchAll(/\[\[0,"([0-9A-F]+)"\]\],(\d+)\)/g), ([, hex, seed]) => {
    const encoded = hex ?? "";
    let decoded = "";
    for (let i = 0; i < encoded.length; i += 4) {
      decoded += String.fromCharCode(
        Number.parseInt(encoded.slice(i, i + 4), 16) ^ ((Number(seed) + (i / 4) * 13) & 255),
      );
    }
    return decoded;
  }).join("\n");

const getComciData = async (): Promise<ComciData> => {
  const page = await (await fetch(`${COMCI_BASE}/st`)).text();
  const script = decodeComciScript(page);

  const searchPath = capture(script, /function school_ra\(sc\)\{\$\.ajax\(\{ url:'\.\/(\d+)\?/);
  const searchKey = capture(
    script,
    /function school_ra\(sc\)\{\$\.ajax\(\{ url:'\.\/\d+\?([^']+)'\+sc/,
  );
  const search = await fetchComciJson<{ 학교검색: (string | number)[][] }>(
    `${searchPath}?${searchKey}${SCHOOL_NAME_EUC_KR}`,
  );
  const school = search.학교검색.find((entry) => String(entry[2]).startsWith(SCHOOL_NAME));
  if (!school) {
    throw new Error(`Comci school not found: ${SCHOOL_NAME}`);
  }
  const schoolCodeDivisor = Number(capture(script, /학교검색\[i\]\[0\]\/(\d+)\)\+2/));
  const schoolCode = school[Math.floor(Number(school[0]) / schoolCodeDivisor) + 2];
  if (!schoolCode) {
    throw new Error(`Comci school code not found: ${SCHOOL_NAME}`);
  }

  const requestPrefix = capture(script, /sc_data\('(\d+_)',sc,1,'0'\)/);
  const timetablePath = capture(script, /var sc3='\.\/(\d+)\?'\+btoa/);
  const request = Buffer.from(`${requestPrefix}${schoolCode}_0_1`).toString("base64");
  const raw = await fetchComciJson<Record<string, unknown>>(`${timetablePath}?${request}`);
  const field = (pattern: RegExp) => raw[`자료${capture(script, pattern)}`];
  const dailyTimetable = field(/일일자료=Q자료\(자료\.자료(\d+)\[/);
  if (!Array.isArray(dailyTimetable)) {
    throw new Error(`Comci returned no timetable for ${SCHOOL_NAME}`);
  }

  return {
    ...(raw as ComciData),
    originalTimetable: field(/원자료=Q자료\(자료\.자료(\d+)\[/) as ComciData["originalTimetable"],
    dailyTimetable: dailyTimetable as ComciData["dailyTimetable"],
    roomData: field(/var m3=자료\.자료(\d+)\[/) as ComciData["roomData"],
    teacherNames: field(/성명=Q성명\(자료\.자료(\d+)\[th\]\)/) as ComciData["teacherNames"],
    subjectNames: field(/과목명=Q과목명\(자료\.자료(\d+)\[sb\]\)/) as ComciData["subjectNames"],
  };
};

@Injectable()
export class UserStudentService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly cacheService: CacheService,
    private readonly userManageService: UserManageService,
  ) {}

  async getMyApplies(user: UserJWT) {
    const [stayApplyResult, laundryApplyResult] = await Promise.all([
      this.db.query.stayApply.findFirst({
        where: {
          RAW: (t, { and, eq }) => andWhere(and, eq(t.userId, user.id), isNull(t.deletedAt)),
        },
        with: {
          user: true,
          outing: true,
        },
      }),
      this.db.query.laundryApply.findFirst({
        where: {
          RAW: (t, { and, eq }) =>
            andWhere(
              and,
              eq(t.userId, user.id),
              eq(t.date, format(new TZDate(new Date(), "Asia/Seoul"), "yyyy-MM-dd")),
            ),
        },
        with: laundryApplyWithTimeAndMachine,
      }),
    ]);
    return {
      stayApply: stayApplyResult ?? null,
      laundryApply: laundryApplyResult ?? null,
    };
  }

  async getTimeTable(userJwt: UserJWT) {
    const userDetail = await this.userManageService.getRequiredUserDetail(userJwt.id);
    const grade = userDetail.grade;
    const klass = userDetail.class;

    let data: ComciData;
    const cached = await this.cacheService.getCachedTimetable(grade, klass);
    if (cached) {
      return cached;
    } else {
      data = await getComciData();
    }

    const DIV = data.분리 ?? 100;
    const MAX_P = 8;
    const MAX_D = 5;

    const table = Array.from({ length: MAX_D }, () =>
      Array.from({ length: MAX_P }, () => ({ content: "", temp: false })),
    );

    const mTh = (mm: number, m2: number) => {
      if (m2 === 100) {
        return Math.floor(mm / m2);
      }
      return mm % m2;
    };

    const mSb = (mm: number, m2: number) => {
      if (m2 === 100) {
        return mm % m2;
      }
      return Math.floor(mm / m2);
    };

    const mTime = (mm: number, m2: number) => {
      if (m2 === 100) {
        return "";
      }
      const t = Math.floor(mm / m2);
      if (t >= 1 && t <= 26) {
        const n = t + 64;
        return `${String.fromCharCode(n)}_`;
      }
      return "";
    };

    const safeData = (m: unknown) => {
      if (m === undefined) {
        return 0;
      } else {
        return m;
      }
    };

    const rmBrackets = (value: unknown) => {
      if (typeof value === "string" && value.startsWith(">")) {
        return Number(value.slice(1));
      }
      return Number(value || 0);
    };

    const getGroupCode = (
      dataObj: ComciData,
      gradeNum: number,
      classNum: number,
      subjectCode: number,
      dayOfWeek: number,
      period: number,
    ) => {
      const division = dataObj.분리 ?? 100;

      if (!Array.isArray(dataObj.동시그룹)) {
        return "";
      }

      const groupCount = dataObj.동시그룹[0]?.[0] ?? 0;

      for (let i = 1; i <= groupCount; i++) {
        for (let k = 1; k <= 2; k++) {
          let check = 0;
          let currentGroup = 0;

          const innerCount = dataObj.동시그룹[i]?.[0] ?? 0;

          for (let j = 1; j <= innerCount; j++) {
            const groupValue: number | undefined = dataObj.동시그룹[i]?.[j];
            if (groupValue === undefined) {
              continue;
            }

            const subject4 = Math.floor(groupValue / 1000);
            const group2 = Math.floor(subject4 / 1000);
            const subject2 = subject4 - group2 * 1000;
            const teacher = Math.floor(group2 / 100);
            const group = group2 - teacher * 100;
            const classroom: number = groupValue - subject4 * 1000;
            const grade2 = Math.floor(classroom / 100);
            const class2 = classroom - grade2 * 100;

            const rawValue = rmBrackets(
              dataObj.dailyTimetable?.[grade2]?.[class2]?.[dayOfWeek]?.[period],
            );
            if (!Number.isFinite(rawValue)) {
              check = 0;
              break;
            }

            const subject3 = Math.floor(rawValue / division);
            const teacher2 = rawValue - subject3 * division;

            if (k === 1) {
              if (!(subject2 === subject3 && teacher === teacher2)) {
                check = 0;
                break;
              }
              if (
                gradeNum === grade2 &&
                classNum === class2 &&
                subjectCode === subject2 &&
                teacher === teacher2 &&
                group > 0
              ) {
                check = 1;
                currentGroup = group;
              }
            } else {
              if (!(subject2 === subject3)) {
                check = 0;
                break;
              }
              if (
                gradeNum === grade2 &&
                classNum === class2 &&
                subjectCode === subject2 &&
                group > 0
              ) {
                check = 1;
                currentGroup = group;
              }
            }
          }
          if (check === 1) {
            const n2 = currentGroup + 64;
            return `${String.fromCharCode(n2)}_`;
          }
        }
      }
      return "";
    };

    for (let day = 1; day <= MAX_D; day++) {
      for (let per = 1; per <= MAX_P; per++) {
        const originalData = safeData(data.originalTimetable?.[grade]?.[klass]?.[day]?.[per]);
        const rawDailyData = data.dailyTimetable?.[grade]?.[klass]?.[day]?.[per];
        const dailyData = rmBrackets(rawDailyData);

        let classroom = "";
        if (data.강의실 === 1) {
          const roomInfo = data.roomData?.[grade]?.[klass]?.[day]?.[per];
          if (typeof roomInfo === "string" && roomInfo.indexOf("_") > 0) {
            const roomParts = roomInfo.split("_");
            const roomNumber = Number(roomParts[0]);
            classroom = roomParts[1] ?? "";
            if (roomNumber > 0) {
              classroom = `\n${classroom}`;
            } else {
              classroom = "";
            }
          }
        }

        const isTemp =
          data.변경알림 === 1
            ? typeof rawDailyData === "string" && rawDailyData.startsWith(">")
            : originalData !== dailyData;

        const row = table[day - 1];
        if (!row) {
          continue;
        }

        if (dailyData > 100) {
          let teacherName = "";
          let groupPrefix = "";
          let timePrefix = "";

          const teacherIndex = mTh(dailyData, DIV);
          let subjectIndex = mSb(dailyData, DIV);
          timePrefix = mTime(subjectIndex, DIV);
          subjectIndex = subjectIndex % DIV;

          if (data.teacherNames && teacherIndex < data.teacherNames.length) {
            teacherName = data.teacherNames[teacherIndex]?.replace("*", "").slice(0, 2) ?? "";
          }

          if (timePrefix === "") {
            groupPrefix = getGroupCode(data, grade, klass, subjectIndex, day, per);
          } else {
            groupPrefix = timePrefix;
          }

          const subject = data.subjectNames?.[subjectIndex] ?? "";
          const teacherDisplay = teacherName;

          let result = groupPrefix + subject;
          if (teacherDisplay) {
            result += `\n${teacherDisplay}`;
          }
          if (classroom) {
            result += classroom;
          }

          row[per - 1] = { content: result, temp: isTemp };
        } else {
          row[per - 1] = { content: "", temp: isTemp };
        }
      }
    }

    await this.cacheService.setCachedTimetable(grade, klass, table);

    return table;
  }
}
