import type { ExternalBooking } from "@/lib/external-calendar";
import type { BoardMember } from "@/lib/club-data";

export type NewsletterTemplateKind =
  | "seminar_announcement"
  | "seminar_zoom"
  | "member_meeting_announcement"
  | "member_meeting_zoom"
  | "free_newsletter";

export type NewsletterFields = {
  templateKind: NewsletterTemplateKind;
  subject: string;
  preheader: string;
  eyebrow: string;
  heading: string;
  dateLabel: string;
  dateText: string;
  intro: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  imageUrl: string;
  zoomUrl: string;
};

export const templateLabels: Record<NewsletterTemplateKind, string> = {
  seminar_announcement: "Ανακοίνωση σεμιναρίου / δράσης",
  seminar_zoom: "Zoom σεμιναρίου / δράσης",
  member_meeting_announcement: "Ενημέρωση μηνιαίας συνάντησης μελών",
  member_meeting_zoom: "Zoom μηνιαίας συνάντησης μελών",
  free_newsletter: "Ελεύθερο newsletter",
};

function esc(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function nl(value: string) {
  return esc(value).replaceAll("\n", "<br>");
}

export function greekEventDate(iso: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  return new Intl.DateTimeFormat("el-GR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Athens",
  }).format(new Date(`${iso}T12:00:00+03:00`));
}

function eventTitle(booking: ExternalBooking) {
  return booking.topic || booking.event_type || "Νέα δράση του Συλλόγου";
}

function eventFacts(booking: ExternalBooking) {
  const coordinators = [booking.therapist_name, booking.additional_coordinator_name].filter(Boolean).join(" & ");
  const price =
    booking.activity_category === "association_free"
      ? "Δωρεάν συμμετοχή"
      : booking.general_price
        ? `${booking.general_price} €${booking.offers_member_discount && booking.member_price ? ` · Μέλη/Φίλοι: ${booking.member_price} €` : ""}`
        : "";
  return [
    booking.action_time ? `Ώρα: ${booking.action_time}` : "",
    booking.mode ? `Τρόπος διεξαγωγής: ${booking.mode}` : "",
    coordinators ? `Συντονισμός: ${coordinators}` : "",
    price ? `Κόστος: ${price}` : "",
    booking.audience ? `Απευθύνεται σε: ${booking.audience}` : "",
  ].filter(Boolean);
}

