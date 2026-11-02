import { BadRequestException } from "@nestjs/common";

type OutingTimes = {
  from: string | null;
  to: string | null;
  outing_date?: string | null;
};

export function getOutingDate(outing: OutingTimes): string | null {
  if (outing.from === null && outing.to === null) {
    if (!outing.outing_date || !/^\d{4}-\d{2}-\d{2}$/.test(outing.outing_date)) {
      throw new BadRequestException("All-day outings require an outing_date (YYYY-MM-DD)");
    }
    return outing.outing_date;
  }

  if (typeof outing.from !== "string" || typeof outing.to !== "string" || outing.outing_date) {
    throw new BadRequestException("Timed outings require from and to, without an outing_date");
  }

  return null;
}
