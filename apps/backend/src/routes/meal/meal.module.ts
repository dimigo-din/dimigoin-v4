import { Module } from "@nestjs/common";
import { PushModule } from "#/routes/push/push.module";
import { UserModule } from "#/routes/user/user.module";
import * as controllers from "./controllers";
import * as providers from "./providers";
import { CacheService } from "$modules/cache.module";

@Module({
  imports: [UserModule, PushModule],
  controllers: [...Object.values(controllers)],
  providers: [...Object.values(providers), CacheService],
})
export class MealModule {}
