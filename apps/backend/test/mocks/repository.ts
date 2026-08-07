import { vi } from "vitest";
import type { DrizzleDB } from "$modules/drizzle.module";

export const createMockDrizzleDB = (): DrizzleDB => {
  const mockQuery: Record<string, unknown> = new Proxy(
    {},
    {
      get: () => ({
        findFirst: vi.fn(async () => null),
        findMany: vi.fn(async () => []),
      }),
    },
  );

  return {
    query: mockQuery,
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => []),
          returning: vi.fn(async () => []),
          execute: vi.fn(async () => []),
        })),
        limit: vi.fn(async () => []),
        leftJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            groupBy: vi.fn(async () => []),
          })),
        })),
        execute: vi.fn(async () => []),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(async () => [{}]),
        onConflictDoUpdate: vi.fn(() => ({
          returning: vi.fn(async () => [{}]),
        })),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(async () => [{}]),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(async () => [{}]),
      })),
    })),
    execute: vi.fn(async () => []),
  } as unknown as DrizzleDB;
};
