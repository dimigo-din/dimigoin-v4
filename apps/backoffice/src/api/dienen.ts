import { getInstance } from "./client.ts";

const client = getInstance();

export type MealTimelineItem = {
  time: string;
  delayed_time: string | null;
  class: number[];
};

export type MealTimelineData = {
  1?: MealTimelineItem[];
  2?: MealTimelineItem[];
  3?: MealTimelineItem[];
};

export type CreateMealTimelinePayload = {
  start: string;
  end: string;
  data: MealTimelineData;
};

export type DelayMealTimelinePayload = {
  source: string;
  dest: string;
  description: string;
};

export const getMealTimeline = async (date?: string): Promise<MealTimelineData> => {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  return (await client.get(`/dienen/meal/timeline${query}`)).data;
};

export const createMealTimeline = async (payload: CreateMealTimelinePayload): Promise<void> => {
  await client.post("/dienen/meal/timeline", payload);
};

export const delayMealTimeline = async (payload: DelayMealTimelinePayload): Promise<void> => {
  await client.patch("/dienen/meal/timeline", payload);
};
