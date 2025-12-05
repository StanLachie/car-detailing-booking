import type { BookingFormContext, DevCommand } from "./types";
import { goToStep, next, prev, status } from "./commands/step";
import { seed, seedStep, seedAndGo } from "./commands/seed";
import { getData, setField, reset, complete } from "./commands/data";

const commands: DevCommand[] = [
  // Step commands
  goToStep,
  next,
  prev,
  status,
  // Seed commands
  seed,
  seedStep,
  seedAndGo,
  // Data commands
  getData,
  setField,
  reset,
  complete,
];

function createHelpCommand(commands: DevCommand[]): () => void {
  return () => {
    console.log("%c Booking Dev Console ", "background: #3b82f6; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;");
    console.log("");
    console.log("Available commands:");
    console.log("");

    commands.forEach((cmd) => {
      console.log(`%c${cmd.usage || `booking.${cmd.name}()`}`, "color: #22c55e; font-weight: bold;");
      console.log(`  ${cmd.description}`);
      console.log("");
    });
  };
}

export function registerDevConsole(ctx: BookingFormContext): () => void {
  const booking: Record<string, unknown> = {};

  // Register all commands
  commands.forEach((cmd) => {
    booking[cmd.name] = (...args: unknown[]) => cmd.execute(ctx, ...args);
  });

  // Add help command
  booking.help = createHelpCommand(commands);

  // Attach to window
  window.booking = booking;

  // Log availability message
  console.log(
    "%c Dev Console Active ",
    "background: #22c55e; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;"
  );
  console.log("Type %cbooking.help()%c for available commands", "color: #22c55e; font-weight: bold;", "");

  // Return cleanup function
  return () => {
    delete window.booking;
  };
}

export type { BookingFormContext } from "./types";
