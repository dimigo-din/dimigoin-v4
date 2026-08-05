// gpted (merged-border fix)

import XLSX from "xlsx-js-style";
import type { FrigoApply } from "../api/frigo.ts";

function genderKo(g: string) {
  if (g === "male") return "남";
  if (g === "female") return "여";
  return g ?? "";
}

// ---- Types for strongly-typed cells/styles (no `any`) ----
type CellColor = { rgb?: string };
interface CellBorderSide {
  style?: string;
  color?: CellColor;
}
interface CellStyle {
  font?: { name?: string; sz?: number; bold?: boolean };
  alignment?: { horizontal?: string; vertical?: string };
  fill?: { fgColor?: CellColor };
  border?: {
    top?: CellBorderSide;
    bottom?: CellBorderSide;
    left?: CellBorderSide;
    right?: CellBorderSide;
  };
}

type StylableCell = XLSX.CellObject & { s?: CellStyle };

const ORANGE = "ED7D32"; // border color
const PEACH = "FFE6D8"; // header bg
const FONT = { name: "맑은 고딕", sz: 10 } as const;

const headerStyle: CellStyle = {
  font: { ...FONT, bold: true },
  alignment: { horizontal: "center", vertical: "center" },
  fill: { fgColor: { rgb: PEACH } },
  border: {
    top: { style: "thin", color: { rgb: ORANGE } },
    bottom: { style: "thin", color: { rgb: ORANGE } },
    left: { style: "thin", color: { rgb: ORANGE } },
    right: { style: "thin", color: { rgb: ORANGE } },
  },
};

const cellStyle: CellStyle = {
  font: { ...FONT },
  alignment: { horizontal: "center", vertical: "center" },
  border: {
    top: { style: "thin", color: { rgb: ORANGE } },
    bottom: { style: "thin", color: { rgb: ORANGE } },
    left: { style: "thin", color: { rgb: ORANGE } },
    right: { style: "thin", color: { rgb: ORANGE } },
  },
};

const titleStyle: CellStyle = {
  font: { name: "맑은 고딕", sz: 14, bold: true },
  alignment: { horizontal: "center", vertical: "center" },
  fill: { fgColor: { rgb: PEACH } },
  border: {
    top: { style: "thin", color: { rgb: ORANGE } },
    bottom: { style: "thin", color: { rgb: ORANGE } },
    left: { style: "thin", color: { rgb: ORANGE } },
    right: { style: "thin", color: { rgb: ORANGE } },
  },
};

const totalStyle: CellStyle = {
  font: { ...FONT, bold: true },
  alignment: { horizontal: "center", vertical: "center" },
  fill: { fgColor: { rgb: PEACH } },
};

const gradeClassStyle: CellStyle = {
  font: { ...FONT, bold: true },
  alignment: { horizontal: "center", vertical: "center" },
  border: {
    top: { style: "thin", color: { rgb: ORANGE } },
    bottom: { style: "thin", color: { rgb: ORANGE } },
    left: { style: "thin", color: { rgb: ORANGE } },
    right: { style: "thin", color: { rgb: ORANGE } },
  },
};

const timing = {
  afterschool: "방과후",
  dinner: "저녁 시간",
  after_1st_study: "야자1T",
  after_2nd_study: "야자2T",
} as const;

type TimingKey = keyof typeof timing;

function createSheetTitle(date: Date, grade?: number): string {
  const md = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
  }).format(date);
  const dow = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", weekday: "short" })
    .format(date)
    .replace("요일", "");
  const now = new Date();
  const currentMd = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
  }).format(now);
  const currentDow = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", weekday: "short" })
    .format(now)
    .replace("요일", "");
  const currentHm = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  const gradeText = grade ? `${grade}학년 ` : "";
  return `${md}(${dow}) ${gradeText}금요귀가 신청 현황 (${currentMd} ${currentDow} ${currentHm} 기준)`;
}

/* ===================== 핵심 유틸: 병합 셀 테두리 안정화 ===================== */
// 셀을 보장(없으면 생성) - 값은 빈 문자열로 두고 스타일만 입힐 수 있게
const ensureCell = (ws: XLSX.WorkSheet, r: number, c: number): StylableCell => {
  const ref = XLSX.utils.encode_cell({ r, c });
  const cell = (ws[ref] ??= { t: "s", v: "" }) as StylableCell;
  return cell;
};

// delete 대신 값만 비우기 (Repair 방지 + 스타일 가능)
const clearMergedCell = (ws: XLSX.WorkSheet, r: number, c: number) => {
  const cell = ensureCell(ws, r, c);
  cell.t = "s";
  cell.v = "";
};

type BorderSide = "top" | "bottom" | "left" | "right";
const setBorder = (cell: StylableCell, side: BorderSide, rgb = ORANGE) => {
  cell.s ??= {};
  cell.s.border ??= {};
  (cell.s.border as any)[side] = { style: "thin", color: { rgb } };
};

