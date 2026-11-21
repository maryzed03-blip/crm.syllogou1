import { createFileRoute } from "@tanstack/react-router";

function clean(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export const Route = createFileRoute("/api/calendar-registrations")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const eventId = clean(url.searchParams.get("eventId"), 20);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(eventId)) {
          return Response.json({ error: "Μη έγκυρη δράση." }, { status: 400 });
        }

        const adminCode = clean(process.env.CALENDAR_ADMIN_CODE, 120);
        const calendarUrl = clean(process.env.CALENDAR_APP_URL, 500) || "https://hmerologiosillogou.vercel.app";
        if (!adminCode) {
          return Response.json({ error: "Λείπει το CALENDAR_ADMIN_CODE από το Hub." }, { status: 500 });
        }

        try {
          const endpoint = new URL(`${calendarUrl.replace(/\/$/, "")}/api/event-registrations`);
          endpoint.searchParams.set("eventId", eventId);
          endpoint.searchParams.set("code", adminCode);
          const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) {
            return Response.json(
              { error: typeof payload.error === "string" ? payload.error : "Δεν φορτώθηκαν οι συμμετοχές." },
              { status: response.status },
            );
          }
          const registrations = Array.isArray(payload.registrations) ? payload.registrations : [];
          return Response.json({ ok: true, registrations });
        } catch (error) {
          console.error("CALENDAR_REGISTRATIONS_PROXY_FAILED", error);
          return Response.json({ error: "Δεν ήταν δυνατή η επικοινωνία με το ημερολόγιο." }, { status: 502 });
        }
      },
    },
  },
});
