export interface Booking {
  id: string;
  name: string;
  mobile: string;
  address: string;
  returningCustomer: boolean;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  serviceType: string;
  scent: string;
  specialRequests: string | null;
  date: string;
  timeOfDay: string;
  status: string;
  createdAt: number;
}

export interface Scent {
  id: string;
  name: string;
  enabled: boolean;
}

export interface UnavailableSlot {
  date: string;
  timeOfDay: string;
}

export interface TakenBooking {
  date: string;
  timeframe: string;
}
