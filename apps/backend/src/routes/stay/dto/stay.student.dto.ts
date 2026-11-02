import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsDateString, IsOptional, IsString, ValidateIf, ValidateNested } from "class-validator";

export class StayIdDTO {
  @ApiProperty()
  @IsString()
  id: string;
}

export class OutingDTO {
  @ApiProperty()
  @IsString()
  reason: string;

  @ApiProperty()
  @IsBoolean()
  breakfast_cancel: boolean;

  @ApiProperty()
  @IsBoolean()
  lunch_cancel: boolean;

  @ApiProperty()
  @IsBoolean()
  dinner_cancel: boolean;

  @ApiProperty({ nullable: true })
  @ValidateIf((outing: OutingDTO) => outing.from !== null || outing.to !== null)
  @IsDateString()
  from: string | null;

  @ApiProperty({ nullable: true })
  @ValidateIf((outing: OutingDTO) => outing.from !== null || outing.to !== null)
  @IsDateString()
  to: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsDateString()
  outing_date?: string | null;
}

export class StayApplyIdDTO {
  @ApiProperty()
  @IsString()
  id: string;
}

export class CreateUserStayApplyDTO {
  @ApiProperty()
  @IsString()
  stay: string;

  @ApiProperty()
  @IsString()
  stay_seat: string;

  @ApiProperty({ type: () => OutingDTO, isArray: true })
  @ValidateNested({ each: true })
  @Type(() => OutingDTO)
  outing: OutingDTO[];
}

export class AddStayOutingDTO {
  @ApiProperty()
  @IsString()
  apply_id: string;

  @ApiProperty({ type: () => OutingDTO })
  @ValidateNested()
  @Type(() => OutingDTO)
  outing: OutingDTO;
}

export class EditStayOutingDTO {
  @ApiProperty()
  @IsString()
  outing_id: string;

  @ApiProperty({ type: () => OutingDTO })
  @ValidateNested()
  @Type(() => OutingDTO)
  outing: OutingDTO;
}

export class StayOutingIdDTO {
  @ApiProperty()
  @IsString()
  id: string;
}
