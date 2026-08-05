import { format } from "date-fns";
import { getInstance } from "./client.ts";

const client = getInstance();

export type WakeupApply = {
  id: string;
  video_id: string;
  video_title: string;
  video_thumbnail: string;
  video_channel: string;
  week: string;
  gender: string;
  wakeupSongVote: {
    id: string;
    upvote: boolean;
  }[];
};

type WakeupApplyResponse = Omit<WakeupApply, "wakeupSongVote"> & {
  wakeup_song_vote?: WakeupApply["wakeupSongVote"];
  wakeupSongVote?: WakeupApply["wakeupSongVote"];
};

export type WakeupHistory = {
  id: string;
  video_id: string;
  date: string;
  gender: string;
  up: number;
  down: number;
};

export const getWakeupSongList = async (): Promise<WakeupApply[]> => {
  const response = (await client.get("/manage/wakeup")).data as WakeupApplyResponse[];

  return response.map((item) => ({
    ...item,
    wakeupSongVote: item.wakeupSongVote ?? item.wakeup_song_vote ?? [],
  }));
};

export const selectWakeupSong = async (id: string): Promise<WakeupApply> => {
  return (await client.post("/manage/wakeup", { id: id })).data;
};

export const deleteWakeupSong = async (id: string): Promise<WakeupApply> => {
  return (await client.delete("/manage/wakeup?id=" + id)).data;
};

export const getTodayWakeup = async (gender: "male" | "female"): Promise<WakeupHistory> => {
  const date = format(new Date(), "yyyy-MM-dd");
  return (await client.get("/wakeup/history?date=" + date + "&gender=" + gender)).data;
};
