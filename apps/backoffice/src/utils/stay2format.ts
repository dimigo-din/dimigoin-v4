// utils/stay2excel.ts
"use client";

import JSZip from "jszip";
import XLSX from "xlsx-js-style";
import type { Stay, StayApply } from "../api/stay.ts";

// ===== 유틸: 날짜 처리 (Intl, ko-KR) =====
function parseDate(input?: string): Date {
  if (!input) return new Date();
  const d = new Date(input); // 주로 ISO(YYYY-MM-DD) 가정
  return isNaN(d.getTime()) ? new Date() : d;
}
function displayDateKorean(input?: string): string {
  const d = parseDate(input);
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(d); // 예: "2025년 8월 30일 토요일"
}

// ===== 스타일 =====
const border = {
  top: { style: "thin", color: { rgb: "FF834B" } },
  bottom: { style: "thin", color: { rgb: "FF834B" } },
  left: { style: "thin", color: { rgb: "FF834B" } },
  right: { style: "thin", color: { rgb: "FF834B" } },
} as const;

const borderNone = {
  left: { style: "none", color: { rgb: "FF834B" } },
  right: { style: "none", color: { rgb: "FF834B" } },
} as const;

const base: XLSX.CellStyle = {
  font: { name: "맑은 고딕", sz: 11 },
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
  border: border,
};

const title: XLSX.CellStyle = {
  ...base,
  font: { name: "맑은 고딕", sz: 11, bold: true },
  fill: { fgColor: { rgb: "FCDBC8" } }, // 제목/강조 배경색
};

const header: XLSX.CellStyle = {
  ...base,
  font: { name: "맑은 고딕", sz: 11, bold: true },
  fill: { fgColor: { rgb: "FCDBC8" } },
};

// 범위 순회 도우미
function rangeEach(
  ws: XLSX.WorkSheet,
  ref: string,
  fn: (addr: string, cell: XLSX.CellObject) => void,
) {
  const r = XLSX.utils.decode_range(ref);
  for (let R = r.s.r; R <= r.e.r; R++) {
    for (let C = r.s.c; C <= r.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      ws[addr] = ws[addr] ?? { t: "s", v: "" }; // 테두리 표시용 빈셀 생성
      fn(addr, ws[addr] as XLSX.CellObject);
    }
  }
}

// ===== 자동맞춤(가로1·세로1) 강제 패치 (JSZip) =====
// xlsx(ArrayBuffer) -> zip 열기 -> sheet1.xml에 fitToPage="1" 주입 + pageSetup 수정 -> 새 ArrayBuffer 반환
async function forceFitToOnePage(xlsxArray: ArrayBuffer): Promise<ArrayBuffer> {
  const zip = await JSZip.loadAsync(xlsxArray);

  // 0) 워크북 → 첫 시트의 실제 경로를 동적으로 찾기
  const WB_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main";
  const REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const PKG_NS = "http://schemas.openxmlformats.org/package/2006/relationships";

  const wbXml = await zip.file("xl/workbook.xml")!.async("string");
  const wbDoc = new DOMParser().parseFromString(wbXml, "application/xml");
  const firstSheet = wbDoc.getElementsByTagNameNS(WB_NS, "sheet")[0];
  if (!firstSheet) throw new Error("No sheet found in workbook.xml");
  const sheetRelId = firstSheet.getAttributeNS(REL_NS, "id")!;

  const relsXml = await zip.file("xl/_rels/workbook.xml.rels")!.async("string");
  const relsDoc = new DOMParser().parseFromString(relsXml, "application/xml");
  const rels = Array.from(relsDoc.getElementsByTagNameNS(PKG_NS, "Relationship"));
  const target = rels.find((r) => r.getAttribute("Id") === sheetRelId)?.getAttribute("Target");
  if (!target) throw new Error("Cannot resolve sheet target from rels");
  // target 예: "worksheets/sheet1.xml"
  const sheetPath = `xl/${target.replace(/^\/?xl\//, "")}`;

  // 1) 시트 XML 로드
  const xmlText = await zip.file(sheetPath)!.async("string");
  const NS = WB_NS; // 메인 네임스페이스
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");

  // 2) <sheetPr><pageSetUpPr fitToPage="1"/>
  let sheetPr = doc.getElementsByTagNameNS(NS, "sheetPr")[0];
  if (!sheetPr) {
    sheetPr = doc.createElementNS(NS, "sheetPr");
    // 관례상 맨 앞에 두는 편이 안전
    const ws = doc.documentElement;
    ws.insertBefore(sheetPr, ws.firstChild);
  }
  let pageSetUpPr = sheetPr.getElementsByTagNameNS(NS, "pageSetUpPr")[0];
  if (!pageSetUpPr) {
    pageSetUpPr = doc.createElementNS(NS, "pageSetUpPr");
    sheetPr.appendChild(pageSetUpPr);
  }
  pageSetUpPr.setAttribute("fitToPage", "1");

  // 3) <pageSetup>에 자동맞춤 파라미터 설정
  let pageSetup = doc.getElementsByTagNameNS(NS, "pageSetup")[0];
  if (!pageSetup) {
    pageSetup = doc.createElementNS(NS, "pageSetup");
    const ws = doc.documentElement;
    const pageMargins = ws.getElementsByTagNameNS(NS, "pageMargins")[0];
    if (pageMargins && pageMargins.nextSibling) {
      ws.insertBefore(pageSetup, pageMargins.nextSibling);
    } else {
      ws.appendChild(pageSetup);
    }
  }
  // "자동 맞춤" 모드에선 scale이 간섭하므로 제거
  if (pageSetup.hasAttribute("scale")) pageSetup.removeAttribute("scale");
  pageSetup.setAttribute("fitToWidth", "1");
  pageSetup.setAttribute("fitToHeight", "1");
  // (원하면) 용지/방향 고정
  // pageSetup.setAttribute("paperSize", "9");        // A4
  // pageSetup.setAttribute("orientation", "portrait");

  // 4) 저장
  const out = new XMLSerializer().serializeToString(doc);
  zip.file(sheetPath, out);
  return await zip.generateAsync({ type: "arraybuffer" });
}

