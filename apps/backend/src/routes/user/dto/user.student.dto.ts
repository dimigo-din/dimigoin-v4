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
  동시그룹?: number[][];
  자료180?: ComciCell[][][][];
  자료156?: ComciCell[][][][];
  자료164?: ComciCell[][][][];
  자료122?: string[];
  자료194?: string[];
}
