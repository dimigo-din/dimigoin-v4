import fastifyCookie from "@fastify/cookie";
import fastifyMultipart from "@fastify/multipart";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Global, Module, ValidationPipe } from "@nestjs/common";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test, TestingModule } from "@nestjs/testing";
import { vi } from "vitest";
import { AppModule } from "#app/app.module";
import { createMockDrizzleDB } from "#test/mocks/repository";
import * as interceptors from "$/interceptors";
import { CacheService, CustomCacheModule } from "$modules/cache.module";
import { DRIZZLE, DrizzleModule } from "$modules/drizzle.module";

@Global()
@Module({
  providers: [{ provide: DRIZZLE, useValue: createMockDrizzleDB() }],
  exports: [DRIZZLE],
})
class MockDatabaseModule {}

@Global()
@Module({
  providers: [
    {
      provide: CACHE_MANAGER,
      useValue: {
        get: vi.fn(async () => null),
        set: vi.fn(async () => undefined),
        del: vi.fn(async () => undefined),
        reset: vi.fn(async () => undefined),
      },
    },
    {
      provide: CacheService,
      useValue: {
        musicSearchRateLimit: vi.fn(async () => true),
        cacheSearchResults: vi.fn(async () => undefined),
        getCachedVideo: vi.fn(async () => null),
        getPersonalInformationVerifyTokenSecret: vi.fn(async () => "mock-secret"),
        setCachedTimetable: vi.fn(async () => undefined),
        getCachedTimetable: vi.fn(async () => undefined),
        isNotificationAlreadySent: vi.fn(async () => false),
      },
    },
  ],
  exports: [CACHE_MANAGER, CacheService],
})
class MockCacheModule {}

export class TestApp {
  private app: NestFastifyApplication;
  private readonly registerPlugin = (...args: Parameters<NestFastifyApplication["register"]>) =>
    this.app.register(...args);

  async initialize(): Promise<NestFastifyApplication> {
    const moduleFixtureBuilder = Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(DrizzleModule)
      .useModule(MockDatabaseModule)
      .overrideModule(CustomCacheModule)
      .useModule(MockCacheModule);

    const moduleFixture: TestingModule = await moduleFixtureBuilder.compile();

    this.app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter({
        bodyLimit: 50 * 1024 * 1024, // 50MB
      }),
    );

    await this.registerPlugin(
      fastifyCookie as unknown as Parameters<NestFastifyApplication["register"]>[0],
    );
    await this.registerPlugin(
      fastifyMultipart as unknown as Parameters<NestFastifyApplication["register"]>[0],
    );

    this.app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );

    this.app.useGlobalInterceptors(...Object.values(interceptors).map((i) => new i()));

    await this.app.init();

    await this.app.getHttpAdapter().getInstance().ready();

    return this.app;
  }

  async close(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
  }

  getApp(): NestFastifyApplication {
    return this.app;
  }
}
