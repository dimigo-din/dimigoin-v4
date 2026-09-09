import { Body, Controller, Get, HttpStatus, Post, Query, UseInterceptors } from "@nestjs/common";
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
    description: "분실물 제보 목록을 불러옵니다. ",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: [LostfoundReportListResDTO],
  })
  @Get("/list")
  async getReportList(@Query() data: GetReportListDTO) {
    return await this.lostfoundService.reportList(data);
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
    description: "잃어버린 물건이나 주운 물건을 제보합니다. ",
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
