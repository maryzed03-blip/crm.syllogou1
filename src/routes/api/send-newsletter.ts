import { createFileRoute } from "@tanstack/react-router";
import nodemailer from "nodemailer";

function clean(value: unknown, max = 100000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
}

function chunks<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

export const Route = createFileRoute("/api/send-newsletter")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as {
          subject?: unknown;
          html?: unknown;
          recipients?: unknown;
          testRecipient?: unknown;
          mode?: unknown;
        };
        const subject = clean(body.subject, 300);
        const html = clean(body.html, 500000);
        const requestedMode = clean(body.mode, 20);
        const mode = requestedMode === "test" ? "test" : requestedMode === "receipt" ? "receipt" : "bulk";
        const testRecipient = clean(body.testRecipient, 320).toLowerCase();
        const incoming = Array.isArray(body.recipients) ? body.recipients : [];
        const recipients = Array.from(
          new Set(incoming.map((value) => clean(value, 320).toLowerCase()).filter(validEmail)),
        );

        if (!subject || !html) return Response.json({ error: "Λείπει θέμα ή HTML περιεχόμενο." }, { status: 400 });
        if (mode === "test" && !validEmail(testRecipient)) {
          return Response.json({ error: "Συμπλήρωσε έγκυρο email για τη δοκιμή." }, { status: 400 });
        }
        if ((mode === "bulk" || mode === "receipt") && recipients.length === 0) {
          return Response.json({ error: "Δεν υπάρχουν ενεργοί παραλήπτες." }, { status: 400 });
        }
        if (recipients.length > 1000) {
          return Response.json({ error: "Το pilot επιτρέπει έως 1000 παραλήπτες ανά αποστολή." }, { status: 400 });
        }

        const gmailUser = clean(process.env.GMAIL_USER, 320);
        const gmailAppPassword = clean(process.env.GMAIL_APP_PASSWORD, 120).replaceAll(" ", "");
        const fromName = clean(process.env.MAIL_FROM_NAME, 160) || "Σύλλογος";
        if (!gmailUser || !gmailAppPassword) {
          return Response.json(
            { error: "Δεν έχει ρυθμιστεί το GMAIL_USER / GMAIL_APP_PASSWORD στο Vercel." },
            { status: 500 },
          );
        }

        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: gmailUser, pass: gmailAppPassword },
          connectionTimeout: 15000,
          greetingTimeout: 15000,
          socketTimeout: 25000,
        });

        try {
          if (mode === "test") {
            await transporter.sendMail({
              from: `"${fromName.replaceAll('"', "")}" <${gmailUser}>`,
              to: testRecipient,
              subject: `[TEST] ${subject}`,
              html,
            });
            return Response.json({ ok: true, sent: 1, mode: "test" });
          }

          if (mode === "receipt") {
            const recipient = recipients[0];
            await transporter.sendMail({
              from: `"${fromName.replaceAll('"', "")}" <${gmailUser}>`,
              to: recipient,
              subject,
              html,
              attachments: [
                {
                  filename: "apodeixi.html",
                  content: html,
                  contentType: "text/html; charset=utf-8",
                },
              ],
            });
            return Response.json({ ok: true, sent: 1, mode: "receipt" });
          }

          let sent = 0;
          // BCC προστατεύει τα email των παραληπτών. Μικρές παρτίδες είναι πιο σταθερές για Gmail.
          for (const batch of chunks(recipients, 40)) {
            await transporter.sendMail({
              from: `"${fromName.replaceAll('"', "")}" <${gmailUser}>`,
              to: gmailUser,
              bcc: batch,
              subject,
              html,
            });
            sent += batch.length;
          }
          return Response.json({ ok: true, sent, mode: "bulk" });
        } catch (error) {
          console.error("NEWSLETTER_SEND_FAILED", error);
          return Response.json({ error: "Η αποστολή email απέτυχε. Έλεγξε Gmail App Password και όρια λογαριασμού." }, { status: 502 });
        }
      },
    },
  },
});
