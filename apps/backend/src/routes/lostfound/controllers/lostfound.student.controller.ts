import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from "@nestjs/common";
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CustomJwtAuthGuard } from "#auth/guards";
import { UseGuardsWithSwagger } from "#auth/guards/useGuards";
import { CurrentUser } from "$decorators/user.decorator";
import { ApiResponseFormat } from "$dto/response_format.dto";
import { UserJWT } from "$mapper/types";
import { ImageUploadInterceptor } from "~facility/interceptor/image-upload.interceptor";
import {
  GetReportListDTO,
  LostfoundReportIdDTO,
  LostfoundReportListResDTO,
  LostfoundReportResDTO,
  PostCommentDTO,
  ReportLostfoundDTO,
} from "~lostfound/dto";
import { LostfoundStudentService } from "~lostfound/providers";

@ApiTags("Lostfound Student")
@Controller("/student/lostfound")
@UseGuardsWithSwagger(CustomJwtAuthGuard)
export class LostfoundStudentController {
  constructor(private readonly lostfoundService: LostfoundStudentService) {}

  @ApiOperation({
    summary: "분실물 제보 목록",
    description:
      "분실물 제보 목록을 불러옵니다. mine=true 이면 본인이 작성한 제보만, mine=false 이면 본인 제보를 제외하고 내려줍니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: [LostfoundReportListResDTO],
  })
  @Get("/list")
  async getReportList(@CurrentUser() user: UserJWT, @Query() data: GetReportListDTO) {
    return await this.lostfoundService.reportList(user, data);
  }

  @ApiOperation({
    summary: "분실물 제보 불러오기",
    description: "특정 분실물 제보를 불러옵니다. ",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: LostfoundReportResDTO,
  })
  @Get("/")
  async getReport(@Query() data: LostfoundReportIdDTO) {
    return await this.lostfoundService.getReport(data);
  }

  @ApiOperation({
    summary: "분실물 제보",
    description:
      "잃어버린 물건을 제보합니다. 상태는 lost, pickup이 있습니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: LostfoundReportListResDTO,
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({ type: ReportLostfoundDTO })
  @Post("/")
  @UseInterceptors(ImageUploadInterceptor)
  async report(@CurrentUser() user: UserJWT, @Body() data: ReportLostfoundDTO) {
    return await this.lostfoundService.createReport(user, data, data.file || []);
  }

  @ApiOperation({
    summary: "회수 처리",
    description: "작성자 본인이 자신의 분실물 제보를 found 상태로 변경합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: LostfoundReportListResDTO,
  })
  @Patch("/found")
  async markFound(@CurrentUser() user: UserJWT, @Body() data: LostfoundReportIdDTO) {
    return await this.lostfoundService.markFound(user, data);
  }

  @ApiOperation({
    summary: "댓글 작성",
    description: "분실물 제보문에 댓글을 추가합니다. 삭제가 불가능합니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
  })
  @Post("/comment")
  async postComment(@CurrentUser() user: UserJWT, @Body() data: PostCommentDTO) {
    return await this.lostfoundService.writeComment(user, data);
  }
}
