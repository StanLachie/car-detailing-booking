import type { DevCommand } from "../types";

export const getData: DevCommand = {
  name: "getData",
  description: "Get current form data",
  usage: "booking.getData()",
  execute: (ctx) => {
    const data = { ...ctx.formData };
    console.log("Current form data:");
    console.table({
      ...data,
      date: data.date?.toLocaleDateString() ?? "Not set",
      attachments: data.attachments.length > 0 ? `${data.attachments.length} file(s)` : "None",
    });
    return data;
  },
};

export const setField: DevCommand = {
  name: "setField",
  description: "Set a specific form field",
  usage: 'booking.setField("name", "John Doe")',
  execute: (ctx, field: unknown, value: unknown) => {
    if (typeof field !== "string") {
      console.error("Field must be a string");
      return;
    }
    ctx.setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    console.log(`Set ${field} = ${JSON.stringify(value)}`);
  },
};

export const reset: DevCommand = {
  name: "reset",
  description: "Reset form to initial state",
  usage: "booking.reset()",
  execute: (ctx) => {
    ctx.setFormData(ctx.initialFormData);
    ctx.setCurrentStep(0);
    ctx.setTouched({});
    ctx.setSubmitted(false);
    ctx.setBookingComplete(false);
    console.log("Form reset to initial state");
  },
};

export const complete: DevCommand = {
  name: "complete",
  description: "Show the booking complete screen",
  usage: "booking.complete()",
  execute: (ctx) => {
    ctx.setBookingComplete(true);
    console.log("Showing booking complete screen");
  },
};