// 병합 범위 외곽선(Outline)만 그리기
const strokeOutline = (ws: XLSX.WorkSheet, range: XLSX.Range, rgb = ORANGE) => {
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const isTop = r === range.s.r;
      const isBottom = r === range.e.r;
      const isLeft = c === range.s.c;
      const isRight = c === range.e.c;
      if (!(isTop || isBottom || isLeft || isRight)) continue;
      const cell = ensureCell(ws, r, c);
      if (isTop) setBorder(cell, "top", rgb);
      if (isBottom) setBorder(cell, "bottom", rgb);
      if (isLeft) setBorder(cell, "left", rgb);
      if (isRight) setBorder(cell, "right", rgb);
    }
  }
};
/* ======================================================================== */

function applyGridStyle(ws: XLSX.WorkSheet) {
  if (!ws["!ref"]) return;
  const range = XLSX.utils.decode_range(ws["!ref"]!);

  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[cellRef] as StylableCell | undefined;
      if (!cell) continue;

      if (R === 1) {
        // 헤더 행
        cell.s = headerStyle;
      } else if (R === 0) {
        // 제목 행
        cell.s = titleStyle;
      } else if (R === range.e.r) {
        // 마지막 행 (총원)
        cell.s = totalStyle;
      } else {
        // 일반 데이터 행
        if (C >= 0 && C <= 2) {
          // 학년-반-인원 열들
          cell.s = gradeClassStyle;
        } else {
          cell.s = cellStyle;
        }
      }
    }
  }
}

export type ExportOptions = {
  filename?: string;
};

