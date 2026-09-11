import { randomUUID } from "node:crypto";
import { TZDate } from "@date-fns/tz";
import { CACHE_MANAGER, Cache, CacheModule } from "@nestjs/cache-manager";
import { Inject, Logger, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { YoutubeSearchResults, YoutubeVideoItem } from "$mapper/types";
import { CachedTimetable } from "~user/dto";

class RedisStore {
  constructor(private readonly client: Redis) {}

  async get(key: string) {
    return this.client.get(key);
  }

  async set(key: string, value: string | Buffer | number, ttl?: number) {
    if (ttl) {
      await this.client.set(key, value, "PX", ttl);
    } else {
      await this.client.set(key, value);
    }
  }

  async delete(key: string) {
    return (await this.client.del(key)) > 0;
  }

  async clear() {
    return undefined;
  }
}

const cacheModule = CacheModule.registerAsync({
  isGlobal: true,
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => ({
    skipMemory: true,
    stores: [
      await (async () => {
        const client = new Redis(configService.get<string>("REDIS_HOST") ?? "localhost");
        await client.set("ok", "true");
        return new RedisStore(client);
      })(),
    ],
  }),
});

export class CacheService {
  private RATELIMIT_PREFIX = "ratelimit_";
  private FACILITY_REPORT_RATELIMIT_PREFIX = "facilityReportRatelimit_";
  private LOSTFOUND_REPORT_RATELIMIT_PREFIX = "lostfoundReportRatelimit_";
  private YOUTUBESEARCH_PREFIX = "youtubeSearch_";
  private NOTIFICATION_PREFIX = "notification_";
  private redis: Redis;
  private logger = new Logger(CacheService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {
    this.redis = new Redis(this.configService.get<string>("REDIS_HOST") ?? "localhost");
  }

  async musicSearchRateLimit(userid: string) {
    const lastRequest = await this.cacheManager.get<number>(this.RATELIMIT_PREFIX + userid);

    if (lastRequest === undefined || Date.now() - lastRequest > 2000) {
      await this.cacheManager.set(this.RATELIMIT_PREFIX + userid, Date.now());
      return true;
    } else {
      return false;
    }
  }

  async facilityReportRateLimit(userid: string) {
    const lastRequest = await this.cacheManager.get<number>(
      this.FACILITY_REPORT_RATELIMIT_PREFIX + userid,
    );

    if (lastRequest === undefined || Date.now() - lastRequest > 60_000) {
      await this.cacheManager.set(this.FACILITY_REPORT_RATELIMIT_PREFIX + userid, Date.now());
      return true;
    } else {
      return false;
    }
  }

  async lostfoundReportRateLimit(userid: string) {
    const lastRequest = await this.cacheManager.get<number>(
      this.LOSTFOUND_REPORT_RATELIMIT_PREFIX + userid,
    );

    if (lastRequest === undefined || Date.now() - lastRequest > 60_000) {
      await this.cacheManager.set(this.LOSTFOUND_REPORT_RATELIMIT_PREFIX + userid, Date.now());
      return true;
    } else {
      return false;
    }
  }

  async cacheSearchResults(results: YoutubeSearchResults) {
    for (const result of results.items) {
      await this.cacheManager.set(
        this.YOUTUBESEARCH_PREFIX + result.id.videoId,
        result,
        1000 * 60 * 10,
      );
      this.logger.log(this.YOUTUBESEARCH_PREFIX + result.id.videoId);
    }
  }

  async getCachedVideo(videoId: string) {
    return await this.cacheManager.get<YoutubeVideoItem>(this.YOUTUBESEARCH_PREFIX + videoId);
  }
  async setCachedTimetable(grade: number, klass: number, data: CachedTimetable[][]) {
    const cacheKey = `timetable:${grade}:${klass}`;
    const currentHour = new TZDate(Date(), "Asia/Seoul").getHours();
    if (8 < currentHour && currentHour < 9) {
      await this.cacheManager.set(cacheKey, data, 1000 * 60 * 5);
    } else {
      await this.cacheManager.set(cacheKey, data, 1000 * 60 * 60);
    }
  }

  async getCachedTimetable(grade: number, klass: number): Promise<CachedTimetable[][] | undefined> {
    const cacheKey = `timetable:${grade}:${klass}`;
    const cached = await this.cacheManager.get<CachedTimetable[][]>(cacheKey);
    return cached;
  }

  async isNotificationAlreadySent(id: string): Promise<boolean> {
    const key = this.NOTIFICATION_PREFIX + id;

    const isThisCluster = randomUUID();
    await this.redis.set(key, isThisCluster, "EX", "3600", "NX");
    return (await this.redis.get(key)) !== isThisCluster;
  }
}

@Module({
  imports: [cacheModule],
  providers: [CacheService],
  exports: [CacheService, cacheModule],
})
export class CustomCacheModule {}
