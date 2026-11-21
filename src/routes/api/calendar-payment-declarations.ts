import { createFileRoute } from "@tanstack/react-router";

function clean(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export const Route = createFileRoute("/api/calendar-payment-declarations")({
  server: {
    handlers: {
      GET: async () => {
        const adminCode = clean(process.env.CALENDAR_ADMIN_CODE, 120);
        const calendarUrl = clean(process.env.CALENDAR_APP_URL, 500) || "https://hmerologiosillogou.vercel.app";
        if (!adminCode) return Response.json({ error: "Λείπει το CALENDAR_ADMIN_CODE." }, { status: 500 });
        try {
          const endpoint = new URL(`${calendarUrl.replace(/\/$/, "")}/api/payment-declarations`);
          endpoint.searchParams.set("code", adminCode);
          const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) {
            return Response.json({ error: typeof payload.error === "string" ? payload.error : "Δεν φορτώθηκαν οι δηλώσεις κατάθεσης." }, { status: response.status });
          }
          return Response.json({ ok: true, declarations: Array.isArray(payload.declarations) ? payload.declarations : [] });
        } catch (error) {
          console.error("CALENDAR_PAYMENT_DECLARATIONS_PROXY_FAILED", error);
          return Response.json({ error: "Δεν ήταν δυνατή η επικοινωνία με το ημερολόγιο." }, { status: 502 });
        }
      },
    },
  },
});
