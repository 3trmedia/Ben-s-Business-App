import type {
  Client,
  Employee,
  PaymentInstance,
  PaymentOverride,
  PayRecurrence,
} from "@/lib/types";

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

/** Occurrence dates (ISO) for one recurring pay date, within [rangeStart, rangeEnd] inclusive. */
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
  clients: Client[],
  employees: Employee[],
  overrides: PaymentOverride[],
  rangeStart: Date,
  rangeEnd: Date,
): PaymentInstance[] {
  const overrideMap = new Map<string, PaymentOverride>();
  overrides.forEach((o) =>
    overrideMap.set(`${o.source_type}:${o.source_id}:${o.instance_date}`, o),
  );

  const instances: PaymentInstance[] = [];

  // widen the generation window so an override can pull an instance in from just outside the visible range
  const wideStart = addDays(rangeStart, -31);
  const wideEnd = addDays(rangeEnd, 31);

  for (const client of clients) {
    if (!client.pay_date) continue;
    const occs = occurrencesInRange(client.pay_date, client.pay_recurrence, wideStart, wideEnd);
    for (const occDate of occs) {
      const key = `client:${client.id}:${occDate}`;
      const override = overrideMap.get(key);
      const finalDate = override ? override.new_date : occDate;
      if (!finalDate) continue; // skipped instance
      const d = toDate(finalDate);
      if (d < rangeStart || d > rangeEnd) continue;
      instances.push({
        id: key,
        date: finalDate,
        direction: "incoming",
        label: client.name,
        amount: null,
        sourceType: "client",
        sourceId: client.id,
        overridden: !!override,
      });
    }
  }

  for (const employee of employees) {
    if (!employee.pay_date) continue;
    const occs = occurrencesInRange(employee.pay_date, employee.pay_recurrence, wideStart, wideEnd);
    for (const occDate of occs) {
      const key = `employee:${employee.id}:${occDate}`;
      const override = overrideMap.get(key);
      const finalDate = override ? override.new_date : occDate;
      if (!finalDate) continue;
      const d = toDate(finalDate);
      if (d < rangeStart || d > rangeEnd) continue;
      instances.push({
        id: key,
        date: finalDate,
        direction: "outgoing",
        label: employee.name,
        amount: employee.pay_amount,
        sourceType: "employee",
        sourceId: employee.id,
        overridden: !!override,
      });
    }
  }

  return instances.sort((a, b) => a.date.localeCompare(b.date));
}
