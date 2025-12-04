const BRISBANE_TZ = "Australia/Brisbane";

// Slot start times (24hr format)
const SLOT_START_HOURS = {
  morning: 8,
  afternoon: 13,
} as const;

/**
 * Format a Date object to YYYY-MM-DD string in Brisbane timezone.
 * This ensures dates are stored consistently regardless of the user's local timezone.
 */
export function formatDateBrisbane(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: BRISBANE_TZ });
}

/**
 * Format a date string for display in Brisbane timezone.
 * Uses noon Brisbane time to avoid any date boundary issues.
 */
export function formatDateDisplay(
  dateStr: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
  }
): string {
  // Parse the date parts and create a date at noon in Brisbane
  const [year, month, day] = dateStr.split("-").map(Number);
  // Create date at noon UTC, then format in Brisbane (won't shift the date)
  const date = new Date(Date.UTC(year, month - 1, day, 2, 0, 0)); // 2am UTC = 12pm Brisbane (AEST)
  return date.toLocaleDateString("en-AU", {
    ...options,
    timeZone: BRISBANE_TZ,
  });
}

/**
 * Get current time in Brisbane as a Date object.
 */
export function getBrisbaneNow(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: BRISBANE_TZ })
  );
}

/**
 * Check if a date/timeframe is within 24 hours from now (Brisbane time).
 * All calculations done in Brisbane timezone to avoid local time mismatches.
 */
export function isWithin24Hours(
  calendarDate: Date,
  timeframe: "morning" | "afternoon"
): boolean {
  // Get Brisbane date strings for comparison
  const targetDateStr = formatDateBrisbane(calendarDate);
  const brisbaneNow = getBrisbaneNow();
  const nowDateStr = formatDateBrisbane(brisbaneNow);

  const slotHour = SLOT_START_HOURS[timeframe];
  const nowHour = brisbaneNow.getHours();
  const nowMinute = brisbaneNow.getMinutes();

  // Compare dates using Brisbane timezone strings
  if (targetDateStr < nowDateStr) return true; // Past date
  if (targetDateStr === nowDateStr) return true; // Today is always within 24 hours

  // Check if tomorrow
  const tomorrow = new Date(brisbaneNow);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatDateBrisbane(tomorrow);

  if (targetDateStr === tomorrowStr) {
    // Tomorrow - check if slot is less than 24 hours away
    const hoursUntilMidnight = 24 - nowHour - nowMinute / 60;
    const totalHoursUntilSlot = hoursUntilMidnight + slotHour;
    return totalHoursUntilSlot < 24;
  }

  return false; // More than 1 day away
}

/**
 * Check if an entire date is within 24 hours (both morning and afternoon unavailable).
 */
export function isDateWithin24Hours(date: Date): boolean {
  return (
    isWithin24Hours(date, "morning") && isWithin24Hours(date, "afternoon")
  );
}
