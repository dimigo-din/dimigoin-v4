import { Module } from "@nestjs/common";
import { CustomCacheModule } from "$modules/cache.module";

import * as controllers from "./controllers";
import * as providers from "./providers";

@Module({
  imports: [CustomCacheModule],
  controllers: Object.values(controllers),
  providers: [...Object.values(providers)],
  exports: Object.values(providers),
})
export class LostfoundModule {}
