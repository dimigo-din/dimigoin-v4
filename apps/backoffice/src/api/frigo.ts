import { getPersonalInformation, type PersonalInformation } from "./auth.ts";
import { getInstance } from "./client.ts";
import type { User } from "./user.ts";

const client = getInstance();

export type FrigoPeriod = FrigoPeriodPayload & { id: string };

export type FrigoPeriodPayload = {
  apply_start_day: number;
  apply_start_hour: number;
  apply_end_day: number;
  apply_end_hour: number;
  grade: number;
};

export type FrigoApply = {
  id: string;
  week: string;
  timing: string;
  reason: string;
  audit_reason: string;
  approved: boolean | null;
  user: User & PersonalInformation;
};

export type FrigoTiming = "afterschool" | "dinner" | "after_1st_study" | "after_2nd_study";

export type FrigoApplyPayload = {
  timing: FrigoTiming;
  reason: string;
  user: string;
};

export const getFrigoPeriods = async (): Promise<FrigoPeriod[]> => {
  return (await client.get("/manage/frigo/period")).data;
};

export const setFrigoPeriod = async (data: FrigoPeriodPayload): Promise<FrigoPeriod> => {
  return (await client.post("/manage/frigo/period", data)).data;
};

export const deleteFrigoPeriod = async (id: string): Promise<FrigoPeriod> => {
  return (await client.delete("/manage/frigo/period?id=" + id)).data;
};

export const getFrigoApplies = async (): Promise<FrigoApply[]> => {
  const apply = (await client.get("/manage/frigo")).data;
  const users: string[] = apply.map((a: FrigoApply) => a.user.email);
  const personalInformation = await getPersonalInformation(users);
  return apply.map((a: FrigoApply, i: number) => {
    return { ...a, user: { ...a.user, ...personalInformation[i] } };
  });
};

export const createFrigoApply = async (data: FrigoApplyPayload): Promise<FrigoApply> => {
  return (await client.post("/manage/frigo", data)).data;
};

export const deleteFrigoApply = async (id: string): Promise<FrigoApply> => {
  return (await client.delete("/manage/frigo?id=" + id)).data;
};

export const auditFrigo = async (
  id: string,
  approved: boolean | null,
  audit_reason?: string,
): Promise<FrigoApply> => {
  return await client.patch("/manage/frigo", { id: id, approved, audit_reason });
};
