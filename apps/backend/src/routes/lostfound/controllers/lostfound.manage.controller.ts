import { Controller, Get, HttpStatus, Param, ParseUUIDPipe } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PermissionGuard } from "#/auth/guards/permission.guard";
import { PermissionEnum } from "#/common/mapper/permissions";
import { CustomJwtAuthGuard } from "#auth/guards";
import { UseGuardsWithSwagger } from "#auth/guards/useGuards";
import { ApiResponseFormat } from "$dto/response_format.dto";
import { LostfoundManageService } from "~lostfound/providers";

@ApiTags("Lostfound Manage")
@Controller("/manage/lostfound")
@UseGuardsWithSwagger(CustomJwtAuthGuard, PermissionGuard([PermissionEnum.MANAGE_PERMISSION]))
export class LostfoundManageController {
  constructor(private readonly lostfoundService: LostfoundManageService) {}

  @ApiOperation({
    summary: "분실물 게시물 알림 보내기",
    description: "디스코드에서 버튼을 눌러 모든 유저에게 알림을 보냅니다.",
  })
  @ApiResponseFormat({
    status: HttpStatus.OK,
    type: String,
  })
  @Get("/approve/:id")
  async approveNotification(@Param("id", ParseUUIDPipe) id: string) {
    const acquired = await this.lostfoundService.tryAcquire();
    if (!acquired) {
      return "다른 알림을 전송 중입니다. 잠시 후 다시 시도해주세요.";
    }

    try {
      if (await this.lostfoundService.isSent(id)) {
        return "이미 전송된 알림입니다.";
      }

      await this.lostfoundService.sendNotification(id);
      await this.lostfoundService.markSent(id);
      return "성공적으로 알림을 전송했습니다!";
    } finally {
      await this.lostfoundService.release();
    }
  }
}
