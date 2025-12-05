import type { DevCommand } from "../types";
import { TOTAL_STEPS, STEP_NAMES } from "@/lib/config";

export const goToStep: DevCommand = {
  name: "goToStep",
  description: "Navigate directly to a specific step (0-3)",
  usage: "booking.goToStep(2)",
  execute: (ctx, step: unknown) => {
    const stepNum = Number(step);
    if (isNaN(stepNum) || stepNum < 0 || stepNum >= TOTAL_STEPS) {
      console.error(`Invalid step. Must be 0-${TOTAL_STEPS - 1}`);
      return;
    }
    ctx.setCurrentStep(stepNum);
    console.log(`Navigated to step ${stepNum}: ${STEP_NAMES[stepNum]}`);
  },
};

export const next: DevCommand = {
  name: "next",
  description: "Go to next step (bypasses validation)",
  usage: "booking.next()",
  execute: (ctx) => {
    if (ctx.currentStep >= TOTAL_STEPS - 1) {
      console.log("Already at last step");
      return;
    }
    const newStep = ctx.currentStep + 1;
    ctx.setCurrentStep(newStep);
    console.log(`Navigated to step ${newStep}: ${STEP_NAMES[newStep]}`);
  },
};

export const prev: DevCommand = {
  name: "prev",
  description: "Go to previous step",
  usage: "booking.prev()",
  execute: (ctx) => {
    if (ctx.currentStep <= 0) {
      console.log("Already at first step");
      return;
    }
    const newStep = ctx.currentStep - 1;
    ctx.setCurrentStep(newStep);
    console.log(`Navigated to step ${newStep}: ${STEP_NAMES[newStep]}`);
  },
};

export const status: DevCommand = {
  name: "status",
  description: "Show current step info",
  usage: "booking.status()",
  execute: (ctx) => {
    console.log(`Current step: ${ctx.currentStep} - ${STEP_NAMES[ctx.currentStep]}`);
    console.log(`Steps: ${STEP_NAMES.map((name, i) => i === ctx.currentStep ? `[${name}]` : name).join(" -> ")}`);
  },
};
