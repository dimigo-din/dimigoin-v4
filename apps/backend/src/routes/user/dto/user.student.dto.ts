import { ApiProperty } from "@nestjs/swagger";
import type { LaundryApply, StayApply } from "#/db/schema";

export type ComciCell = number | string;

export class ApplyResponseDTO {
  @ApiProperty()
  stayApply: StayApply;

  @ApiProperty()
  laundryApply: LaundryApply;
}

export interface CachedTimetable {
  content: string;
  temp: boolean;
}

export interface ComciData {
  분리?: number;
  강의실?: number;
  변경알림?: number;
  동시그룹?: number[][];
  originalTimetable?: ComciCell[][][][];
  dailyTimetable?: ComciCell[][][][];
  roomData?: ComciCell[][][][];
  teacherNames?: string[];
  subjectNames?: string[];
}
