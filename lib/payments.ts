import type { PaymentInstance, PaymentSchedule, PaymentScheduleOverride, PayRecurrence } from "@/lib/types";

function toDate(iso: string): Date {
  return new Date(iso + "T00:00:00");
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function addMonths(d: Date, months: number): Date {
  const anchorDay = d.getDate();
  const copy = new Date(d.getFullYear(), d.getMonth() + months, 1);
  const daysInMonth = new Date(copy.getFullYear(), copy.getMonth() + 1, 0).getDate();
  copy.setDate(Math.min(anchorDay, daysInMonth));
  return copy;
}

/** Occurrence dates (ISO) for one recurring anchor date, within [rangeStart, rangeEnd] inclusive. */
export function occurrencesInRange(
  anchorIso: string,
  recurrence: PayRecurrence,
  rangeStart: Date,
  rangeEnd: Date,
): string[] {
  const anchor = toDate(anchorIso);
  const out: string[] = [];

  if (recurrence === "irregular") {
    if (anchor >= rangeStart && anchor <= rangeEnd) out.push(toIso(anchor));
    return out;
  }

  if (recurrence === "monthly") {
    // walk months near the range rather than from the anchor epoch, so old anchors stay cheap
    let cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth() - 1, 1);
    for (let i = 0; i < 4; i++) {
      const day = Math.min(
        anchor.getDate(),
        new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate(),
      );
      const occ = new Date(cursor.getFullYear(), cursor.getMonth(), day);
      if (occ >= anchor && occ >= rangeStart && occ <= rangeEnd) out.push(toIso(occ));
      cursor = addMonths(cursor, 1);
    }
    return out;
  }

  const stepDays = recurrence === "weekly" ? 7 : 14;
  if (anchor > rangeEnd) return out;
  const diffDays = Math.floor((rangeStart.getTime() - anchor.getTime()) / 86_400_000);
  const stepsToStart = Math.max(0, Math.floor(diffDays / stepDays));
  let cursor = addDays(anchor, stepsToStart * stepDays);
  while (cursor < rangeStart) cursor = addDays(cursor, stepDays);
  while (cursor <= rangeEnd) {
    out.push(toIso(cursor));
    cursor = addDays(cursor, stepDays);
  }
  return out;
}

export function buildPaymentInstances(
  schedules: PaymentSchedule[],
  overrides: PaymentScheduleOverride[],
  rangeStart: Date,
  rangeEnd: Date,
): PaymentInstance[] {
  const overrideMap = new Map<string, PaymentScheduleOverride>();
  overrides.forEach((o) => overrideMap.set(`${o.schedule_id}:${o.instance_date}`, o));

  const instances: PaymentInstance[] = [];

  // widen the generation window so an override can pull an instance in from just outside the visible range
  const wideStart = addDays(rangeStart, -31);
  const wideEnd = addDays(rangeEnd, 31);

  for (const schedule of schedules) {
    const occs = occurrencesInRange(schedule.anchor_date, schedule.recurrence, wideStart, wideEnd);
    for (const occDate of occs) {
      const key = `${schedule.id}:${occDate}`;
      const override = overrideMap.get(key);
      const finalDate = override ? override.new_date : occDate;
      if (!finalDate) continue; // skipped instance
      const d = toDate(finalDate);
      if (d < rangeStart || d > rangeEnd) continue;
      instances.push({
        id: key,
        scheduleId: schedule.id,
        date: finalDate,
        direction: schedule.direction,
        label: schedule.label,
        amount: override?.new_amount ?? schedule.amount,
        overridden: !!override,
      });
    }
  }

  return instances.sort((a, b) => a.date.localeCompare(b.date));
}
