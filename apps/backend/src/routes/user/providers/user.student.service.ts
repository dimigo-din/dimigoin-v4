import crypto from "node:crypto";
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
const SCHOOL_NAME = "한국디지털미디어고"; // 아~ 한국디~

const capture = (source: string, pattern: RegExp) => source.match(pattern)![1]!;

const decodeEucKr = (bytes: ArrayBuffer | Uint8Array) => new TextDecoder("euc-kr").decode(bytes);

const decodeComciScript = (source: string): string =>
  Array.from(
    source.matchAll(/\(\[\[[01],"(?:[^"\\]|\\.)*"(?:\],\[[01],"(?:[^"\\]|\\.)*")*\]\],\d+\)/g),
    ([call]) => {
      const [chunks, seed] = JSON.parse(`[${call.slice(1, -1)}]`) as [[number, string][], number];
      const code = chunks
        .map(([plain, text]) =>
          plain
            ? text
            : text.replace(/.{4}/g, (hex, i: number) =>
                String.fromCharCode(Number.parseInt(hex, 16) ^ ((seed + (i / 4) * 13) & 255)),
              ),
        )
        .join("");
      return `${code}\n${decodeComciScript(code)}`;
    },
  ).join("\n");

const getComciData = async (): Promise<ComciData> => {
  const page = decodeEucKr(await (await fetch(`${COMCI_BASE}/st`)).arrayBuffer());
  const script = decodeComciScript(page);

  const keyParts = capture(script, /\[('[0-9a-f]{16}'(?:,'[0-9a-f]{16}'){3})\]/).match(/[0-9a-f]{16}/g)!;
  const keyOrder = capture(script, /return (a\[\d\](?:\+a\[\d\]){3});/).match(/\d/g)!;
  const aesKey = Buffer.from(keyOrder.map((i) => keyParts[Number(i)]).join(""), "hex");
  const xorKey = capture(script, /var a1=String\.fromCharCode\(([\d,]+)\)/).split(",").map(Number);
  const suffix = capture(script, /btoa\(\w+\+'([^']+)'\)/);

  const decodeString = (value: unknown) =>
    decodeEucKr(
      Buffer.from(String(value ?? ""), "base64").map((byte, i) => byte ^ xorKey[i % xorKey.length]!),
    );

  const request = async <T>(body: string): Promise<T> => {
    const response = await fetch(`${COMCI_BASE}/${capture(script, /url:'\.\/(\d+)'/)}`, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain; charset=UTF-8",
        "X-Hour-Token": capture(page, /__HourRequestToken='(\w+)'/),
      },
      body,
    });
    const [scheme, iv = "", data = ""] = (await response.text()).replace(/\0+$/, "").split(":");
    const encoding = scheme === "enc1" ? "hex" : "base64";
    const decipher = crypto.createDecipheriv("aes-256-cbc", aesKey, Buffer.from(iv, encoding));
    const json = Buffer.concat([decipher.update(data, encoding), decipher.final()]).toString();
    return JSON.parse(json.slice(0, json.lastIndexOf("}") + 1)) as T;
  };

  const searchPrefix = capture(script, /var \w+='([^']+)'\+encodeURIComponent\(sc\)/);
  const search = await request<{ 학교검색: (string | number)[][] }>(
    encodeURIComponent(btoa(`${searchPrefix}${encodeURIComponent(SCHOOL_NAME)}${suffix}`)),
  );
  const school = search.학교검색.find(
    (entry) => entry[0] !== 0 && decodeString(entry[2]).startsWith(SCHOOL_NAME),
  )!;
  const codeIndex =
    Math.floor(Number(school[0]) / Number(capture(script, /학교검색\[i\]\[0\]\/(\d+)\)/))) +
    Number(capture(script, /학교검색\[i\]\[0\]\/\d+\)\+(\d+)/));
  const schoolCode = decodeString(school[codeIndex]);

  const timetablePrefix = capture(script, /\w+\('(\d+_)',storage\.sc,1,'1'\)/);
  const raw = await request<Record<string, unknown>>(btoa(`${timetablePrefix}${schoolCode}_0_1${suffix}`));
  const field = (pattern: RegExp) => raw[capture(script, pattern)];
  const names = (pattern: RegExp) => (field(pattern) as unknown[]).map(decodeString);

  return {
    ...(raw as ComciData),
    originalTimetable: field(
      /=\w+\(자료\.(\w+)\[학년\]\[반\]\[요일\]\[교시\]\);\w+=\w+\(자료\.\w+\[학년\]/,
    ) as ComciData["originalTimetable"],
    dailyTimetable: field(
      /;\w+=\w+\(자료\.(\w+)\[학년\]\[반\]\[요일\]\[교시\]\);if\(자료\.강의실==1\)/,
    ) as ComciData["dailyTimetable"],
    roomData: field(/var m3=자료\.(\w+)\[/) as ComciData["roomData"],
    teacherNames: names(/성명=\w+\(자료\.(\w+)\[th\]\)/),
    subjectNames: names(/과목명=\w+\(자료\.(\w+)\[sb\]\)/),
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
