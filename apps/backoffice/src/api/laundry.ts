import { getPersonalInformation, type PersonalInformation } from "./auth.ts";
import { getInstance } from "./client.ts";
import type { User } from "./user.ts";

const client = getInstance();

export type LaundryTimelineListItem = {
  id: string;
  name: string;
  enabled: boolean;
};

export type LaundryMachine = {
  id: string;
  type: "washer" | "dryer";
  name: string;
  gender: "male" | "female";
  enabled: boolean;
};

export type LaundryTime = {
  id: string;
  time: string;
  grade: (1 | 2 | 3)[];
  assigns: {
    laundry_machine: LaundryMachine;
    laundry_time: LaundryTime;
  }[];
};

export type LaundryTimeline = {
  id: string;
  name: string;
  scheduler: "primary" | "stay" | "vacation" | "etc";
  enabled: boolean;
  times: LaundryTime[];
};

export type LaundryTimelinePayload = {
  name: string;
  scheduler: "primary" | "stay" | "vacation" | "etc";
  times: {
    time: string;
    grade: (1 | 2 | 3)[];
    assigns: string[];
  }[];
};

export type LaundryMachinePayload = {
  type: "washer" | "dryer";
  name: string;
  gender: "male" | "female";
  enabled: boolean;
};

export type LaundryApply = {
  id: string;
  date: string;
  laundry_timeline: LaundryTimeline;
  laundry_time: LaundryTime;
  laundry_machine: LaundryMachine;
  user: User & PersonalInformation;
  created_at: string;
};

export type CreateLaundryApplyPayload = {
  laundryTime: string;
  machine: string;
  user: string;
};

export type UpdateLaundryApplyPayload = {
  id: string;
  userId: string;
};

export const getLaundryTimelineList = async (): Promise<LaundryTimelineListItem[]> => {
  return (await client.get("/manage/laundry/timeline/list")).data;
};

export const getLaundryTimeline = async (id: string): Promise<LaundryTimeline> => {
  return (await client.get("/manage/laundry/timeline?id=" + id)).data;
};

export const createLaundryTimeline = async (
  data: LaundryTimelinePayload,
): Promise<LaundryTimeline> => {
  return (await client.post("/manage/laundry/timeline", data)).data;
};

export const updateLaundryTimeline = async (
  data: LaundryTimelinePayload & { id: string },
): Promise<LaundryTimeline> => {
  return (await client.patch("/manage/laundry/timeline", data)).data;
};

export const deleteLaundryTimeline = async (id: string): Promise<LaundryTimeline> => {
  return (await client.delete("/manage/laundry/timeline?id=" + id)).data;
};

export const enableLaundryTimeline = async (id: string): Promise<LaundryTimeline> => {
  return (await client.patch("/manage/laundry/timeline/enable", { id: id })).data;
};

export const getLaundryMachineList = async (): Promise<LaundryMachine[]> => {
  return (await client.get("/manage/laundry/machine/list")).data;
};

export const createLaundryMachine = async (
  data: LaundryMachinePayload,
): Promise<LaundryMachine> => {
  return (await client.post("/manage/laundry/machine", data)).data;
};

export const updateLaundryMachine = async (
  data: LaundryMachinePayload & { id: string },
): Promise<LaundryMachine> => {
  return (await client.patch("/manage/laundry/machine", data)).data;
};

export const deleteLaundryMachine = async (id: string): Promise<LaundryMachine> => {
  return (await client.delete("/manage/laundry/machine?id=" + id)).data;
};

export const getLaundryApplyList = async (): Promise<LaundryApply[]> => {
  const apply: LaundryApply[] = (await client.get("/manage/laundry/apply/list")).data;
  const users: string[] = apply.map((a) => a.user.email);
  const personalInformation = await getPersonalInformation(users);
  return apply.map((a, i) => {
    return { ...a, user: { ...a.user, ...personalInformation[i] } };
  });
};

export const createLaundryApply = async (
  data: CreateLaundryApplyPayload,
): Promise<LaundryApply> => {
  return (await client.post("/manage/laundry/apply", data)).data;
};

export const updateLaundryApply = async (
  data: UpdateLaundryApplyPayload,
): Promise<LaundryApply> => {
  return (await client.patch("/manage/laundry/apply", data)).data;
};

export const deleteLaundryApply = async (id: string): Promise<LaundryApply> => {
  return (await client.delete("/manage/laundry/apply?id=" + id)).data;
};
