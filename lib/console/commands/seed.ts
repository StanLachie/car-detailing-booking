import type { DevCommand } from "../types";
import type { BookingFormData } from "@/components/booking";

const testData: Partial<BookingFormData> = {
  name: "Test User",
  mobile: "0412345678",
  address: "123 Test Street, Maroochydore QLD 4558",
  returningCustomer: false,
  vehicleYear: "2020",
  vehicleMake: "Toyota",
  vehicleModel: "Camry",
  serviceType: "both",
  scent: "none",
  specialRequests: "Test booking - please ignore",
};

const stepData: Record<number, Partial<BookingFormData>> = {
  0: {
    name: testData.name,
    mobile: testData.mobile,
    address: testData.address,
    returningCustomer: testData.returningCustomer,
  },
  1: {
    vehicleYear: testData.vehicleYear,
    vehicleMake: testData.vehicleMake,
    vehicleModel: testData.vehicleModel,
  },
  2: {
    serviceType: testData.serviceType,
    scent: testData.scent,
    specialRequests: testData.specialRequests,
  },
  3: {
    // Date needs to be set dynamically
  },
};

function getNextAvailableDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 3); // 3 days from now
  date.setHours(0, 0, 0, 0);
  return date;
}

export const seed: DevCommand = {
  name: "seed",
  description: "Fill entire form with test data",
  usage: "booking.seed()",
  execute: (ctx) => {
    const date = getNextAvailableDate();
    ctx.setFormData((prev) => ({
      ...prev,
      ...testData,
      date,
      timeOfDay: "morning",
    }));
    console.log("Form seeded with test data");
    console.table({
      ...testData,
      date: date.toLocaleDateString(),
      timeOfDay: "morning",
    });
  },
};

export const seedStep: DevCommand = {
  name: "seedStep",
  description: "Seed data for a specific step (0-3)",
  usage: "booking.seedStep(0)",
  execute: (ctx, step: unknown) => {
    const stepNum = Number(step);
    if (isNaN(stepNum) || stepNum < 0 || stepNum > 3) {
      console.error("Invalid step. Must be 0-3");
      return;
    }

    let dataToSeed = stepData[stepNum];

    // Handle step 3 (schedule) specially
    if (stepNum === 3) {
      dataToSeed = {
        date: getNextAvailableDate(),
        timeOfDay: "morning",
      };
    }

    ctx.setFormData((prev) => ({
      ...prev,
      ...dataToSeed,
    }));

    const stepNames = ["Personal Details", "Vehicle Details", "Service Details", "Schedule"];
    console.log(`Step ${stepNum} (${stepNames[stepNum]}) seeded`);
    console.table(dataToSeed);
  },
};

export const seedAndGo: DevCommand = {
  name: "seedAndGo",
  description: "Seed form and go to last step",
  usage: "booking.seedAndGo()",
  execute: (ctx) => {
    const date = getNextAvailableDate();
    ctx.setFormData((prev) => ({
      ...prev,
      ...testData,
      date,
      timeOfDay: "morning",
    }));
    ctx.setCurrentStep(3);
    console.log("Form seeded and navigated to final step");
  },
};
