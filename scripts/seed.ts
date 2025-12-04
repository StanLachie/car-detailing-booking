import "dotenv/config";
import { auth } from "../lib/auth";

async function seed() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASS;

  if (!email || !password) {
    console.error("Missing ADMIN_EMAIL or ADMIN_PASS environment variables");
    process.exit(1);
  }

  try {
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: "Admin",
      },
    });

    if (result) {
      console.log("Admin user created successfully:", email);
    }
  } catch (error) {
    // User might already exist
    console.log("User may already exist or error occurred:", error);
  }
}

seed();
