"use client";

import { useEffect, useState } from "react";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import type { Client, ClientFocus, ClientStatus, PayRecurrence } from "@/lib/types";
import { CLIENT_STATUS_LABEL, CLIENT_STATUS_ORDER } from "@/lib/types";
import { formatDate } from "@/lib/format";
import {
  PageHeader,
  StatusPill,
  Card,
  EmptyState,
  LoadingState,
  TextField,
  SelectField,
  PrimaryButton,
  GhostButton,
  FAB,
  Sheet,
  ConfirmModal,
  useConfirm,
  Chevron,
} from "@/components/ui";

const supabase = createSupabaseClient();

const RECURRENCE_OPTIONS: { value: PayRecurrence; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "weekly", label: "Weekly" },
  { value: "irregular", label: "Irregular" },
];

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const confirm = useConfirm();

  async function load() {
    const [{ data: clientRows }, { data: focusRows }] = await Promise.all([
      supabase.from("clients").select("*").order("name"),
      supabase.from("client_focuses").select("*").order("position"),
    ]);
    const focusesByClient = new Map<string, ClientFocus[]>();
    (focusRows ?? []).forEach((f) => {
      const list = focusesByClient.get(f.client_id) ?? [];
      list.push(f);
      focusesByClient.set(f.client_id, list);
    });
    const merged = (clientRows ?? []).map((c) => ({
      ...c,
      focuses: focusesByClient.get(c.id) ?? [],
    }));
    setClients(sortClients(merged));
  }

  useEffect(() => {
    async function run() {
      await load();
    }
    run();
  }, []);

  function sortClients(list: Client[]): Client[] {
    return [...list].sort((a, b) => {
      const order = CLIENT_STATUS_ORDER[a.status] - CLIENT_STATUS_ORDER[b.status];
      if (order !== 0) return order;
      return a.name.localeCompare(b.name);
    });
  }

  async function createClient(input: {
    name: string;
    status: ClientStatus;
    payDate: string;
    payRecurrence: PayRecurrence;
    paymentMethod: string;
  }) {
    const { data, error } = await supabase
      .from("clients")
      .insert({
        name: input.name,
        status: input.status,
        pay_date: input.payDate || null,
        pay_recurrence: input.payRecurrence,
        payment_method: input.paymentMethod || null,
      })
      .select()
      .single();
    if (error || !data) return;

    const focusInserts = [0, 1, 2].map((position) => ({
      client_id: data.id,
      text: "",
      done: false,
      position,
    }));
    await supabase.from("client_focuses").insert(focusInserts);

    setAddOpen(false);
    load();
  }

  async function updateClient(id: string, patch: Partial<Client>) {
    setClients((prev) =>
      prev
        ? sortClients(
            prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
          )
        : prev,
    );
    await supabase.from("clients").update(patch).eq("id", id);
  }

  async function updateFocus(focus: ClientFocus, patch: Partial<ClientFocus>) {
    setClients((prev) =>
      prev
        ? prev.map((c) =>
            c.id === focus.client_id
              ? {
                  ...c,
                  focuses: c.focuses?.map((f) =>
                    f.id === focus.id ? { ...f, ...patch } : f,
                  ),
                }
              : c,
          )
        : prev,
    );
    await supabase.from("client_focuses").update(patch).eq("id", focus.id);
  }

  async function deleteClient(id: string) {
    setClients((prev) => (prev ? prev.filter((c) => c.id !== id) : prev));
    setExpandedId(null);
    await supabase.from("clients").delete().eq("id", id);
  }

  if (clients === null) return <LoadingState />;

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} active`}
      />

      {clients.length === 0 ? (
        <EmptyState label="No clients yet. Tap + to add one." />
      ) : (
        <div className="flex flex-col gap-2.5 px-5 pb-4">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              expanded={expandedId === client.id}
              onToggle={() =>
                setExpandedId(expandedId === client.id ? null : client.id)
              }
              onUpdate={(patch) => updateClient(client.id, patch)}
              onUpdateFocus={updateFocus}
              onDelete={() =>
                confirm.ask(() => deleteClient(client.id))
              }
            />
          ))}
        </div>
      )}

      <FAB label="Add client" onClick={() => setAddOpen(true)} />

      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="New client">
        <AddClientForm onSubmit={createClient} />
      </Sheet>

      <ConfirmModal
        open={confirm.open}
        title="Remove this client?"
        body="This deletes their goals, focuses, and notes. This can't be undone."
        onConfirm={confirm.confirm}
        onCancel={confirm.cancel}
      />
    </div>
  );
}

function ClientCard({
  client,
  expanded,
  onToggle,
  onUpdate,
  onUpdateFocus,
  onDelete,
}: {
  client: Client;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<Client>) => void;
  onUpdateFocus: (focus: ClientFocus, patch: Partial<ClientFocus>) => void;
  onDelete: () => void;
}) {
  const [goal, setGoal] = useState(client.quarterly_goal ?? "");
  const [notes, setNotes] = useState(client.notes ?? "");
  const [notesOpen, setNotesOpen] = useState(false);

  return (
    <Card>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="truncate text-[15px] font-medium text-text">
            {client.name}
          </span>
          <StatusPill status={client.status} />
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="text-[12px] text-text-faint">
            {formatDate(client.pay_date)}
          </span>
          <Chevron open={expanded} />
        </div>
      </button>

      {expanded && (
        <div className="flex flex-col gap-4 border-t border-border px-4 py-4">
          <SelectField
            label="Status"
            value={client.status}
            onChange={(v) => onUpdate({ status: v })}
            options={Object.entries(CLIENT_STATUS_LABEL).map(([value, label]) => ({
              value: value as ClientStatus,
              label,
            }))}
          />

          <TextField
            label="Quarterly goal"
            value={goal}
            onChange={setGoal}
            placeholder="What does a win this quarter look like?"
          />
          {goal !== (client.quarterly_goal ?? "") && (
            <button
              onClick={() => onUpdate({ quarterly_goal: goal })}
              className="-mt-2 self-start text-[12px] font-medium"
              style={{ color: "var(--accent)" }}
            >
              Save goal
            </button>
          )}

          <div>
            <span className="mb-2 block text-[12px] font-medium tracking-wide text-text-muted">
              Monthly focuses
            </span>
            <div className="flex flex-col gap-2">
              {(client.focuses ?? []).map((focus) => (
                <FocusRow
                  key={focus.id}
                  focus={focus}
                  onUpdate={(patch) => onUpdateFocus(focus, patch)}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Pay date"
              type="date"
              value={client.pay_date ?? ""}
              onChange={(v) => onUpdate({ pay_date: v || null })}
            />
            <SelectField
              label="Recurs"
              value={client.pay_recurrence}
              onChange={(v) => onUpdate({ pay_recurrence: v })}
              options={RECURRENCE_OPTIONS}
            />
          </div>

          <TextField
            label="Payment method"
            value={client.payment_method ?? ""}
            onChange={(v) => onUpdate({ payment_method: v })}
            placeholder="Venmo, PayPal, Helcim…"
          />

          <div>
            <button
              onClick={() => setNotesOpen(!notesOpen)}
              className="flex items-center gap-1.5 text-[12px] font-medium tracking-wide text-text-muted"
            >
              Notes
              <Chevron open={notesOpen} />
            </button>
            {notesOpen && (
              <div className="mt-2 flex flex-col gap-2">
                <TextField
                  label=""
                  multiline
                  value={notes}
                  onChange={setNotes}
                  placeholder="Anything worth remembering…"
                />
                {notes !== (client.notes ?? "") && (
                  <button
                    onClick={() => onUpdate({ notes })}
                    className="self-start text-[12px] font-medium"
                    style={{ color: "var(--accent)" }}
                  >
                    Save notes
                  </button>
                )}
              </div>
            )}
          </div>

          <GhostButton onClick={onDelete}>Remove client</GhostButton>
        </div>
      )}
    </Card>
  );
}

function FocusRow({
  focus,
  onUpdate,
}: {
  focus: ClientFocus;
  onUpdate: (patch: Partial<ClientFocus>) => void;
}) {
  const [text, setText] = useState(focus.text);

  return (
    <div className="flex items-center gap-2.5">
      <button
        onClick={() => onUpdate({ done: !focus.done })}
        aria-label={focus.done ? "Mark not done" : "Mark done"}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
        style={{
          borderColor: focus.done ? "var(--accent)" : "var(--border-strong)",
          background: focus.done ? "var(--accent)" : "transparent",
        }}
      >
        {focus.done && (
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="var(--accent-on)" strokeWidth="3">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => text !== focus.text && onUpdate({ text })}
        placeholder="Focus for this month…"
        className="min-w-0 flex-1 border-b border-transparent bg-transparent py-1 text-[14px] text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
        style={{
          textDecoration: focus.done ? "line-through" : "none",
          color: focus.done ? "var(--text-faint)" : "var(--text)",
        }}
      />
    </div>
  );
}

function AddClientForm({
  onSubmit,
}: {
  onSubmit: (input: {
    name: string;
    status: ClientStatus;
    payDate: string;
    payRecurrence: PayRecurrence;
    paymentMethod: string;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<ClientStatus>("starting");
  const [payDate, setPayDate] = useState("");
  const [payRecurrence, setPayRecurrence] = useState<PayRecurrence>("monthly");
  const [paymentMethod, setPaymentMethod] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({ name: name.trim(), status, payDate, payRecurrence, paymentMethod });
      }}
      className="flex flex-col gap-4"
    >
      <TextField label="Name" value={name} onChange={setName} placeholder="Client or company name" />
      <SelectField
        label="Status"
        value={status}
        onChange={setStatus}
        options={Object.entries(CLIENT_STATUS_LABEL).map(([value, label]) => ({
          value: value as ClientStatus,
          label,
        }))}
      />
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Pay date" type="date" value={payDate} onChange={setPayDate} />
        <SelectField
          label="Recurs"
          value={payRecurrence}
          onChange={setPayRecurrence}
          options={RECURRENCE_OPTIONS}
        />
      </div>
      <TextField
        label="Payment method"
        value={paymentMethod}
        onChange={setPaymentMethod}
        placeholder="Venmo, PayPal, Helcim…"
      />
      <PrimaryButton type="submit">Add client</PrimaryButton>
    </form>
  );
}
