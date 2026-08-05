import { format } from "date-fns";
import { ko } from "date-fns/locale";
import printJS from "print-js";
import type { Stay, StayApply } from "../api/stay.ts";
import { stayFormat } from "../assets/stay_export_format.ts";
import { maskName } from "./maskName.ts";

export function stay2pdf(
  apply: StayApply[],
  stay: Stay,
  opt: { masking?: boolean } = {},
  filename: string,
) {
  const html = generateHtml(apply, stay, opt);
  document.title = filename.replace(/\.pdf$/i, "");

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const styleNodes = doc.querySelectorAll("style");
  let originalStyles = "";
  styleNodes.forEach((node) => {
    originalStyles += node.innerHTML;
  });

  const fallbackStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap');

    @page {
      size: A4;
      margin: 10mm 10mm 5mm 10mm;
    }

    body {
      margin: 0 !important;
      padding: 0 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      width: 100% !important;
      max-width: 100% !important;
      display: block;
      zoom: 0.95;
    }

    * {
      font-family: '함초롬바탕', 'Batang', 'Noto Sans KR', sans-serif;
      box-sizing: border-box;
    }

    table {
      width: 100% !important;
      border-collapse: collapse !important;
      table-layout: auto;
      font-size: 10pt;
      margin-bottom: 5px !important;
    }

    th {
      padding: 4px 2px;
      word-break: keep-all;
      border: none !important;
      text-align: center;
    }

    td {
      padding: 4px 2px;
      word-break: break-all;
      text-align: center;
    }

    tr {
      page-break-inside: avoid !important;
    }

    .logo {
      display: block;
      margin: 0 auto 10px auto !important;
      text-align: center;
      position: static !important;
      transform: none !important;
      break-inside: avoid;
      page-break-inside: avoid;
    }
  `;

  const bodyContent = doc.body.innerHTML || html;

  printJS({
    printable: bodyContent,
    type: "raw-html",
    style: originalStyles + fallbackStyles,
    documentTitle: document.title,
    scanStyles: false,
    font: "함초롬바탕",
    onError: (err) => console.error("PrintJS Error:", err),
  });
}

function generateHtml(apply: StayApply[], stay: Stay, opt: { masking?: boolean } = {}) {
  let html = stayFormat;

  const data: { [key: string]: number | string } = {};

  const formatDate = (d?: string | Date) =>
    d
      ? format(new Date(d), "MM-dd(eee)", { locale: ko })
      : format(new Date(), "yyyy년 MM월 dd일 eee", { locale: ko });

  const from = formatDate(stay.stay_from);
  const to = formatDate(stay.stay_to);
  if (from === to) {
    data["DATE"] = `${from} ${stay.name} 현황`;
  } else {
    data["DATE"] = `${from} ~ ${to} ${stay.name} 현황`;
  }

  data["TODAY"] = format(new Date(), "yyyy. MM. dd. 기준");
  for (let grade = 1; grade <= 6; grade++) {
    for (let uclass = 1; uclass <= 6; uclass++) {
      data[`${grade}_${uclass}_COUNT`] = apply.filter(
        (a) => a.user.grade === grade && a.user.class === uclass,
      ).length;
      const maleStudents = apply
        .filter(
          (a) => a.user.grade === grade && a.user.class === uclass && a.user.gender === "male",
        )
        .map((a) => (opt.masking ? maskName(a.user.name) : a.user.name));
      const femaleStudents = apply
        .filter(
          (a) => a.user.grade === grade && a.user.class === uclass && a.user.gender === "female",
        )
        .map((a) => (opt.masking ? maskName(a.user.name) : a.user.name));

      data[`${grade}_${uclass}_MALE`] = maleStudents.reduce((acc, name, index) => {
        if (index > 0 && index % 10 === 0) acc += "<br>";
        return acc + (index % 10 === 0 ? "" : "&nbsp;&nbsp;") + name;
      }, "");

      data[`${grade}_${uclass}_FEMALE`] = femaleStudents.reduce((acc, name, index) => {
        if (index > 0 && index % 10 === 0) acc += "<br>";
        return acc + (index % 10 === 0 ? "" : "&nbsp;&nbsp;") + name;
      }, "");
    }
  }

  // per grade
  for (let grade = 1; grade <= 6; grade++) {
    data[`${grade}_COUNT`] = apply.filter((a) => a.user.grade === grade).length;
    // data[`${grade}_MALE_COUNT`] = apply.filter((a) => a.user.grade === grade && a.user.gender === "male").length;
    // data[`${grade}_FEMALE_COUNT`] = apply.filter((a) => a.user.grade === grade && a.user.gender === "female").length;
  }

  // all
  data["COUNT"] = apply.length;
  data["MALE_COUNT"] = apply.filter((a) => a.user.gender === "male").length;
  data["FEMALE_COUNT"] = apply.filter((a) => a.user.gender === "female").length;

  //  replacing
  for (const key of Object.keys(data)) {
    html = html.replace(`{${key}}`, data[key].toString());
  }

  return html;
}
