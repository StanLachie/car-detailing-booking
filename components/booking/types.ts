export interface Attachment {
  url: string;
  type: "image" | "video";
  name: string;
}

export interface BookingFormData {
  name: string;
  mobile: string;
  address: string;
  returningCustomer: boolean;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  serviceType: "both" | "interior" | "exterior" | "";
  scent: string;
  attachments: Attachment[];
  specialRequests: string;
  date: Date | undefined;
  timeOfDay: "morning" | "afternoon" | "";
}

export interface FormErrors {
  name?: string;
  mobile?: string;
  address?: string;
  vehicleYear?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  serviceType?: string;
  scent?: string;
  date?: string;
  timeOfDay?: string;
}

export interface Scent {
  id: string;
  name: string;
}

export interface TakenBooking {
  timeframe: "morning" | "afternoon";
  date: string;
}

export interface AddressSuggestion {
  value: string;
  label: string;
}

export interface StepProps {
  formData: BookingFormData;
  setFormData: React.Dispatch<React.SetStateAction<BookingFormData>>;
  errors: FormErrors;
  touched: Record<string, boolean>;
  submitted: boolean;
  handleBlur: (field: string) => void;
  showError: (field: keyof FormErrors) => string | false | undefined;
}
