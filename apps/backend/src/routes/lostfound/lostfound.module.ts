import { Module } from "@nestjs/common";
import { CustomLoggerInterceptor } from "#/common/interceptors";
import { CustomCacheModule } from "$modules/cache.module";
import { PushModule } from "~push/push.module";

import * as controllers from "./controllers";
import * as providers from "./providers";
@Module({
  imports: [CustomCacheModule, PushModule],
  controllers: Object.values(controllers),
  providers: [...Object.values(providers)],
  exports: Object.values(providers),
})
export class LostfoundModule {}
