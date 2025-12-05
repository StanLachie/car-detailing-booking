import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const toNumber = process.env.NEXT_PUBLIC_CONTACT_NUMBER;

export async function sendSMS(message: string): Promise<boolean> {
  if (!accountSid || !authToken || !fromNumber || !toNumber) {
    console.warn("Twilio not configured, skipping SMS");
    return false;
  }

  try {
    const client = twilio(accountSid, authToken);

    await client.messages.create({
      body: message,
      from: fromNumber,
      to: toNumber,
    });

    return true;
  } catch (error) {
    console.error("Failed to send SMS:", error);
    return false;
  }
}
