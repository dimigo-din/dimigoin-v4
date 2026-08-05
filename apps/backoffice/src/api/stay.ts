import { getPersonalInformation, type PersonalInformation } from "./auth.ts";
import { getInstance } from "./client.ts";
import type { User } from "./user.ts";

const client = getInstance();

export type StayPresetListItem = {
  id: string;
  name: string;
};

export type StayPreset = {
  name: string;
  only_readingRoom: boolean;
  stay_stay: {
    id: string;
    target: "1_male" | "1_female" | "2_male" | "2_female" | "3_male" | "3_females";
    range: string;
  }[];
};

export type StayScheduleListItem = {
  id: string;
  name: string;
};

export type StaySchedule = {
  name: string;
  stayApplyPeriod: {
    grade: 1 | 2 | 3;
    apply_start_day: number;
    apply_start_hour: number;
    apply_end_day: number;
    apply_end_hour: number;
  }[];
  stay_from: number;
  stay_to: number;
  outing_day: number[];
  staySeatPreset: string;
};

export type StayListItem = {
  id: string;
  name: string;
  stay_from: string;
  stay_to: string;
};

export type Stay = {
  id: string;
  name: string;
  stay_from: string;
  stay_to: string;
  outing_day: string[];
  stay_apply_period_stay: {
    id: string;
    grade: 1 | 2 | 3;
    apply_start: string;
    apply_end: string;
  }[];
  stay_seat_preset: {
    id: string;
    name: string;
    only_readingRoom: boolean;
    stay_seat_preset_range: {
      id: string;
      target: "1_male" | "1_female" | "2_male" | "2_female" | "3_male" | "3_female";
      range: string;
    }[];
  };
};

export type CreateStayPayload = {
  name: string;
  stay_from: string;
  stay_to: string;
  outing_day: string[];
  stay_apply_period: {
    grade: 1 | 2 | 3;
    start: string;
    end: string;
  }[];
  seat_preset: string;
};

export type StayApply = {
  id: string;
  stay_seat: string;
  outing: {
    id: string;
    reason: string;
    breakfast_cancel: boolean;
    lunch_cancel: boolean;
    dinner_cancel: boolean;
    from: string;
    to: string;
    approved: boolean | null;
    audit_reason: string;
  }[];
  user: User & PersonalInformation;
};

export type StayApplyPayload = {
  stay: string;
  user: string;
  stay_seat: string;
  outing: {
    reason: string;
    breakfast_cancel: boolean;
    lunch_cancel: boolean;
    dinner_cancel: boolean;
    from: string;
    to: string;
  }[];
};

export type Outing = {
  id: string;
  reason: string;
  breakfast_cancel: boolean;
  lunch_cancel: boolean;
  dinner_cancel: boolean;
  from: string;
  to: string;
  approved: boolean | null;
  audit_reason: string;
};

export async function getStayPresetList(): Promise<StayPresetListItem[]> {
  return (await client.get("/manage/stay/seat/preset/list")).data;
}

export async function getStayPreset(id: string): Promise<StayPreset & { id: string }> {
  return (await client.get("/manage/stay/seat/preset?id=" + id)).data;
}

export async function createStayPreset(payload: StayPreset): Promise<StayPreset & { id: string }> {
  return (await client.post("/manage/stay/seat/preset", payload)).data;
}

export async function updateStayPreset(
  payload: StayPreset & { id: string },
): Promise<StayPreset & { id: string }> {
  return (await client.patch("/manage/stay/seat/preset", payload)).data;
}

export async function deleteStayPreset(id: string): Promise<StayPreset & { id: string }> {
  return (await client.delete("/manage/stay/seat/preset?id=" + id)).data;
}

export async function getStayScheduleList(): Promise<StayScheduleListItem[]> {
  return (await client.get("/manage/stay/schedule/list")).data;
}

export async function getStaySchedule(id: string): Promise<StaySchedule & { id: string }> {
  return (await client.get("/manage/stay/schedule?id=" + id)).data;
}

export async function createStaySchedule(payload: StaySchedule) {
  return (await client.post("/manage/stay/schedule", payload)).data;
}

export async function updateStaySchedule(
  payload: StaySchedule & { id: string },
): Promise<StaySchedule & { id: string }> {
  return (await client.patch("/manage/stay/schedule", payload)).data;
}

export async function deleteStaySchedule(id: string): Promise<StaySchedule & { id: string }> {
  return await client.delete("/manage/stay/schedule?id=" + id);
}

export async function getStayList(): Promise<StayListItem[]> {
  return (await client.get("/manage/stay/list")).data;
}

export async function getStay(id: string): Promise<Stay> {
  return (await client.get("/manage/stay?id=" + id)).data;
}

export async function createStay(payload: CreateStayPayload): Promise<Stay> {
  return (await client.post("/manage/stay", payload)).data;
}

export async function updateStay(payload: CreateStayPayload & { id: string }): Promise<Stay> {
  return (await client.patch("/manage/stay", payload)).data;
}

export async function deleteStay(id: string): Promise<Stay> {
  return (await client.delete("/manage/stay?id=" + id)).data;
}

export async function getStayApply(id: string): Promise<StayApply[]> {
  const apply: StayApply[] = (await client.get("/manage/stay/apply?id=" + id)).data;
  const users: string[] = apply.map((a) => a.user.email);
  const personalInformation = await getPersonalInformation(users);
  return apply.map((a, i) => {
    return { ...a, user: { ...a.user, ...personalInformation[i] } };
  });
}

export async function createStayApply(payload: StayApplyPayload): Promise<StayApply> {
  return (await client.post("/manage/stay/apply", payload)).data;
}

export async function updateStayApply(
  payload: StayApplyPayload & { id: string },
): Promise<StayApply> {
  return (await client.patch("/manage/stay/apply", payload)).data;
}

export async function deleteStayApply(id: string): Promise<StayApply> {
  return (await client.delete("/manage/stay/apply?id=" + id)).data;
}

export async function auditOuting(
  outing_id: string,
  reason: string,
  approved: boolean | null,
): Promise<Outing> {
  return (
    await client.patch("/manage/stay/outing/audit", {
      id: outing_id,
      reason: reason,
      approved: approved,
    })
  ).data;
}

export async function setMealCancel(
  outing_id: string,
  breakfast_cancel: boolean,
  lunch_cancel: boolean,
  dinner_cancel: boolean,
): Promise<Outing> {
  return (
    await client.patch("/manage/stay/outing/meal_cancel", {
      id: outing_id,
      breakfast_cancel: breakfast_cancel,
      lunch_cancel: lunch_cancel,
      dinner_cancel: dinner_cancel,
    })
  ).data;
}

export async function changeStaySeat(targets: string[], to: string): Promise<StayApply> {
  return (await client.post("/manage/stay/change_seat", { targets, to })).data;
}

export type SeatLayout = {
  left_columns: { name: string; max_row: number }[];
  right_columns: { name: string; max_row: number }[];
};

export async function getSeatLayout(): Promise<SeatLayout> {
  return (await client.get("/student/stay/seat-layout")).data;
}