export async function stay2excel(apply: StayApply[], stay: Stay, opt: { masking?: boolean } = {}) {
  const wb = XLSX.utils.book_new();

  // 44행 x 9열 (A..I)
  const rows = 44,
    cols = 9;
  const aoa: (string | number)[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ""),
  );

  // 상단
  aoa[0][0] = "잔류 학생 명단 (DIMIGOIN.IO)"; // A1

  // masking에 따른 헤더 구성
  if (!opt.masking) {
    // 내부용: 결재란 표시
    aoa[0][5] = "결\n재"; // F1
    aoa[0][6] = "근무교사";
    aoa[0][7] = "부장";
    aoa[0][8] = "생활관장";
  }
  // masking이 true면 결재란 관련 헤더는 비워둠

  // 날짜 (제목과 같은 색)
  aoa[1][0] = `${displayDateKorean(stay.stay_from)}`; // A2

  // 헤더
  aoa[3][0] = "학년"; // A4
  aoa[3][1] = "반"; // B4
  aoa[3][2] = "인원"; // C4
  aoa[3][3] = "구분"; // D4
  aoa[3][4] = `잔류자 목록`; // E4
  aoa[3][8] = "비고"; // I4

  // 본문: 1~3학년, 각 1~6반, 남/여 + 소계
  type Block = { grade: 1 | 2 | 3; startRow: number; subtotalRow: number };
  const blocks: Block[] = [
    { grade: 1, startRow: 5, subtotalRow: 17 },
    { grade: 2, startRow: 18, subtotalRow: 30 },
    { grade: 3, startRow: 31, subtotalRow: 43 },
  ];
  const mask = opt.masking
    ? (name: string) => {
        if (name.length >= 3) {
          return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
        } else if (name.length === 2) {
          return name[0] + "*";
        } else {
          return name;
        }
      }
    : (s: string) => s;

  let allMaleSum = 0;
  let allFemaleSum = 0;

  for (const { grade, startRow, subtotalRow } of blocks) {
    let maleSum = 0;
    let femaleSum = 0;

    // 학년 라벨
    aoa[startRow - 1][0] = `${grade}학년`;

    for (let klass = 1; klass <= 6; klass++) {
      const maleRow = startRow - 1 + (klass - 1) * 2;
      const femaleRow = maleRow + 1;

      aoa[maleRow][1] = `${klass}반`; // B
      aoa[maleRow][3] = "남"; // D
      aoa[femaleRow][3] = "여";

      const list = apply.filter((a) => a.user.grade === grade && a.user.class === klass);
      const males = list.filter((a) => a.user.gender === "male");
      const females = list.filter((a) => a.user.gender === "female");

      const cnt = males.length + females.length;
      aoa[maleRow][2] = `${cnt}명`; // C (짝줄 병합 상단 줄에만 기재)

      // 이름(학생명) — 좌측 정렬 예정 (E열 스타일로 제어)
      aoa[maleRow][4] = males.map((a) => mask(a.user.name)).join(" ");
      aoa[femaleRow][4] = females.map((a) => mask(a.user.name)).join(" ");

      maleSum += males.length;
      femaleSum += females.length;
    }

    // 소계
    const r = subtotalRow - 1;
    aoa[r][1] = "소계"; // B
    aoa[r][3] = `${maleSum + femaleSum}명`; // D
    aoa[r][4] = `(남${maleSum} + 여${femaleSum})`; // E (E:H 병합영역 시작)

    allMaleSum += maleSum;
    allFemaleSum += femaleSum;
  }
  aoa[43][0] = "총원";
  aoa[43][3] = `${allMaleSum + allFemaleSum}명`;
  aoa[43][4] = `(남${allMaleSum}명 + 여${allFemaleSum}명)`;

  // 시트 생성
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!ref"] = "A1:I44";

  // 열/행 크기
  ws["!cols"] = [
    { wch: 6 },
    { wch: 6 },
    { wch: 6 },
    { wch: 6 },
    { wch: 36 },
    { wch: 4 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
  ];
  ws["!rows"] = [];
  ws["!rows"][0] = { hpt: 18 };
  ws["!rows"][1] = { hpt: 28 };
  ws["!rows"][2] = { hpt: 10 };
  ws["!rows"][3] = { hpt: 22 };

  // 병합 - masking 여부에 따라 다르게 설정
  const baseMerges = [
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }, // A2:E2 (날짜)
    // 본문 E:H 병합(각 줄 & 소계 & 총원)
    ...[
      4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
      29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43,
    ].map((r) => ({ s: { r, c: 4 }, e: { r, c: 7 } })),
    // C, B 짝줄 병합(반)
    ...[4, 6, 8, 10, 12, 14].map((top) => ({ s: { r: top, c: 2 }, e: { r: top + 1, c: 2 } })),
    ...[17, 19, 21, 23, 25, 27].map((top) => ({ s: { r: top, c: 2 }, e: { r: top + 1, c: 2 } })),
    ...[30, 32, 34, 36, 38, 40].map((top) => ({ s: { r: top, c: 2 }, e: { r: top + 1, c: 2 } })),
    ...[4, 6, 8, 10, 12, 14].map((top) => ({ s: { r: top, c: 1 }, e: { r: top + 1, c: 1 } })),
    ...[17, 19, 21, 23, 25, 27].map((top) => ({ s: { r: top, c: 1 }, e: { r: top + 1, c: 1 } })),
    ...[30, 32, 34, 36, 38, 40].map((top) => ({ s: { r: top, c: 1 }, e: { r: top + 1, c: 1 } })),
    // 학년(A열) 병합
    { s: { r: 4, c: 0 }, e: { r: 16, c: 0 } },
    { s: { r: 17, c: 0 }, e: { r: 29, c: 0 } },
    { s: { r: 30, c: 0 }, e: { r: 42, c: 0 } },
    // 소계 B:C 병합
    { s: { r: 16, c: 1 }, e: { r: 16, c: 2 } },
    { s: { r: 29, c: 1 }, e: { r: 29, c: 2 } },
    { s: { r: 42, c: 1 }, e: { r: 42, c: 2 } },
    // 총원 병합
    { s: { r: 43, c: 0 }, e: { r: 43, c: 2 } },
  ];

  if (opt.masking) {
    // masking이 true일 때: 제목과 날짜를 I열까지 확장, 헤더도 I열까지 확장
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // A1:I1 (제목)
      { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }, // A2:I2 (날짜)
      { s: { r: 3, c: 4 }, e: { r: 3, c: 8 } }, // E4:I4 (잔류자 목록 헤더)
      // 기존 baseMerges에서 A2:E2 제외하고 추가
      ...[
        4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
        28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43,
      ].map((r) => ({ s: { r, c: 4 }, e: { r, c: 7 } })),
      // C, B 짝줄 병합(반)
      ...[4, 6, 8, 10, 12, 14].map((top) => ({ s: { r: top, c: 2 }, e: { r: top + 1, c: 2 } })),
      ...[17, 19, 21, 23, 25, 27].map((top) => ({ s: { r: top, c: 2 }, e: { r: top + 1, c: 2 } })),
      ...[30, 32, 34, 36, 38, 40].map((top) => ({ s: { r: top, c: 2 }, e: { r: top + 1, c: 2 } })),
      ...[4, 6, 8, 10, 12, 14].map((top) => ({ s: { r: top, c: 1 }, e: { r: top + 1, c: 1 } })),
      ...[17, 19, 21, 23, 25, 27].map((top) => ({ s: { r: top, c: 1 }, e: { r: top + 1, c: 1 } })),
      ...[30, 32, 34, 36, 38, 40].map((top) => ({ s: { r: top, c: 1 }, e: { r: top + 1, c: 1 } })),
      // 학년(A열) 병합
      { s: { r: 4, c: 0 }, e: { r: 16, c: 0 } },
      { s: { r: 17, c: 0 }, e: { r: 29, c: 0 } },
      { s: { r: 30, c: 0 }, e: { r: 42, c: 0 } },
      // 소계 B:C 병합
      { s: { r: 16, c: 1 }, e: { r: 16, c: 2 } },
      { s: { r: 29, c: 1 }, e: { r: 29, c: 2 } },
      { s: { r: 42, c: 1 }, e: { r: 42, c: 2 } },
      // 총원 병합
      { s: { r: 43, c: 0 }, e: { r: 43, c: 2 } },
    ];
  } else {
    // masking이 false일 때: 기존과 동일
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // A1:E1 (제목)
      { s: { r: 0, c: 5 }, e: { r: 1, c: 5 } }, // F1:F2 (결재)
      { s: { r: 3, c: 4 }, e: { r: 3, c: 7 } }, // E4:H4 (잔류자 목록 헤더)
      ...baseMerges,
    ];
  }

  // ===== 스타일 일괄 적용 =====
  // 1) 전체 기본
  rangeEach(ws, `A1:I$44`, (_, cell) => {
    cell.s = { ...base };
  });

  // 2) 제목/결재란 - masking 여부에 따라 다르게 처리
  if (opt.masking) {
    // masking일 때: 제목만 스타일 적용
    ["A1"].forEach((a) => {
      if (ws[a]) ws[a].s = { ...title };
    });
  } else {
    // 내부용일 때: 제목과 결재란 모두 스타일 적용
    ["A1", "F1", "G1", "H1", "I1"].forEach((a) => {
      if (ws[a]) ws[a].s = { ...title };
    });
  }

  // 3) 날짜(A2)도 제목과 동일 색상
  if (ws["A2"]) ws["A2"].s = { ...title };

  // 4) 3행(빈 줄) 테두리 제거(선택)
  ["A3", "B3", "C3", "D3", "E3", "F3", "G3", "H3", "I3"].forEach((a) => {
    if (ws[a]) ws[a].s = { ...borderNone } as any;
  });

  // 5) 헤더(4행) - masking 여부에 관계없이 데이터가 있는 셀만 헤더 스타일 적용
  ["A4", "B4", "C4", "D4", "E4", "I4"].forEach((a) => {
    if (ws[a]) ws[a].s = { ...header };
  });

  // 6) A열 전체 — 제목과 같은 스타일
  for (let r = 1; r <= 44; r++) {
    const addr = `A${r}`;
    if (ws[addr] && addr !== "A3") ws[addr].s = { ...title };
  }

  // 7) 소계 행 전체 — 제목과 같은 스타일
  [17, 30, 43, 44].forEach((row) => {
    for (let c = 1; c <= 9; c++) {
      const addr = XLSX.utils.encode_cell({ r: row - 1, c: c - 1 });
      if (ws[addr]) ws[addr].s = { ...title };
    }
  });

  // 8) 학생명 칸(E열) — 데이터 줄만 왼쪽 정렬
  (
    [
      [5, 16], // 1학년
      [18, 29], // 2학년
      [31, 42], // 3학년
    ] as Array<[number, number]>
  ).forEach(([start, end]) => {
    for (let r = start; r <= end; r++) {
      const addr = `E${r}`;
      if (!ws[addr]) ws[addr] = { t: "s", v: "" } as any;
      const cur = ws[addr].s || {};
      ws[addr].s = {
        ...cur,
        alignment: {
          ...(cur.alignment || {}),
          horizontal: "left",
          vertical: "center",
          wrapText: true,
        },
        border: cur.border ?? border,
        font: cur.font ?? { name: "맑은 고딕", sz: 11 },
      };
    }
  });

  // 인쇄 여백
  ws["!margins"] = {
    left: 0.5,
    right: 0.5,
    top: 0.75,
    bottom: 0.75,
    header: 0.3,
    footer: 0.3,
  };

  XLSX.utils.book_append_sheet(wb, ws, "잔류 명단");

  // === 저장: xlsx-js-style로 만들고 → JSZip으로 '자동맞춤 1x1' 패치 ===
  const raw = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const patched = await forceFitToOnePage(raw);

  const blob = new Blob([patched], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${opt.masking ? "외부용" : "생활관용"} 잔류 현황(${stay.stay_from} ~ ${stay.stay_to}).xlsx`;
  a.click();
  URL.revokeObjectURL(a.href);
}
