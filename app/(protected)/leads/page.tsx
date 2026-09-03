"use client";

import { useEffect, useState } from "react";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import type { Lead } from "@/lib/types";
import { formatDateLong, daysUntil } from "@/lib/format";
import {
  PageHeader,
  Card,
  EmptyState,
  LoadingState,
  TextField,
  PrimaryButton,
  GhostButton,
  FAB,
  Sheet,
  ConfirmModal,
  useConfirm,
  Chevron,
} from "@/components/ui";

const supabase = createSupabaseClient();

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const confirm = useConfirm();

  async function load() {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .order("next_contact_date", { ascending: true, nullsFirst: false });
    setLeads(data ?? []);
  }

  useEffect(() => {
    async function run() {
      await load();
    }
    run();
  }, []);

  async function createLead(input: { name: string; industry: string; nextContact: string }) {
    await supabase.from("leads").insert({
      name: input.name,
      industry: input.industry || null,
      next_contact_date: input.nextContact || null,
    });
    setAddOpen(false);
    load();
  }

  async function updateLead(id: string, patch: Partial<Lead>) {
    setLeads((prev) =>
      prev
        ? [...prev.map((l) => (l.id === id ? { ...l, ...patch } : l))].sort(
            (a, b) => {
              if (!a.next_contact_date) return 1;
              if (!b.next_contact_date) return -1;
              return a.next_contact_date.localeCompare(b.next_contact_date);
            },
          )
        : prev,
    );
    await supabase.from("leads").update(patch).eq("id", id);
  }

  async function deleteLead(id: string) {
    setLeads((prev) => (prev ? prev.filter((l) => l.id !== id) : prev));
    setExpandedId(null);
    await supabase.from("leads").delete().eq("id", id);
  }

  async function promoteLead(lead: Lead) {
    const notes = lead.industry
      ? `Industry: ${lead.industry}${lead.notes ? "\n\n" + lead.notes : ""}`
      : lead.notes;
    await supabase.from("clients").insert({
      name: lead.name,
      status: "starting",
      notes: notes || null,
      pay_recurrence: "monthly",
    });
    await deleteLead(lead.id);
  }

  if (leads === null) return <LoadingState />;

  return (
    <div>
      <PageHeader title="Leads" subtitle="Soonest next-contact first" />

      {leads.length === 0 ? (
        <EmptyState label="No leads in the pipeline." />
      ) : (
        <div className="flex flex-col gap-2.5 px-5 pb-4">
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              expanded={expandedId === lead.id}
              onToggle={() =>
                setExpandedId(expandedId === lead.id ? null : lead.id)
              }
              onUpdate={(patch) => updateLead(lead.id, patch)}
              onDelete={() => confirm.ask(() => deleteLead(lead.id))}
              onPromote={() => promoteLead(lead)}
            />
          ))}
        </div>
      )}

      <FAB label="Add lead" onClick={() => setAddOpen(true)} />

      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="New lead">
        <AddForm onSubmit={createLead} />
      </Sheet>

      <ConfirmModal
        open={confirm.open}
        title="Remove this lead?"
        onConfirm={confirm.confirm}
        onCancel={confirm.cancel}
      />
    </div>
  );
}

function LeadCard({
  lead,
  expanded,
  onToggle,
  onUpdate,
  onDelete,
  onPromote,
}: {
  lead: Lead;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<Lead>) => void;
  onDelete: () => void;
  onPromote: () => void;
}) {
  const [notes, setNotes] = useState(lead.notes ?? "");
  const days = daysUntil(lead.next_contact_date);
  const soon = days !== null && days <= 2;

  return (
    <Card>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <div className="min-w-0">
          <div className="truncate text-[15px] font-medium text-text">{lead.name}</div>
          <div className="text-[12px] text-text-faint">
            {lead.industry ?? "No industry set"}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <span
            className="text-[12px] font-medium"
            style={{ color: soon ? "var(--warn)" : "var(--text-faint)" }}
          >
            {formatDateLong(lead.next_contact_date)}
          </span>
          <Chevron open={expanded} />
        </div>
      </button>

      {expanded && (
        <div className="flex flex-col gap-4 border-t border-border px-4 py-4">
          <TextField
            label="Industry"
            value={lead.industry ?? ""}
            onChange={(v) => onUpdate({ industry: v })}
          />
          <TextField
            label="Next contact"
            type="date"
            value={lead.next_contact_date ?? ""}
            onChange={(v) => onUpdate({ next_contact_date: v || null })}
          />
          <TextField
            label="Notes"
            multiline
            value={notes}
            onChange={setNotes}
            placeholder="What they're waiting on, why they haven't signed…"
          />
          {notes !== (lead.notes ?? "") && (
            <button
              onClick={() => onUpdate({ notes })}
              className="-mt-2 self-start text-[12px] font-medium"
              style={{ color: "var(--accent)" }}
            >
              Save notes
            </button>
          )}
          <PrimaryButton onClick={onPromote}>Promote to client</PrimaryButton>
          <GhostButton onClick={onDelete}>Remove lead</GhostButton>
        </div>
      )}
    </Card>
  );
}

function AddForm({
  onSubmit,
}: {
  onSubmit: (input: { name: string; industry: string; nextContact: string }) => void;
}) {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [nextContact, setNextContact] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({ name: name.trim(), industry, nextContact });
      }}
      className="flex flex-col gap-4"
    >
      <TextField label="Name" value={name} onChange={setName} />
      <TextField label="Industry" value={industry} onChange={setIndustry} />
      <TextField label="Next contact" type="date" value={nextContact} onChange={setNextContact} />
      <PrimaryButton type="submit">Add lead</PrimaryButton>
    </form>
  );
}