export function ExportFrigoAppliesToExcel(applies: FrigoApply[], opts: ExportOptions = {}) {
  const filename =
    (opts.filename &&
      (opts.filename.endsWith(".xlsx") ? opts.filename : `${opts.filename}.xlsx`)) ||
    `금요귀가 신청 현황.xlsx`;

  // Columns
  const headers = ["학년", "반", "인원", "학번", "이름", "성별", "사유", "귀가시간", "비고"];

  // ---- helper to build one worksheet from a subset of applies ----
  const buildSheet = (subset: FrigoApply[], date: Date, grade?: number): XLSX.WorkSheet => {
    type Header = (typeof headers)[number];
    type Row = { [K in Header]: string | number };

    // Normalize + sort (학년, 반, 번호)
    const rows: Row[] = [...subset]
      .sort(
        (a, b) =>
          (Number(a.user.grade) || 0) - (Number(b.user.grade) || 0) ||
          (Number(a.user.class) || 0) - (Number(b.user.class) || 0) ||
          (Number(a.user.number) || 0) - (Number(b.user.number) || 0),
      )
      .map((a) => {
        const grade = a.user.grade ?? "";
        const klass = a.user.class ?? "";
        const number = a.user.number ?? "";
        const hakbun = `${grade}${klass}${String(number).padStart(2, "0")}`;

        return {
          학년: a.user.grade ?? "",
          반: a.user.class ?? "",
          인원: 1, // temporary; will be replaced with merged count per class later
          학번: hakbun,
          이름: a.user.name,
          성별: genderKo(a.user.gender),
          사유: a.reason || "",
          귀가시간: timing[a.timing as TimingKey] || "",
          비고: "",
        };
      });

    const title = createSheetTitle(date, grade);

    // 총원 행 추가
    const totalCount = rows.length;
    const totalRow = [
      `총원 (${totalCount}명)`, // 학년-반-인원 통합
      "",
      "", // 병합될 빈 셀들
      "",
      "",
      "",
      "",
      "",
      "", // 나머지 빈 셀들
    ];
    const aoa: (string | number)[][] = [
      [title, ...Array(headers.length - 1).fill("")],
      headers,
      ...rows.map((r) => headers.map((h) => r[h])),
      totalRow,
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    (ws["!merges"] as XLSX.Range[] | undefined) ??= [];

    // 제목 행 병합
    (ws["!merges"] as XLSX.Range[]).push({ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } });

    // 총원 행 병합 - 학년-반-인원 (0-2열)
    const lastRowIndex = 2 + rows.length;
    (ws["!merges"] as XLSX.Range[]).push({
      s: { r: lastRowIndex, c: 0 },
      e: { r: lastRowIndex, c: 2 },
    });

    // 총원 행 병합 - 나머지 칸들 (3-8열)
    (ws["!merges"] as XLSX.Range[]).push({
      s: { r: lastRowIndex, c: 3 },
      e: { r: lastRowIndex, c: headers.length - 1 },
    });

    // 병합된 타이틀/총원 셀의 하위 셀들: 값만 비우기(셀 유지)
    for (let c = 1; c < headers.length; c++) clearMergedCell(ws, 0, c); // 타이틀 병합 내부
    for (let c = 1; c <= 2; c++) clearMergedCell(ws, lastRowIndex, c); // 총원 왼쪽 병합 내부
    for (let c = 4; c < headers.length; c++) clearMergedCell(ws, lastRowIndex, c); // 총원 오른쪽 병합 내부

    const get = (row: number, col: number) =>
      ws[XLSX.utils.encode_cell({ r: row, c: col })]?.v as string | number | undefined;

    // Compute merges for 학년(column 0), 반(column 1), 인원(column 2)
    const startRow = 2; // data begins at row index 2 in AOA (0: title, 1: header)
    let r = startRow;
    while (r < startRow + rows.length) {
      const gradeVal = get(r, 0);
      // Find grade block
      let r2 = r;
      while (r2 < startRow + rows.length && get(r2, 0) === gradeVal) r2++;

      // Merge 학년 column over [r, r2-1]
      if (r2 - r > 1) {
        (ws["!merges"] as XLSX.Range[]).push({ s: { r, c: 0 }, e: { r: r2 - 1, c: 0 } });
        for (let q = r + 1; q < r2; q++) clearMergedCell(ws, q, 0);
      }

      // Within grade block, group by 반 for merges in 반/인원
      let k = r;
      while (k < r2) {
        const klass = get(k, 1);
        let k2 = k;
        while (k2 < r2 && get(k2, 1) === klass) k2++;
        const count = k2 - k;

        if (count > 1) {
          // 반 병합 + 하단 셀 값 비우기
          (ws["!merges"] as XLSX.Range[]).push({ s: { r: k, c: 1 }, e: { r: k2 - 1, c: 1 } });
          for (let q = k + 1; q < k2; q++) clearMergedCell(ws, q, 1);

          // 인원 병합 + 상단 "N명" + 하단 셀 값 비우기
          (ws["!merges"] as XLSX.Range[]).push({ s: { r: k, c: 2 }, e: { r: k2 - 1, c: 2 } });
          const topRef = XLSX.utils.encode_cell({ r: k, c: 2 });
          const topCell = (ws[topRef] ??= { t: "s", v: "" }) as StylableCell;
          topCell.t = "s";
          topCell.v = `${count}명`;
          for (let q = k + 1; q < k2; q++) clearMergedCell(ws, q, 2);
        } else {
          // 인원 1명 표시(병합 없음)
          const oneRef = XLSX.utils.encode_cell({ r: k, c: 2 });
          const oneCell = (ws[oneRef] ??= { t: "s", v: "" }) as StylableCell;
          oneCell.t = "s";
          oneCell.v = "1명";
        }

        k = k2;
      }

      r = r2;
    }

    // 표 스타일 먼저 일괄 적용
    applyGridStyle(ws);

    // 병합된 모든 영역의 외곽선을 마지막에 “덮어쓰기”로 보강
    const merges = ws["!merges"] as XLSX.Range[];
    if (Array.isArray(merges)) {
      for (const m of merges) strokeOutline(ws, m, ORANGE);
    }

    // 행 높이
    (ws["!rows"] as XLSX.RowInfo[]) = [
      { hpt: 45 }, // 제목 행
      { hpt: 30 }, // 헤더 행
      ...Array(rows.length).fill({ hpt: 20 }), // 데이터 행들
      { hpt: 30 }, // 총원 행
    ];

    // 열 너비(가독성 보강) - 필요시 조절
    (ws["!cols"] as XLSX.ColInfo[]) = [
      { wch: 6 }, // 학년
      { wch: 6 }, // 반
      { wch: 6 }, // 인원
      { wch: 10 }, // 학번
      { wch: 10 }, // 이름
      { wch: 6 }, // 성별
      { wch: 16 }, // 사유
      { wch: 10 }, // 귀가시간
      { wch: 16 }, // 비고
    ];

    return ws;
  };

  // ---- Build workbook with Stay period dates ----
  const wb = XLSX.utils.book_new();

  // Get date from first apply or use current date
  const currentDate =
    applies.length > 0 && applies[0].week
      ? new Date(new Date(applies[0].week).getTime() + 5 * 24 * 60 * 60 * 1000)
      : new Date();
  const dayOfWeek = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", weekday: "short" })
    .format(currentDate)
    .replace("요일", "");
  const dateApplies = applies;

  // 전체 시트
  const fullWs = buildSheet(dateApplies, currentDate);
  XLSX.utils.book_append_sheet(wb, fullWs, `전체(${dayOfWeek})`);

  // 학년별 시트
  const gradeNums = [1, 2, 3] as const;
  for (const g of gradeNums) {
    const gradeApplies = dateApplies.filter((a) => String(a.user.grade ?? "") === String(g));
    const gradeWs = buildSheet(gradeApplies, currentDate, g);
    XLSX.utils.book_append_sheet(wb, gradeWs, `${g}학년(${dayOfWeek})`);
  }

  XLSX.writeFile(wb, filename);
}
