"use client";

import { cn } from "@/lib/utils";
import { formatDateBrisbane, isDateWithin24Hours, isWithin24Hours } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import type { StepProps, TakenBooking } from "./types";

interface ScheduleStepProps extends StepProps {
  takenBookings: TakenBooking[];
}

export function ScheduleStep({
  formData,
  setFormData,
  errors,
  showError,
  handleBlur,
  takenBookings,
}: ScheduleStepProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isDateFullyBooked = (checkDate: Date) => {
    // Check if within 24 hours first
    if (isDateWithin24Hours(checkDate)) return true;

    const dateStr = formatDateBrisbane(checkDate);
    const morningTaken = takenBookings.some(
      (b) => b.date === dateStr && b.timeframe === "morning"
    );
    const afternoonTaken = takenBookings.some(
      (b) => b.date === dateStr && b.timeframe === "afternoon"
    );
    return morningTaken && afternoonTaken;
  };

  const isTimeSlotTaken = (
    checkDate: Date,
    timeframe: "morning" | "afternoon"
  ) => {
    // Check if within 24 hours first
    if (isWithin24Hours(checkDate, timeframe)) return true;

    const dateStr = formatDateBrisbane(checkDate);
    return takenBookings.some(
      (b) => b.date === dateStr && b.timeframe === timeframe
    );
  };

  return (
    <div className="space-y-6">
      {/* Date */}
      <div className="space-y-2">
        <Label>Select Date *</Label>
        <div
          className={cn(
            "border rounded-md p-2",
            showError("date") && "border-destructive"
          )}
        >
          <Calendar
            mode="single"
            selected={formData.date}
            onSelect={(newDate) => {
              setFormData((prev) => ({
                ...prev,
                date: newDate,
                timeOfDay: "",
              }));
              handleBlur("date");
            }}
            disabled={(checkDate) =>
              checkDate <= today || isDateFullyBooked(checkDate)
            }
            className="w-full"
            classNames={{
              root: "w-full",
            }}
          />
        </div>
        {showError("date") && (
          <p className="text-sm text-destructive">{errors.date}</p>
        )}
      </div>

      {/* Time of Day */}
      {formData.date && (
        <div className="space-y-2">
          <Label>Time of Day *</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={formData.timeOfDay === "morning" ? "default" : "outline"}
              onClick={() => {
                setFormData((prev) => ({ ...prev, timeOfDay: "morning" }));
                handleBlur("timeOfDay");
              }}
              disabled={isTimeSlotTaken(formData.date, "morning")}
              className="flex-1"
            >
              Morning
              {isTimeSlotTaken(formData.date, "morning") && " (Taken)"}
            </Button>
            <Button
              type="button"
              variant={
                formData.timeOfDay === "afternoon" ? "default" : "outline"
              }
              onClick={() => {
                setFormData((prev) => ({ ...prev, timeOfDay: "afternoon" }));
                handleBlur("timeOfDay");
              }}
              disabled={isTimeSlotTaken(formData.date, "afternoon")}
              className="flex-1"
            >
              Afternoon
              {isTimeSlotTaken(formData.date, "afternoon") && " (Taken)"}
            </Button>
          </div>
          {showError("timeOfDay") && (
            <p className="text-sm text-destructive">{errors.timeOfDay}</p>
          )}
        </div>
      )}
    </div>
  );
}
