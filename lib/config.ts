// ============================================
// Business Info
// ============================================
export const BUSINESS_NAME =
  process.env.NEXT_PUBLIC_BUSINESS_NAME || "TJ's Detailing Dynamics";
export const CONTACT_NUMBER = process.env.NEXT_PUBLIC_CONTACT_NUMBER || "";
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// ============================================
// Booking Form
// ============================================
export const TOTAL_STEPS = 4;
export const STEP_NAMES = [
  "Personal Details",
  "Vehicle Details",
  "Service Details",
  "Schedule",
] as const;

export const SERVICE_TYPES = [
  { value: "both", label: "Full Detail (Interior & Exterior)" },
  { value: "interior", label: "Interior Only" },
  { value: "exterior", label: "Exterior Only" },
] as const;

export const TIME_SLOTS = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
] as const;

// ============================================
// Validation
// ============================================
// Australian mobile phone regex (04XX XXX XXX or +614XX XXX XXX)
export const MOBILE_REGEX = /^(\+?61|0)4\d{8}$/;

export const MIN_NAME_LENGTH = 2;
export const ADDRESS_MIN_CHARS = 4;
export const DEBOUNCE_MS = 500;

// ============================================
// Job Status
// ============================================
export const JOB_STATUSES = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-800" },
  completed: { label: "Completed", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
} as const;

export type JobStatus = keyof typeof JOB_STATUSES;

// ============================================
// Reviews
// ============================================
export const REVIEW_LINKS = [
  {
    name: "Google",
    url: "https://g.page/r/YOUR_GOOGLE_REVIEW_LINK",
  },
  {
    name: "Facebook",
    url: "https://facebook.com/YOUR_PAGE/reviews",
  },
];

export function generateReviewMessage(firstName: string): string {
  const links = REVIEW_LINKS.map((link) => `${link.name}: ${link.url}`).join(
    "\n"
  );

  return `Hi ${firstName}! Thank you for choosing ${BUSINESS_NAME}. We hope you're happy with the results! If you have a moment, we'd really appreciate a review:\n\n${links}\n\nThanks again!`;
}

// ============================================
// Date/Time
// ============================================
export const TIMEZONE = "Australia/Brisbane";
export const MIN_BOOKING_HOURS_AHEAD = 24;
export const MAX_BOOKING_DAYS_AHEAD = 30;

// ============================================
// SMS Notifications
// ============================================
export interface BookingNotificationData {
  name: string;
  date: string;
  timeOfDay: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  serviceType: string;
  address: string;
  mobile: string;
  scent: string;
  specialRequests: string | null;
  returningCustomer: boolean;
}

export function generateBookingNotificationMessage(
  data: BookingNotificationData
): string {
  const serviceLabel =
    SERVICE_TYPES.find((s) => s.value === data.serviceType)?.label ??
    data.serviceType;
  const returningTag = data.returningCustomer ? " [RETURNING]" : "";

  return `New Booking${returningTag}!

${data.name}
${data.date} (${data.timeOfDay})

${data.vehicleYear} ${data.vehicleMake} ${data.vehicleModel}
${serviceLabel}${data.scent !== "none" ? ` - ${data.scent}` : ""}

${data.address}
${data.mobile}${data.specialRequests ? `\n\nNotes: ${data.specialRequests}` : ""}

${BASE_URL}/dashboard`;
}
