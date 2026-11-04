import { expect, test } from "vitest";
import { UserStudentService } from "../src/routes/user/providers/user.student.service";

test("parses a fresh Comci timetable for 한국디지털미디어고등학", async () => {
  const cache = {
    getCachedTimetable: async () => undefined,
    setCachedTimetable: async () => undefined,
  };
  const userManage = { getRequiredUserDetail: async () => ({ grade: 2, class: 1 }) };
  const service = new UserStudentService(null as never, cache as never, userManage as never);

  const table = await service.getTimeTable({ id: "student" } as never);

  expect(table).toHaveLength(5);
  expect(table.every((day) => day.length === 8)).toBe(true);
  expect(table.flat().some((cell) => cell.content.length > 0)).toBe(true);
  expect(
    table
      .flat()
      .every((cell) => typeof cell.content === "string" && typeof cell.temp === "boolean"),
  ).toBe(true);
}, 20_000);
