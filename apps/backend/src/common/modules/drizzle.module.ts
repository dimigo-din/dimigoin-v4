import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { relations } from "#/db";
import { CustomConfigModule } from "$modules/config.module";

export const DRIZZLE = Symbol("DRIZZLE");

const drizzleSchema = relations;

export type DrizzleDB = ReturnType<typeof drizzle<typeof drizzleSchema>>;

@Global()
@Module({
  imports: [CustomConfigModule],
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const url = new URL("postgresql://localhost");
        url.hostname = configService.getOrThrow<string>("DB_HOST");
        url.port = String(configService.getOrThrow<number>("DB_PORT"));
        url.username = configService.getOrThrow<string>("DB_USER");
        url.password = configService.getOrThrow<string>("DB_PASS");
        url.pathname = configService.getOrThrow<string>("DB_NAME");

        return drizzle<typeof drizzleSchema>(url.toString(), {
          relations: drizzleSchema,
          logger: process.env.NODE_ENV !== "prod",
        });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DrizzleModule {}
