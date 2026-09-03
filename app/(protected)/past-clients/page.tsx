"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import type { PastClient } from "@/lib/types";
import { formatDateLong } from "@/lib/format";
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
const ONE_YEAR_MS = 365 * 86_400_000;

export default function PastClientsPage() {
  const [entries, setEntries] = useState<PastClient[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [showOlder, setShowOlder] = useState(false);
  const confirm = useConfirm();

  async function load() {
    const { data } = await supabase
      .from("past_clients")
      .select("*")
      .order("last_worked_date", { ascending: false, nullsFirst: false });
    setEntries(data ?? []);
  }

  useEffect(() => {
    async function run() {
      await load();
    }
    run();
  }, []);

  const [cutoff] = useState(() => Date.now() - ONE_YEAR_MS);

  const { recent, older } = useMemo(() => {
    if (!entries) return { recent: [], older: [] };
    const recent: PastClient[] = [];
    const older: PastClient[] = [];
    for (const e of entries) {
      const t = e.last_worked_date ? new Date(e.last_worked_date).getTime() : 0;
      (t >= cutoff ? recent : older).push(e);
    }
    return { recent, older };
  }, [entries, cutoff]);

  async function createEntry(input: {
    name: string;
    industry: string;
    lastWorked: string;
  }) {
    await supabase.from("past_clients").insert({
      name: input.name,
      industry: input.industry || null,
      last_worked_date: input.lastWorked || null,
    });
    setAddOpen(false);
    load();
  }

  async function updateEntry(id: string, patch: Partial<PastClient>) {
    setEntries((prev) =>
      prev ? prev.map((e) => (e.id === id ? { ...e, ...patch } : e)) : prev,
    );
    await supabase.from("past_clients").update(patch).eq("id", id);
  }

  async function deleteEntry(id: string) {
    setEntries((prev) => (prev ? prev.filter((e) => e.id !== id) : prev));
    setExpandedId(null);
    await supabase.from("past_clients").delete().eq("id", id);
  }

  if (entries === null) return <LoadingState />;

  return (
    <div>
      <PageHeader title="Past Clients" subtitle="A reach-out list, not a graveyard" />

      {entries.length === 0 ? (
        <EmptyState label="No past clients logged yet." />
      ) : (
        <div className="flex flex-col gap-2.5 px-5 pb-4">
          {recent.map((entry) => (
            <PastClientCard
              key={entry.id}
              entry={entry}
              expanded={expandedId === entry.id}
              onToggle={() =>
                setExpandedId(expandedId === entry.id ? null : entry.id)
              }
              onUpdate={(patch) => updateEntry(entry.id, patch)}
              onDelete={() => confirm.ask(() => deleteEntry(entry.id))}
            />
          ))}

          {older.length > 0 && (
            <>
              <button
                onClick={() => setShowOlder(!showOlder)}
                className="mt-1 flex items-center justify-center gap-1.5 self-center py-2 text-[12px] font-medium text-text-faint"
              >
                {showOlder ? "Hide older" : `Show ${older.length} older`}
                <Chevron open={showOlder} />
              </button>
              {showOlder &&
                older.map((entry) => (
                  <PastClientCard
                    key={entry.id}
                    entry={entry}
                    expanded={expandedId === entry.id}
                    onToggle={() =>
                      setExpandedId(expandedId === entry.id ? null : entry.id)
                    }
                    onUpdate={(patch) => updateEntry(entry.id, patch)}
                    onDelete={() => confirm.ask(() => deleteEntry(entry.id))}
                  />
                ))}
            </>
          )}
        </div>
      )}

      <FAB label="Add past client" onClick={() => setAddOpen(true)} />

      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="Log a past client">
        <AddForm onSubmit={createEntry} />
      </Sheet>

      <ConfirmModal
        open={confirm.open}
        title="Remove this entry?"
        onConfirm={confirm.confirm}
        onCancel={confirm.cancel}
      />
    </div>
  );
}

function PastClientCard({
  entry,
  expanded,
  onToggle,
  onUpdate,
  onDelete,
}: {
  entry: PastClient;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<PastClient>) => void;
  onDelete: () => void;
}) {
  const [notes, setNotes] = useState(entry.notes ?? "");

  return (
    <Card>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <div className="min-w-0">
          <div className="truncate text-[15px] font-medium text-text">{entry.name}</div>
          <div className="text-[12px] text-text-faint">
            {entry.industry ?? "No industry set"}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="text-[12px] text-text-faint">
            {formatDateLong(entry.last_worked_date)}
          </span>
          <Chevron open={expanded} />
        </div>
      </button>

      {expanded && (
        <div className="flex flex-col gap-4 border-t border-border px-4 py-4">
          <TextField
            label="Industry"
            value={entry.industry ?? ""}
            onChange={(v) => onUpdate({ industry: v })}
          />
          <TextField
            label="Last worked together"
            type="date"
            value={entry.last_worked_date ?? ""}
            onChange={(v) => onUpdate({ last_worked_date: v || null })}
          />
          <TextField
            label="Notes"
            multiline
            value={notes}
            onChange={setNotes}
            placeholder="Why they left, worth re-approaching…"
          />
          {notes !== (entry.notes ?? "") && (
            <button
              onClick={() => onUpdate({ notes })}
              className="-mt-2 self-start text-[12px] font-medium"
              style={{ color: "var(--accent)" }}
            >
              Save notes
            </button>
          )}
          <GhostButton onClick={onDelete}>Remove entry</GhostButton>
        </div>
      )}
    </Card>
  );
}

function AddForm({
  onSubmit,
}: {
  onSubmit: (input: { name: string; industry: string; lastWorked: string }) => void;
}) {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [lastWorked, setLastWorked] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({ name: name.trim(), industry, lastWorked });
      }}
      className="flex flex-col gap-4"
    >
      <TextField label="Name" value={name} onChange={setName} />
      <TextField label="Industry" value={industry} onChange={setIndustry} />
      <TextField label="Last worked together" type="date" value={lastWorked} onChange={setLastWorked} />
      <PrimaryButton type="submit">Add entry</PrimaryButton>
    </form>
  );
}