export function fieldsFromBooking(
  booking: ExternalBooking,
  kind: NewsletterTemplateKind = "seminar_announcement",
): NewsletterFields {
  const title = eventTitle(booking);
  const date = greekEventDate(booking.booking_date);
  const details = eventFacts(booking);
  const calendarBase = (import.meta.env.VITE_CALENDAR_PUBLIC_URL as string | undefined)?.replace(/\/$/, "")
    || "https://hmerologiosillogou.vercel.app";
  const registrationUrl = `${calendarBase}/?event=${encodeURIComponent(booking.booking_date)}`;

  if (kind === "member_meeting_announcement" || kind === "member_meeting_zoom") {
    const isZoom = kind === "member_meeting_zoom";
    return {
      templateKind: kind,
      subject: isZoom ? `Σύνδεσμος Zoom — ${title} — ${date}` : `${title} — ${date}`,
      preheader: isZoom ? `Ο σύνδεσμος Zoom για την αυριανή συνάντηση των μελών.` : (booking.description || `Ενημέρωση για τη συνάντηση των μελών στις ${date}.`),
      eyebrow: "Μηνιαία συνάντηση μελών",
      heading: title || "Συνάντηση Μελών Συλλόγου",
      dateLabel: isZoom ? "Αύριο συναντιόμαστε" : "Ημερομηνία & ώρα",
      dateText: `${date}${booking.action_time ? ` · ${booking.action_time}` : ""}`,
      intro: isZoom
        ? "Αγαπητοί συνάδελφοι, σας περιμένουμε στην αυριανή συνάντηση των μελών. Παρακάτω θα βρείτε τον σύνδεσμο Zoom."
        : (booking.description || "Αγαπητοί συνάδελφοι, σας ενημερώνουμε για την επόμενη μηνιαία συνάντηση των μελών του Συλλόγου."),
      body: [booking.long_description || "", booking.program_details || ""].filter(Boolean).join("\n\n"),
      ctaLabel: isZoom ? "Σύνδεση στο Zoom" : "",
      ctaUrl: "",
      imageUrl: booking.image_url || "",
      zoomUrl: "",
    };
  }

  if (kind === "seminar_zoom") {
    return {
      templateKind: kind,
      subject: `Σύνδεσμος Zoom — ${title} — ${date}`,
      preheader: `Ο σύνδεσμος Zoom για τη δράση «${title}».`,
      eyebrow: "Υπενθύμιση συμμετοχής",
      heading: title,
      dateLabel: "Αύριο συναντιόμαστε",
      dateText: `${date}${booking.action_time ? ` · ${booking.action_time}` : ""}`,
      intro: "Σας περιμένουμε στη δράση του Συλλόγου. Παρακάτω θα βρείτε τον σύνδεσμο σύνδεσης στο Zoom.",
      body: details.filter((item) => !item.startsWith("Κόστος:")).join("\n\n"),
      ctaLabel: "Σύνδεση στο Zoom",
      ctaUrl: "",
      imageUrl: booking.image_url || "",
      zoomUrl: "",
    };
  }

  return {
    templateKind: kind,
    subject: `${title} — ${date}`,
    preheader: booking.description || `Νέα δράση του Συλλόγου στις ${date}.`,
    eyebrow: "Νέα δράση του Συλλόγου",
    heading: title,
    dateLabel: "Ημερομηνία & ώρα",
    dateText: `${date}${booking.action_time ? ` · ${booking.action_time}` : ""}`,
    intro: booking.description || "Σας προσκαλούμε στη νέα δράση του Συλλόγου.",
    body: [details.join("\n\n"), booking.long_description || "", booking.program_details || ""].filter(Boolean).join("\n\n"),
    ctaLabel: "Δήλωση συμμετοχής",
    ctaUrl: registrationUrl,
    imageUrl: booking.image_url || "",
    zoomUrl: "",
  };
}

export function blankFieldsFor(kind: NewsletterTemplateKind): NewsletterFields {
  if (kind === "member_meeting_zoom") {
    return {
      templateKind: kind,
      subject: "Σύνδεσμος Zoom — Μηνιαία συνάντηση μελών",
      preheader: "Ο σύνδεσμος Zoom για την αυριανή συνάντηση των μελών.",
      eyebrow: "Μηνιαία συνάντηση μελών",
      heading: "Συνάντηση Μελών Συλλόγου",
      dateLabel: "Αύριο συναντιόμαστε",
      dateText: "",
      intro: "Αγαπητοί συνάδελφοι, σας περιμένουμε στην αυριανή μηνιαία συνάντηση των μελών του Συλλόγου.",
      body: "",
      ctaLabel: "Σύνδεση στο Zoom",
      ctaUrl: "",
      imageUrl: "",
      zoomUrl: "",
    };
  }
  if (kind === "member_meeting_announcement") {
    return {
      templateKind: kind,
      subject: "Επόμενη μηνιαία συνάντηση μελών",
      preheader: "Ενημέρωση για την επόμενη συνάντηση των μελών του Συλλόγου.",
      eyebrow: "Μηνιαία συνάντηση μελών",
      heading: "Επόμενη συνάντηση μελών",
      dateLabel: "Ημερομηνία & ώρα",
      dateText: "",
      intro: "Αγαπητοί συνάδελφοι, σας ενημερώνουμε για την επόμενη μηνιαία συνάντηση των μελών του Συλλόγου.",
      body: "",
      ctaLabel: "",
      ctaUrl: "",
      imageUrl: "",
      zoomUrl: "",
    };
  }
  return {
    templateKind: kind,
    subject: "",
    preheader: "",
    eyebrow: kind === "free_newsletter" ? "Ενημέρωση Συλλόγου" : "Νέα δράση του Συλλόγου",
    heading: "",
    dateLabel: "Ημερομηνία & ώρα",
    dateText: "",
    intro: "",
    body: "",
    ctaLabel: kind === "seminar_zoom" ? "Σύνδεση στο Zoom" : "Δείτε περισσότερα",
    ctaUrl: "",
    imageUrl: "",
    zoomUrl: "",
  };
}

