"use server";

import { Resend } from 'resend';
import twilio from 'twilio';

/**
 * Sends an emergency medical reminder via Email and WhatsApp
 * This is a Server Action and will only run on the server.
 */
export async function sendEmergencyReminder(
  phone: string,
  email: string | undefined,
  medDetails: {
    name: string;
    dosage: string;
    frequency: string;
    purpose?: string;
  }
) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  // Clean and format phone number for Twilio (ensure E.164)
  let formattedPhone = phone.trim();
  if (!formattedPhone.startsWith('+') && !formattedPhone.startsWith('whatsapp:+')) {
    // If it starts with 03..., convert to +923...
    if (formattedPhone.startsWith('0')) {
      formattedPhone = `+92${formattedPhone.substring(1)}`;
    } else if (!formattedPhone.startsWith('92')) {
      formattedPhone = `+92${formattedPhone}`;
    } else {
      formattedPhone = `+${formattedPhone}`;
    }
  }

  const results: { email?: any; whatsapp?: any } = {};

  // 1. Send Email (via Resend)
  if (email) {
    try {
      const { data, error } = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: [email],
        subject: `🚨 CIRO Alert: Medication Due - ${medDetails.name}`,
        html: `
          <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #020617; color: #f8fafc; padding: 40px 20px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #10b981; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; margin: 0; text-transform: uppercase;">CIRO Intelligence</h1>
              <p style="color: #64748b; font-size: 12px; font-weight: 600; margin-top: 4px; letter-spacing: 0.1em;">CRISIS INTELLIGENCE & RESPONSE ORCHESTRATOR</p>
            </div>
            
            <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
              <div style="background-color: #10b981; width: 48px; height: 48px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                 <span style="font-size: 24px;">💊</span>
              </div>
              <h2 style="color: #ffffff; font-size: 18px; font-weight: 700; margin: 0 0 8px 0;">Medication Reminder</h2>
              <p style="color: #94a3b8; font-size: 14px; margin: 0;">Autonomous clinical reminder for your active prescription.</p>
            </div>

            <div style="padding: 0 10px;">
              <div style="margin-bottom: 24px;">
                <p style="color: #64748b; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Medication</p>
                <div style="font-size: 22px; font-weight: 700; color: #10b981;">${medDetails.name}</div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
                <div>
                  <p style="color: #64748b; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Dosage</p>
                  <div style="font-size: 15px; font-weight: 600; color: #ffffff;">${medDetails.dosage}</div>
                </div>
                <div>
                  <p style="color: #64748b; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Frequency</p>
                  <div style="font-size: 15px; font-weight: 600; color: #ffffff;">${medDetails.frequency}</div>
                </div>
              </div>

              ${medDetails.purpose ? `
              <div style="margin-bottom: 24px;">
                <p style="color: #64748b; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Clinical Purpose</p>
                <div style="font-size: 14px; color: #cbd5e1; line-height: 1.5;">${medDetails.purpose}</div>
              </div>
              ` : ''}

              <div style="background-color: #1e293b50; padding: 16px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #10b981;">
                <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 0;">
                  <strong>Doctor's Note:</strong> Please adhere strictly to the schedule above. If symptoms worsen or you develop a rash, contact emergency services through the CIRO portal.
                </p>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <a href="http://localhost:3000/patient" style="display: inline-block; background-color: #10b981; color: #020617; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 40px; border-radius: 8px; box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.39);">
                  Open Patient Portal
                </a>
              </div>
            </div>

            <div style="margin-top: 40px; text-align: center; border-top: 1px solid #1e293b; padding-top: 20px;">
              <p style="color: #475569; font-size: 11px; margin: 0;">
                Clinical monitoring provided by MediLink & CIRO Autonomous Network.<br/>
                Digitally verified by your MediLink Physician.
              </p>
            </div>
          </div>
        `,
      });
      results.email = { success: !error, id: data?.id, error: error?.message };
    } catch (err: any) {
      console.error("Resend Error:", err);
      results.email = { success: false, error: err.message };
    }
  }

  // 2. Send WhatsApp (via Twilio)
  try {
    const message = await twilioClient.messages.create({
      body: `Your appointment is coming up on Today at ${medDetails.name} dose. If you need to change it, please reply back and let us know.`,
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: formattedPhone.startsWith('whatsapp:') ? formattedPhone : `whatsapp:${formattedPhone}`,
    });
    results.whatsapp = { success: true, sid: message.sid };
  } catch (err: any) {
    console.error("Twilio Error:", err);
    results.whatsapp = { success: false, error: err.message };
  }

  return JSON.parse(JSON.stringify(results));
}
