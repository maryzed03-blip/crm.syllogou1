import { createFileRoute } from "@tanstack/react-router";

function clean(value: unknown, max = 300) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export const Route = createFileRoute("/api/calendar-approve")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({}));
        const eventId = clean((body as { eventId?: unknown }).eventId, 20);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(eventId)) {
          return Response.json({ error: "Μη έγκυρη ημερομηνία δράσης." }, { status: 400 });
        }

        const adminCode = clean(process.env.CALENDAR_ADMIN_CODE, 120);
        const calendarUrl = clean(process.env.CALENDAR_APP_URL, 500) || "https://hmerologiosillogou.vercel.app";
        if (!adminCode) {
          return Response.json(
            { error: "Λείπει το CALENDAR_ADMIN_CODE από τα Environment Variables του Hub." },
            { status: 500 },
          );
        }

        try {
          const result = await fetch(`${calendarUrl.replace(/\/$/, "")}/api/approve-event`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: adminCode, eventId }),
          });
          const payload = await result.json().catch(() => ({}));
          if (!result.ok) {
            const message = typeof payload.error === "string" ? payload.error : "Το ημερολόγιο απέρριψε την έγκριση.";
            return Response.json({ error: message, code: payload.code }, { status: result.status });
          }
          return Response.json({ ok: true, eventId });
        } catch (error) {
          console.error("CALENDAR_APPROVAL_PROXY_FAILED", error);
          return Response.json({ error: "Δεν ήταν δυνατή η επικοινωνία με το ημερολόγιο." }, { status: 502 });
        }
      },
    },
  },
});
