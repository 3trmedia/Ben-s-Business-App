"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import type {
  Client,
  PaymentDirection,
  PaymentInstance,
  PaymentSchedule,
  PaymentScheduleOverride,
  PayRecurrence,
} from "@/lib/types";
import { buildPaymentInstances } from "@/lib/payments";
import { formatDateLong } from "@/lib/format";
import {
  PageHeader,
  Card,
  LoadingState,
  TextField,
  SelectField,
  PrimaryButton,
  GhostButton,
  Sheet,
  ConfirmModal,
  useConfirm,
} from "@/components/ui";

const supabase = createSupabaseClient();

const RECURRENCE_OPTIONS: { value: PayRecurrence; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "weekly", label: "Weekly" },
  { value: "irregular", label: "Irregular" },
];

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function money(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

type ScheduleSheetState =
  | { mode: "add"; anchorDate: string }
  | { mode: "edit"; schedule: PaymentSchedule }
  | null;

export default function PaymentsPage() {
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));
  const [clients, setClients] = useState<Client[]>([]);
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [overrides, setOverrides] = useState<PaymentScheduleOverride[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [schedulesOpen, setSchedulesOpen] = useState(false);
  const [scheduleSheet, setScheduleSheet] = useState<ScheduleSheetState>(null);
  const confirm = useConfirm();

  async function load() {
    const [{ data: clientRows }, { data: scheduleRows }, { data: overrideRows }] =
      await Promise.all([
        supabase.from("clients").select("*"),
        supabase.from("payment_schedules").select("*"),
        supabase.from("payment_schedule_overrides").select("*"),
      ]);
    setClients(clientRows ?? []);
    setSchedules(scheduleRows ?? []);
    setOverrides(overrideRows ?? []);
    setLoaded(true);
  }

  useEffect(() => {
    async function run() {
      await load();
    }
    run();
  }, []);

  const gridStart = useMemo(() => {
    const d = new Date(monthCursor);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }, [monthCursor]);

  const gridEnd = useMemo(() => {
    const d = addMonths(monthCursor, 1);
    d.setDate(d.getDate() - 1); // last day of monthCursor's month
    d.setDate(d.getDate() + (6 - d.getDay()));
    return d;
  }, [monthCursor]);

  const monthEnd = useMemo(() => {
    const d = addMonths(monthCursor, 1);
    d.setDate(d.getDate() - 1);
    return d;
  }, [monthCursor]);

  const instances = useMemo(
    () => buildPaymentInstances(schedules, overrides, gridStart, gridEnd),
    [schedules, overrides, gridStart, gridEnd],
  );

  const monthInstances = useMemo(
    () => buildPaymentInstances(schedules, overrides, monthCursor, monthEnd),
    [schedules, overrides, monthCursor, monthEnd],
  );

  const totals = useMemo(() => {
    let inbound = 0;
    let outbound = 0;
    for (const i of monthInstances) {
      const amt = i.amount ?? 0;
      if (i.direction === "incoming") inbound += amt;
      else outbound += amt;
    }
    return { inbound, outbound, net: inbound - outbound };
  }, [monthInstances]);

  const instancesByDay = useMemo(() => {
    const map = new Map<string, PaymentInstance[]>();
    instances.forEach((i) => {
      const list = map.get(i.date) ?? [];
      list.push(i);
      map.set(i.date, list);
    });
    return map;
  }, [instances]);

  const days = useMemo(() => {
    const list: Date[] = [];
    const cursor = new Date(gridStart);
    while (cursor <= gridEnd) {
      list.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return list;
  }, [gridStart, gridEnd]);

  async function moveInstance(instance: PaymentInstance, newDate: string | null) {
    await supabase.from("payment_schedule_overrides").upsert(
      {
        schedule_id: instance.scheduleId,
        instance_date: instance.date,
        new_date: newDate,
      },
      { onConflict: "schedule_id,instance_date" },
    );
    setSelectedDay(null);
    load();
  }

  async function saveSchedule(input: {
    id?: string;
    direction: PaymentDirection;
    label: string;
    amount: string;
    clientId: string;
    anchorDate: string;
    recurrence: PayRecurrence;
  }) {
    const payload = {
      direction: input.direction,
      label: input.label,
      amount: input.amount ? Number(input.amount) : null,
      client_id: input.clientId || null,
      anchor_date: input.anchorDate,
      recurrence: input.recurrence,
    };
    if (input.id) {
      await supabase.from("payment_schedules").update(payload).eq("id", input.id);
    } else {
      await supabase.from("payment_schedules").insert(payload);
    }
    setScheduleSheet(null);
    setSelectedDay(null);
    load();
  }

  async function deleteSchedule(id: string) {
    await supabase.from("payment_schedules").delete().eq("id", id);
    setScheduleSheet(null);
    setSelectedDay(null);
    load();
  }

  if (!loaded) return <LoadingState />;

  const monthLabel = monthCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const todayIso = new Date().toISOString().slice(0, 10);
  const dayInstances = selectedDay ? instancesByDay.get(selectedDay) ?? [] : [];

  return (
    <div>
      <PageHeader
        title="Payments Calendar"
        subtitle="Manual tracking — update as you go"
        action={
          <button
            onClick={() => setSchedulesOpen(true)}
            className="rounded-full border border-border px-3 py-1.5 text-[12px] font-medium text-text-muted active:bg-surface-raised"
          >
            Schedules
          </button>
        }
      />

      <div className="px-5 pb-5">
        <div className="text-center">
          <div className="text-[12px] font-medium tracking-wide text-text-faint">
            {monthLabel} net
          </div>
          <div
            className="font-display text-3xl font-medium"
            style={{ color: totals.net >= 0 ? "var(--accent-strong)" : "var(--danger)" }}
          >
            {totals.net >= 0 ? "+" : "−"}
            {money(Math.abs(totals.net))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div
            className="rounded-2xl border border-border p-3.5 text-center"
            style={{ background: "var(--accent-soft)" }}
          >
            <div className="text-[11px] font-medium tracking-wide" style={{ color: "var(--accent-strong)" }}>
              Inbound
            </div>
            <div className="mt-0.5 font-display text-xl font-medium text-text">
              {money(totals.inbound)}
            </div>
          </div>
          <div
            className="rounded-2xl border border-border p-3.5 text-center"
            style={{ background: "var(--warn-soft)" }}
          >
            <div className="text-[11px] font-medium tracking-wide" style={{ color: "var(--warn)" }}>
              Outbound
            </div>
            <div className="mt-0.5 font-display text-xl font-medium text-text">
              {money(totals.outbound)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-5 pb-3">
        <button
          onClick={() => setMonthCursor(addMonths(monthCursor, -1))}
          aria-label="Previous month"
          className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted active:bg-surface-raised"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="font-display text-base font-medium text-text">{monthLabel}</span>
        <button
          onClick={() => setMonthCursor(addMonths(monthCursor, 1))}
          aria-label="Next month"
          className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted active:bg-surface-raised"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="px-5">
        <div className="grid grid-cols-7 gap-1 pb-1.5">
          {WEEKDAY_LABELS.map((w, i) => (
            <div key={i} className="text-center text-[11px] font-medium text-text-faint">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const iso = d.toISOString().slice(0, 10);
            const inMonth = d.getMonth() === monthCursor.getMonth();
            const dayList = instancesByDay.get(iso) ?? [];
            const hasIncoming = dayList.some((i) => i.direction === "incoming");
            const hasOutgoing = dayList.some((i) => i.direction === "outgoing");
            return (
              <button
                key={iso}
                onClick={() => setSelectedDay(iso)}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl"
                style={{
                  background: iso === todayIso ? "var(--accent-soft)" : "transparent",
                  opacity: inMonth ? 1 : 0.35,
                }}
              >
                <span
                  className="text-[13px]"
                  style={{
                    color: iso === todayIso ? "var(--accent-strong)" : "var(--text)",
                    fontWeight: iso === todayIso ? 600 : 400,
                  }}
                >
                  {d.getDate()}
                </span>
                <div className="flex h-1.5 gap-0.5">
                  {hasIncoming && (
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
                  )}
                  {hasOutgoing && (
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--warn)" }} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4 px-5 text-[12px] text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--accent)" }} />
          Incoming
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--warn)" }} />
          Outgoing
        </span>
      </div>

      {/* Day sheet: existing instances that day + add-a-schedule shortcut */}
      <Sheet
        open={selectedDay !== null}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? formatDateLong(selectedDay) : ""}
      >
        <div className="flex flex-col gap-2.5">
          {dayInstances.length === 0 && (
            <p className="text-[13px] text-text-muted">Nothing scheduled this day.</p>
          )}
          {dayInstances.map((instance) => {
            const schedule = schedules.find((s) => s.id === instance.scheduleId);
            return (
              <DayInstanceRow
                key={instance.id}
                instance={instance}
                onMove={(newDate) => moveInstance(instance, newDate)}
                onSkip={() => moveInstance(instance, null)}
                onEditSeries={() => schedule && setScheduleSheet({ mode: "edit", schedule })}
              />
            );
          })}
          {selectedDay && (
            <GhostButton
              onClick={() => setScheduleSheet({ mode: "add", anchorDate: selectedDay })}
            >
              + Add a payment schedule starting here
            </GhostButton>
          )}
        </div>
      </Sheet>

      {/* Full schedule list */}
      <Sheet open={schedulesOpen} onClose={() => setSchedulesOpen(false)} title="Payment schedules">
        <div className="flex flex-col gap-2.5">
          {schedules.length === 0 && (
            <p className="text-[13px] text-text-muted">No schedules yet.</p>
          )}
          {[...schedules]
            .sort((a, b) => a.direction.localeCompare(b.direction) || a.label.localeCompare(b.label))
            .map((s) => (
              <Card key={s.id} className="flex items-center justify-between gap-3 p-3.5">
                <div>
                  <div className="flex items-center gap-2 text-[14px] font-medium text-text">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: s.direction === "incoming" ? "var(--accent)" : "var(--warn)" }}
                    />
                    {s.label}
                  </div>
                  <div className="mt-0.5 text-[12px] text-text-faint">
                    {s.amount ? `${money(s.amount)} · ` : ""}
                    {RECURRENCE_OPTIONS.find((o) => o.value === s.recurrence)?.label} · anchor{" "}
                    {s.anchor_date}
                  </div>
                </div>
                <button
                  onClick={() => setScheduleSheet({ mode: "edit", schedule: s })}
                  className="text-[12px] font-medium"
                  style={{ color: "var(--accent)" }}
                >
                  Edit
                </button>
              </Card>
            ))}
          <PrimaryButton
            onClick={() =>
              setScheduleSheet({ mode: "add", anchorDate: new Date().toISOString().slice(0, 10) })
            }
          >
            Add payment schedule
          </PrimaryButton>
        </div>
      </Sheet>

      {/* Add / edit a schedule */}
      <Sheet
        open={scheduleSheet !== null}
        onClose={() => setScheduleSheet(null)}
        title={scheduleSheet?.mode === "edit" ? "Edit schedule" : "New payment schedule"}
      >
        {scheduleSheet && (
          <ScheduleForm
            clients={clients}
            initial={scheduleSheet.mode === "edit" ? scheduleSheet.schedule : undefined}
            defaultAnchorDate={scheduleSheet.mode === "add" ? scheduleSheet.anchorDate : undefined}
            onSubmit={saveSchedule}
            onDelete={
              scheduleSheet.mode === "edit"
                ? () => confirm.ask(() => deleteSchedule((scheduleSheet.schedule as PaymentSchedule).id))
                : undefined
            }
          />
        )}
      </Sheet>

      <ConfirmModal
        open={confirm.open}
        title="Delete this payment schedule?"
        body="Removes the whole recurring schedule and any one-off adjustments made to it. This can't be undone."
        onConfirm={confirm.confirm}
        onCancel={confirm.cancel}
      />
    </div>
  );
}

function DayInstanceRow({
  instance,
  onMove,
  onSkip,
  onEditSeries,
}: {
  instance: PaymentInstance;
  onMove: (newDate: string) => void;
  onSkip: () => void;
  onEditSeries: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [newDate, setNewDate] = useState(instance.date);

  return (
    <Card className="p-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: instance.direction === "incoming" ? "var(--accent)" : "var(--warn)" }}
          />
          <div>
            <div className="text-[14px] font-medium text-text">{instance.label}</div>
            <div className="text-[12px] text-text-faint">
              {instance.direction === "incoming" ? "Incoming" : "Outgoing"}
              {instance.amount ? ` · ${money(instance.amount)}` : ""}
              {instance.overridden ? " · adjusted" : ""}
            </div>
          </div>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="text-[12px] font-medium"
          style={{ color: "var(--accent)" }}
        >
          {editing ? "Close" : "Edit"}
        </button>
      </div>

      {editing && (
        <div className="mt-3 flex flex-col gap-2.5 border-t border-border pt-3">
          <div className="flex items-end gap-2">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-surface-raised px-3 py-2 text-[14px] text-text focus:outline-none focus:border-accent"
            />
            <button
              onClick={() => onMove(newDate)}
              className="rounded-lg px-3 py-2 text-[13px] font-medium"
              style={{ background: "var(--accent)", color: "var(--accent-on)" }}
            >
              Move this one
            </button>
          </div>
          <div className="flex gap-3">
            <button onClick={onSkip} className="text-[12px] text-danger">
              Skip this occurrence
            </button>
            <button onClick={onEditSeries} className="text-[12px] font-medium" style={{ color: "var(--accent)" }}>
              Edit whole series →
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

function ScheduleForm({
  clients,
  initial,
  defaultAnchorDate,
  onSubmit,
  onDelete,
}: {
  clients: Client[];
  initial?: PaymentSchedule;
  defaultAnchorDate?: string;
  onSubmit: (input: {
    id?: string;
    direction: PaymentDirection;
    label: string;
    amount: string;
    clientId: string;
    anchorDate: string;
    recurrence: PayRecurrence;
  }) => void;
  onDelete?: () => void;
}) {
  const [direction, setDirection] = useState<PaymentDirection>(initial?.direction ?? "incoming");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [amount, setAmount] = useState(initial?.amount != null ? String(initial.amount) : "");
  const [clientId, setClientId] = useState(initial?.client_id ?? "");
  const [anchorDate, setAnchorDate] = useState(initial?.anchor_date ?? defaultAnchorDate ?? "");
  const [recurrence, setRecurrence] = useState<PayRecurrence>(initial?.recurrence ?? "monthly");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!label.trim() || !anchorDate) return;
        onSubmit({
          id: initial?.id,
          direction,
          label: label.trim(),
          amount,
          clientId,
          anchorDate,
          recurrence,
        });
      }}
      className="flex flex-col gap-4"
    >
      <SelectField
        label="Direction"
        value={direction}
        onChange={setDirection}
        options={[
          { value: "incoming", label: "Incoming (someone pays me)" },
          { value: "outgoing", label: "Outgoing (I pay someone)" },
        ]}
      />

      {direction === "incoming" && clients.length > 0 && (
        <SelectField
          label="Link to client (optional)"
          value={clientId}
          onChange={(v) => {
            setClientId(v);
            if (v && !label) {
              const c = clients.find((c) => c.id === v);
              if (c) setLabel(c.name);
            }
          }}
          options={[{ value: "", label: "None" }, ...clients.map((c) => ({ value: c.id, label: c.name }))]}
        />
      )}

      <TextField
        label="Label"
        value={label}
        onChange={setLabel}
        placeholder={direction === "incoming" ? "Client or company name" : "Who's being paid"}
      />

      <TextField label="Amount" type="number" value={amount} onChange={setAmount} placeholder="1000" />

      <div className="grid grid-cols-2 gap-3">
        <TextField label="Date" type="date" value={anchorDate} onChange={setAnchorDate} />
        <SelectField label="Recurs" value={recurrence} onChange={setRecurrence} options={RECURRENCE_OPTIONS} />
      </div>

      <PrimaryButton type="submit">{initial ? "Save changes" : "Add schedule"}</PrimaryButton>
      {onDelete && <GhostButton onClick={onDelete}>Delete this schedule</GhostButton>}
    </form>
  );
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, months: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + months, 1);
}
