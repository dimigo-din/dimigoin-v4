import { ApiProperty } from "@nestjs/swagger";

/** 제보에 첨부된 이미지 한 장. 리다이렉트 대신 바로 접근 가능한 링크를 내려줍니다. */
export class LostfoundImgResDTO {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  url: string;
}
