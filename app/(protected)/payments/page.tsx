"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import type { Client, Employee, PaymentInstance, PaymentOverride, PayRecurrence } from "@/lib/types";
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

export default function PaymentsPage() {
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));
  const [clients, setClients] = useState<Client[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [overrides, setOverrides] = useState<PaymentOverride[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [employeesOpen, setEmployeesOpen] = useState(false);

  async function load() {
    const [{ data: clientRows }, { data: employeeRows }, { data: overrideRows }] =
      await Promise.all([
        supabase.from("clients").select("*"),
        supabase.from("employees").select("*"),
        supabase.from("payment_overrides").select("*"),
      ]);
    setClients(clientRows ?? []);
    setEmployees(employeeRows ?? []);
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

  const instances = useMemo(
    () => buildPaymentInstances(clients, employees, overrides, gridStart, gridEnd),
    [clients, employees, overrides, gridStart, gridEnd],
  );

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
    const [origSourceType, sourceId, origDate] = instance.id.split(":");
    await supabase.from("payment_overrides").upsert(
      {
        source_type: origSourceType,
        source_id: sourceId,
        instance_date: origDate,
        new_date: newDate,
      },
      { onConflict: "source_type,source_id,instance_date" },
    );
    setSelectedDay(null);
    load();
  }

  if (!loaded) return <LoadingState />;

  const monthLabel = monthCursor.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const todayIso = new Date().toISOString().slice(0, 10);
  const dayInstances = selectedDay ? instancesByDay.get(selectedDay) ?? [] : [];

  return (
    <div>
      <PageHeader
        title="Payments Calendar"
        subtitle="Incoming from clients, outgoing to the team"
        action={
          <button
            onClick={() => setEmployeesOpen(true)}
            className="rounded-full border border-border px-3 py-1.5 text-[12px] font-medium text-text-muted active:bg-surface-raised"
          >
            Team pay
          </button>
        }
      />

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
                onClick={() => dayList.length > 0 && setSelectedDay(iso)}
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

      <Sheet
        open={selectedDay !== null}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? formatDateLong(selectedDay) : ""}
      >
        <div className="flex flex-col gap-2.5">
          {dayInstances.map((instance) => (
            <DayInstanceRow
              key={instance.id}
              instance={instance}
              onMove={(newDate) => moveInstance(instance, newDate)}
              onSkip={() => moveInstance(instance, null)}
            />
          ))}
        </div>
      </Sheet>

      <EmployeesSheet
        open={employeesOpen}
        onClose={() => setEmployeesOpen(false)}
        employees={employees}
        onChange={load}
      />
    </div>
  );
}

function DayInstanceRow({
  instance,
  onMove,
  onSkip,
}: {
  instance: PaymentInstance;
  onMove: (newDate: string) => void;
  onSkip: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [newDate, setNewDate] = useState(instance.date);

  return (
    <Card className="p-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{
              background: instance.direction === "incoming" ? "var(--accent)" : "var(--warn)",
            }}
          />
          <div>
            <div className="text-[14px] font-medium text-text">{instance.label}</div>
            <div className="text-[12px] text-text-faint">
              {instance.direction === "incoming" ? "Incoming" : "Outgoing"}
              {instance.amount ? ` · $${instance.amount.toLocaleString()}` : ""}
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
        <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
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
              Move
            </button>
          </div>
          <button onClick={onSkip} className="self-start text-[12px] text-danger">
            Skip this one occurrence
          </button>
        </div>
      )}
    </Card>
  );
}

function EmployeesSheet({
  open,
  onClose,
  employees,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  employees: Employee[];
  onChange: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const confirm = useConfirm();

  async function addEmployee(input: {
    name: string;
    payAmount: string;
    payDate: string;
    payRecurrence: PayRecurrence;
  }) {
    await supabase.from("employees").insert({
      name: input.name,
      pay_amount: input.payAmount ? Number(input.payAmount) : null,
      pay_date: input.payDate,
      pay_recurrence: input.payRecurrence,
    });
    setAdding(false);
    onChange();
  }

  async function removeEmployee(id: string) {
    await supabase.from("employees").delete().eq("id", id);
    onChange();
  }

  return (
    <Sheet open={open} onClose={onClose} title="Team pay">
      <div className="flex flex-col gap-2.5">
        {employees.map((e) => (
          <Card key={e.id} className="flex items-center justify-between gap-3 p-3.5">
            <div>
              <div className="text-[14px] font-medium text-text">{e.name}</div>
              <div className="text-[12px] text-text-faint">
                {e.pay_amount ? `$${e.pay_amount.toLocaleString()} · ` : ""}
                {RECURRENCE_OPTIONS.find((o) => o.value === e.pay_recurrence)?.label}
              </div>
            </div>
            <button
              onClick={() => confirm.ask(() => removeEmployee(e.id))}
              className="text-[12px] font-medium text-danger"
            >
              Remove
            </button>
          </Card>
        ))}

        {adding ? (
          <AddEmployeeForm onSubmit={addEmployee} onCancel={() => setAdding(false)} />
        ) : (
          <PrimaryButton onClick={() => setAdding(true)}>Add pay entry</PrimaryButton>
        )}
      </div>

      <ConfirmModal
        open={confirm.open}
        title="Remove this pay entry?"
        onConfirm={confirm.confirm}
        onCancel={confirm.cancel}
      />
    </Sheet>
  );
}

function AddEmployeeForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (input: { name: string; payAmount: string; payDate: string; payRecurrence: PayRecurrence }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState("");
  const [payRecurrence, setPayRecurrence] = useState<PayRecurrence>("monthly");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim() || !payDate) return;
        onSubmit({ name: name.trim(), payAmount, payDate, payRecurrence });
      }}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-raised p-3.5"
    >
      <TextField label="Name" value={name} onChange={setName} placeholder="Dalton" />
      <TextField label="Pay amount" type="number" value={payAmount} onChange={setPayAmount} placeholder="Optional" />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Pay date" type="date" value={payDate} onChange={setPayDate} />
        <SelectField label="Recurs" value={payRecurrence} onChange={setPayRecurrence} options={RECURRENCE_OPTIONS} />
      </div>
      <div className="flex gap-2">
        <GhostButton onClick={onCancel}>Cancel</GhostButton>
        <PrimaryButton type="submit">Save</PrimaryButton>
      </div>
    </form>
  );
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, months: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + months, 1);
}
