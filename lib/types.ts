export type ClientStatus = "starting" | "ongoing" | "closing";

export type PayRecurrence = "monthly" | "biweekly" | "weekly" | "irregular";

export interface ClientFocus {
  id: string;
  client_id: string;
  text: string;
  done: boolean;
  position: number;
}

export interface Client {
  id: string;
  name: string;
  status: ClientStatus;
  quarterly_goal: string | null;
  pay_date: string | null; // ISO date, anchor date for recurrence
  pay_recurrence: PayRecurrence;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  focuses?: ClientFocus[];
}

export interface PastClient {
  id: string;
  name: string;
  industry: string | null;
  last_worked_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  industry: string | null;
  next_contact_date: string | null;
  notes: string | null;
  created_at: string;
}

export type PaymentDirection = "incoming" | "outgoing";

export interface PaymentSchedule {
  id: string;
  direction: PaymentDirection;
  label: string;
  amount: number | null;
  client_id: string | null;
  anchor_date: string; // ISO date, first/reference occurrence
  recurrence: PayRecurrence;
  notes: string | null;
  created_at: string;
}

export interface PaymentScheduleOverride {
  id: string;
  schedule_id: string;
  instance_date: string; // the un-overridden occurrence date this replaces
  new_date: string | null; // null = this occurrence is skipped
  new_amount: number | null; // null = use the schedule's normal amount
  note: string | null;
}

export interface PaymentInstance {
  id: string; // `${schedule_id}:${instance_date}`
  scheduleId: string;
  date: string; // ISO date, after override applied
  direction: PaymentDirection;
  label: string;
  amount: number | null;
  overridden: boolean;
}

export const CLIENT_STATUS_LABEL: Record<ClientStatus, string> = {
  starting: "Starting",
  ongoing: "Ongoing",
  closing: "Closing",
};

export const CLIENT_STATUS_ORDER: Record<ClientStatus, number> = {
  starting: 0,
  closing: 0,
  ongoing: 1,
};