export function buildNewsletterHtml(fields: NewsletterFields, boardMembers: BoardMember[] = []) {
  const buttonUrl = fields.templateKind.endsWith("_zoom") ? fields.zoomUrl || fields.ctaUrl : fields.ctaUrl;
  const board = boardMembers.length
    ? boardMembers
        .map((member) => `<li><span class="role">${esc(member.role)}:</span> ${esc(member.name)}</li>`)
        .join("")
    : "";
  const hero = fields.imageUrl && /^https?:\/\//i.test(fields.imageUrl)
    ? `<div class="event-image"><img src="${esc(fields.imageUrl)}" alt="${esc(fields.heading)}"></div>`
    : "";
  const cta = buttonUrl && fields.ctaLabel
    ? `<div class="cta-wrap"><a class="cta" href="${esc(buttonUrl)}">${esc(fields.ctaLabel)}</a></div>`
    : "";

  return `<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(fields.subject || fields.heading || "Ενημέρωση Συλλόγου")}</title>
  <style>
    body{margin:0;padding:0;background-color:#f2f0ea;font-family:Georgia,'Times New Roman',serif;color:#25372c}
    .newsletter-wrapper{width:100%;background-color:#f2f0ea;padding:0}
    .newsletter-container{max-width:640px;margin:0 auto;background-color:#fbfaf6;overflow:hidden}
    .preheader{display:none!important;max-height:0;max-width:0;opacity:0;overflow:hidden;color:transparent}
    .header{background:linear-gradient(135deg,#244533 0%,#56755f 100%);padding:48px 32px 40px;text-align:center;color:#fff;box-sizing:border-box}
    .logo-wrap{width:100%;text-align:center;margin:0 auto 28px;line-height:0}
    .logo-circle{width:104px;height:104px;margin:0 auto;background:#fff;border-radius:50%;overflow:hidden;text-align:center;line-height:104px}
    .logo-circle img{max-width:88px;width:88px;height:auto;display:inline-block;vertical-align:middle;border:0;outline:none;text-decoration:none}
    .header-small{font-size:13px;letter-spacing:1.2px;text-transform:uppercase;font-weight:bold;margin:0 auto 10px;color:#f4f1ea;max-width:520px;line-height:1.6}
    .header-title{font-size:34px;line-height:1.1;margin:0 0 14px;font-weight:bold;color:#fff}
    .header-subtitle{font-size:14px;line-height:1.6;margin:0 auto;color:#f4f1ea;max-width:520px}
    .event-image img{display:block;width:100%;height:auto;max-height:390px;object-fit:cover}
    .content{padding:42px 34px 38px;background:#fbfaf6}
    .eyebrow{text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:1.4px;text-transform:uppercase;color:#6b776f;font-weight:bold;margin:0 0 12px}
    .main-title{text-align:center;font-size:28px;line-height:1.25;margin:0 0 26px;color:#263d30;font-weight:bold}
    .intro-box,.highlight-box{border:1px solid #d8d0c4;background:#f4efe7;border-radius:10px;padding:24px;margin:0 0 30px;text-align:center}
    .intro-label{font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:1.4px;text-transform:uppercase;color:#6b776f;margin:0 0 10px;font-weight:bold}
    .intro-date{font-size:22px;line-height:1.4;color:#233b2d;font-weight:bold;margin:0}
    .text{font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.9;color:#3f4641;margin:0 0 22px}
    .section-box{background:#fff;border:1px solid #e1ddd4;border-radius:10px;padding:24px;margin:24px 0}
    .section-title{font-size:20px;line-height:1.35;margin:0 0 14px;color:#263d30;font-weight:bold}
    .section-text{font-family:Arial,Helvetica,sans-serif;font-size:14.5px;line-height:1.9;color:#3f4641;margin:0}
    .cta-wrap{text-align:center;margin:30px 0}
    .cta{display:inline-block;background:#244533;color:#fff!important;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-weight:bold;font-size:15px;padding:14px 24px;border-radius:999px}
    .signature{margin-top:34px;padding-top:24px;border-top:1px solid #ded8ce;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.8;color:#3f4641}
    .board-box{background:#fff;border:1px solid #e1ddd4;border-radius:10px;padding:24px;margin-top:26px}
    .board-title{font-size:20px;margin:0 0 18px;color:#263d30;font-weight:bold;text-align:center}
    .board-list{margin:0;padding:0;list-style:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.9;color:#3f4641}
    .board-list li{border-bottom:1px solid #ece8df;padding:8px 0}.board-list li:last-child{border-bottom:none}.role{font-weight:bold;color:#263d30}
    .footer{background:#263d30;color:#f4f1ea;text-align:center;padding:24px 28px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6}.footer strong{color:#fff}
    @media only screen and (max-width:600px){.header{padding:40px 22px 34px}.content{padding:32px 20px}.header-title{font-size:30px}.main-title{font-size:25px}.section-box,.intro-box,.board-box{padding:20px}}
  </style>
</head>
<body>
  <div class="preheader">${esc(fields.preheader)}</div>
  <div class="newsletter-wrapper"><div class="newsletter-container">
    <div class="header">
      <div class="logo-wrap"><div class="logo-circle"><img src="https://storage.mlcdn.com/account_image/2196706/9AjWv06ksCHiQ7bSQy2ely4IMdJn11N2jzxJwSj7.png" alt="Σ.Ε.ΨΥ.G."></div></div>
      <div class="header-small">Πανευρωπαϊκός Επιστημονικός Σύλλογος</div>
      <h1 class="header-title">Σ.Ε.ΨΥ.G.</h1>
      <p class="header-subtitle">Σωματικά Επικεντρωμένη Ψυχοθεραπεία Gestalt</p>
    </div>
    ${hero}
    <div class="content">
      <p class="eyebrow">${esc(fields.eyebrow)}</p>
      <h2 class="main-title">${esc(fields.heading)}</h2>
      ${fields.dateText ? `<div class="intro-box"><p class="intro-label">${esc(fields.dateLabel)}</p><p class="intro-date">${esc(fields.dateText)}</p></div>` : ""}
      ${fields.intro ? `<p class="text">${nl(fields.intro)}</p>` : ""}
      ${fields.body ? `<div class="section-box"><h3 class="section-title">Πληροφορίες</h3><p class="section-text">${nl(fields.body)}</p></div>` : ""}
      ${cta}
      <div class="signature">Με εκτίμηση,<br><strong>Το Διοικητικό Συμβούλιο του Σ.Ε.ΨΥ.G.</strong></div>
      ${board ? `<div class="board-box"><h3 class="board-title">Διοικητικό Συμβούλιο</h3><ul class="board-list">${board}</ul></div>` : ""}
    </div>
    <div class="footer"><strong>Σ.Ε.ΨΥ.G.</strong><br>Πανευρωπαϊκός Επιστημονικός Σύλλογος<br>Σωματικά Επικεντρωμένη Ψυχοθεραπεία Gestalt</div>
  </div></div>
</body>
</html>`;
}
