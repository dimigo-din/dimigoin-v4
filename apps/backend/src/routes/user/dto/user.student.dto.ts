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
  자료102?: ComciCell[][][][];
  자료160?: ComciCell[][][][];
  자료184?: ComciCell[][][][];
  자료107?: string[];
  자료182?: string[];
}
