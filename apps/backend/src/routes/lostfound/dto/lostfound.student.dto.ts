import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, Matches } from "class-validator";
import type { User } from "#/db/schema";
import { type LostfoundStatus, LostfoundStatusValues } from "$mapper/types";
import { FileDTO } from "~facility/dto/facility.dto";
import { LostfoundImgResDTO } from "./lostfound.dto";

export class ReportLostfoundDTO {
  @ApiProperty({ enum: LostfoundStatusValues })
  @IsIn(LostfoundStatusValues)
  status: LostfoundStatus;

  @ApiProperty()
  @IsString()
  object_name: string;

  @ApiProperty()
  @IsString()
  last_seen_place: string;

  @ApiProperty()
  @IsString()
  body: string;

  @ApiProperty({
    type: "array",
    items: {
      type: "string",
      format: "binary",
    },
  })
  @IsOptional()
  file: FileDTO[];
}

export class PostCommentDTO {
  @ApiProperty()
  @IsString()
  post: string;

  @ApiProperty()
  @IsString()
  text: string;
}

export class GetReportListDTO {
  @ApiProperty({ required: false })
  @Matches(/^[0-9]+$/)
  @IsOptional()
  page: number;

  @ApiProperty({ required: false, enum: LostfoundStatusValues })
  @IsIn(LostfoundStatusValues)
  @IsOptional()
  status?: LostfoundStatus;
}

export class LostfoundReportIdDTO {
  @ApiProperty()
  @IsString()
  id: string;
}

export class LostfoundReportListResDTO {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: LostfoundStatusValues })
  status: LostfoundStatus;

  @ApiProperty()
  objectName: string;

  @ApiProperty()
  lastSeenPlace: string;

  @ApiProperty()
  body: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty({ type: [LostfoundImgResDTO] })
  img: LostfoundImgResDTO[];

  @ApiProperty()
  user: User;
}

export class LostfoundCommentResDTO {
  @ApiProperty()
  id: string;

  @ApiProperty()
  parentId: string;

  @ApiProperty()
  text: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  userId: string;
}

export class LostfoundReportResDTO extends LostfoundReportListResDTO {
  @ApiProperty({ type: [LostfoundCommentResDTO] })
  comment: LostfoundCommentResDTO[];
}
