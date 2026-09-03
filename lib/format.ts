export function formatDate(iso: string | null): string {
  if (!iso) return "No date set";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDateLong(iso: string | null): string {
  if (!iso) return "No date set";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const today = new Date(todayIso() + "T00:00:00");
  const target = new Date(iso + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}
