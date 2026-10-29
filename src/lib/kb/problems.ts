// The problems inside one merged ticket. causes.ts says which bug a report's date went through;
// desk-notes.json says which reports don't describe a flipped date at all. Both decide here.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

// `one-day` is not a cause in causes.ts: the date moves by a day, it does not flip. The desk
// found these by reading the bodies (desk-notes.json `oneDayMove`), so the list is what runs.
export type Problem = 'parser' | 'hint' | 'one-day';
export const PROBLEMS: readonly Problem[] = ['parser', 'hint', 'one-day'];

// Counted the desk's way (CauseTable): every report under the cause it is filed under by tenant.
// `one-day` reports stay counted there too and are listed again as a problem of their own.
export function problemsOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): (Problem | 'unplaced')[] {
  const filed = causeOf(r, t) ?? 'unplaced';
  return oneDayMove.includes(r.id) ? [filed, 'one-day'] : [filed];
}

export type ProblemGroup = {
  problem: Problem | 'unplaced';
  reports: Report[];
  // What intake tagged these reports as: tag → count.
  taggedAs: Record<string, number>;
  tenants: number;
  channels: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

export function splitTicket(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemGroup[] {
  const merged = uniqueById(all).filter((r) => r.mergedInto === ticket);
  const byProblem = new Map<ProblemGroup['problem'], Report[]>();
  for (const r of merged) {
    for (const p of problemsOf(r, tenantOf(r), oneDayMove)) byProblem.set(p, [...(byProblem.get(p) ?? []), r]);
  }
  const count = (rs: Report[], key: (r: Report) => string) =>
    rs.reduce<Record<string, number>>((n, r) => ({ ...n, [key(r)]: (n[key(r)] ?? 0) + 1 }), {});
  return [...byProblem.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        taggedAs: count(rs, (r) => r.meta.intakeTag),
        tenants: new Set(rs.map((r) => r.tenant)).size,
        channels: count(rs, (r) => r.channel),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
}
