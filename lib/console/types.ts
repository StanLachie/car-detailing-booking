import type { BookingFormData } from "@/components/booking";

export interface BookingFormContext {
  formData: BookingFormData;
  setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  currentStep: number;
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>;
  setTouched: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setSubmitted: React.Dispatch<React.SetStateAction<boolean>>;
  setBookingComplete: React.Dispatch<React.SetStateAction<boolean>>;
  initialFormData: BookingFormData;
}

export interface DevCommand {
  name: string;
  description: string;
  usage?: string;
  execute: (ctx: BookingFormContext, ...args: unknown[]) => unknown;
}

declare global {
  interface Window {
    booking?: Record<string, unknown>;
  }
}
