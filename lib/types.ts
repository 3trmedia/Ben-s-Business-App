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

export interface Employee {
  id: string;
  name: string;
  pay_amount: number | null;
  pay_recurrence: PayRecurrence;
  pay_date: string;
  notes: string | null;
}

export interface PaymentOverride {
  id: string;
  source_type: "client" | "employee";
  source_id: string;
  instance_date: string;
  new_date: string | null; // null = skip this instance
  note: string | null;
}

export interface PaymentInstance {
  id: string;
  date: string; // ISO date, after override applied
  direction: "incoming" | "outgoing";
  label: string;
  amount: number | null;
  sourceType: "client" | "employee";
  sourceId: string;
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
