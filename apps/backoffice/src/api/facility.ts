import { getInstance } from "./client.ts";

export type FacilityReportType = "suggest" | "broken" | "danger";
export type FacilityReportStatus =
  | "waiting"
  | "under_review"
  | "working"
  | "done"
  | "ignored"
  | "failed";

export type FacilityUser = {
  id: string;
  email: string;
  name: string;
  permission: string;
};

export type FacilityImg = {
  id: string;
  name: string;
  location: string;
  created_at: string;
};

export type FacilityComment = {
  id: string;
  text: string;
  created_at: string;
  userId: string;
  parentId: string;
  commentParentId: string | null;
};

export type FacilityReportListItem = {
  id: string;
  status: string; // DB default is "Waiting" (capital W) — normalize with .toLowerCase()
  report_type: FacilityReportType;
  subject: string;
  body: string;
  created_at: string;
  user: FacilityUser;
};

export type FacilityReport = FacilityReportListItem & {
  comment: FacilityComment[]; // comments have userId only — no user relation joined
  file: FacilityImg[];
};

const client = getInstance();

export async function getFacilityReportList(page?: number): Promise<FacilityReportListItem[]> {
  return (await client.get(`/manage/facility/list${page ? `?page=${page}` : ""}`)).data;
}

export async function getFacilityReport(id: string): Promise<FacilityReport> {
  return (await client.get(`/manage/facility?id=${id}`)).data;
}

export async function deleteFacilityReport(id: string): Promise<void> {
  return (await client.delete(`/manage/facility?id=${id}`)).data;
}

export async function changeFacilityReportStatus(
  id: string,
  status: FacilityReportStatus,
): Promise<FacilityReportListItem> {
  return (await client.patch("/manage/facility/status", { id, status })).data;
}

export async function postFacilityComment(
  post: string,
  text: string,
  parent_comment?: string | null,
): Promise<FacilityComment> {
  return (
    await client.post("/manage/facility/comment", {
      post,
      text,
      parent_comment: parent_comment ?? null,
    })
  ).data;
}

export async function deleteFacilityComment(id: string): Promise<void> {
  return (await client.delete(`/manage/facility/comment?id=${id}`)).data;
}

export async function deleteFacilityImg(id: string): Promise<void> {
  return (await client.delete(`/manage/facility/img?id=${id}`)).data;
}

// The /manage/facility/img endpoint bypasses the NestJS response wrapper (raw Fastify stream),
// so axios cannot be used here. Use fetch with credentials instead.
export async function getFacilityImgObjectUrl(id: string): Promise<string> {
  const base =
    location.host !== "localhost:5173" && location.host !== "localhost:5174"
      ? `https://api.${location.host
          .split(".")
          .reverse()
          .filter((_, i) => i <= 1)
          .reverse()
          .join(".")}`
      : "http://localhost:3000";
  const res = await fetch(`${base}/manage/facility/img?id=${id}`, { credentials: "include" });
  return URL.createObjectURL(await res.blob());
}
