import { collection, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { ensureCalendarAnonymousAuth, getCalendarFirestore } from "@/lib/firebase-clients";

export type ExternalBooking = {
  id: string;
  booking_date: string;
  therapist_name: string;
  therapist_role?: string | null;
  additional_coordinator_name?: string | null;
  additional_coordinator_role?: string | null;
  action_time?: string | null;
  topic?: string | null;
  description?: string | null;
  event_type?: string | null;
  mode?: string | null;
  image_url?: string | null;
  detail_image_url?: string | null;
  long_description?: string | null;
  audience?: string | null;
  program_details?: string | null;
  activity_category?: "association" | "association_free" | "therapist_action" | "therapist_independent";
  general_price?: string | null;
  offers_member_discount?: boolean;
  member_price?: string | null;
  registration_form_mode?: "shared" | "custom";
  registration_form_url?: string | null;
  requested_public?: boolean;
  approval_status?: "pending" | "approved" | "draft";
  is_public?: boolean;
  status?: string;
};

function fromData(id: string, data: Record<string, unknown>): ExternalBooking {
  const text = (key: string) => (typeof data[key] === "string" ? String(data[key]) : null);
  const category = data.activity_category;
  const activityCategory =
    category === "association" || category === "association_free" || category === "therapist_independent" || category === "therapist_action"
      ? category
      : "association_free";
  const explicitStatus = data.approval_status;
  const approvalStatus =
    explicitStatus === "pending" || explicitStatus === "draft" || explicitStatus === "approved"
      ? explicitStatus
      : data.is_public === true
        ? "approved"
        : "draft";

  return {
    id,
    booking_date: text("booking_date") || id,
    therapist_name: text("therapist_name") || "",
    therapist_role: text("therapist_role"),
    additional_coordinator_name: text("additional_coordinator_name"),
    additional_coordinator_role: text("additional_coordinator_role"),
    action_time: text("action_time"),
    topic: text("topic"),
    description: text("description"),
    event_type: text("event_type"),
    mode: text("mode"),
    image_url: text("image_url"),
    detail_image_url: text("detail_image_url"),
    long_description: text("long_description"),
    audience: text("audience"),
    program_details: text("program_details"),
    activity_category: activityCategory,
    general_price: text("general_price"),
    offers_member_discount: data.offers_member_discount === true,
    member_price: text("member_price"),
    registration_form_mode: data.registration_form_mode === "custom" ? "custom" : "shared",
    registration_form_url: text("registration_form_url"),
    requested_public: data.requested_public === true || data.is_public === true,
    approval_status: approvalStatus,
    is_public: data.is_public === true,
    status: text("status") || "booked",
  };
}

export async function subscribeCalendarBookings(
  onValue: (items: ExternalBooking[]) => void,
  onError: (message: string) => void,
): Promise<Unsubscribe> {
  await ensureCalendarAnonymousAuth();
  const db = getCalendarFirestore();
  return onSnapshot(
    collection(db, "bookings"),
    (snapshot) => {
      const items = snapshot.docs
        .map((document) => fromData(document.id, document.data()))
        .sort((a, b) => a.booking_date.localeCompare(b.booking_date));
      onValue(items);
    },
    (error) => onError(error.message || "Δεν ήταν δυνατή η σύνδεση με το ημερολόγιο."),
  );
}
