/**
 * Fetches today's prayer times from AlAdhan API and pushes them
 * to a TRMNL private plugin via the merge_variables endpoint.
 *
 * Required env vars:
 *   TRMNL_PLUGIN_UUID  – the UUID of your private plugin setting
 *   TRMNL_API_KEY      – your TRMNL API key (Bearer token)
 *   PRAYER_LATITUDE    – latitude for prayer time calculation
 *   PRAYER_LONGITUDE   – longitude for prayer time calculation
 *   PRAYER_METHOD      – AlAdhan calculation method id (default: 2 = ISNA)
 *   PRAYER_TIMEZONE    – IANA timezone, e.g. "America/New_York" (default: UTC)
 */

const ALADHAN_API = "https://api.aladhan.com/v1/timings";
const TRMNL_API = "https://trmnl.com/api/custom_plugins/";

async function fetchPrayerTimes() {
  const lat = process.env.PRAYER_LATITUDE;
  const lng = process.env.PRAYER_LONGITUDE;
  const method = process.env.PRAYER_METHOD || "2";
  const tz = process.env.PRAYER_TIMEZONE || "UTC";

  if (!lat || !lng) {
    throw new Error("PRAYER_LATITUDE and PRAYER_LONGITUDE are required");
  }

  // Use current date in the target timezone
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const parts = formatter.formatToParts(now);
  const day = parts.find((p) => p.type === "day").value;
  const month = parts.find((p) => p.type === "month").value;
  const year = parts.find((p) => p.type === "year").value;
  const datePath = `${day}-${month}-${year}`;

  const url = `${ALADHAN_API}/${datePath}?latitude=${lat}&longitude=${lng}&method=${method}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`AlAdhan API error: ${res.status}`);

  const json = await res.json();
  return {
    timings: json.data.timings,
    date: json.data.date.readable,
    hijri: json.data.date.hijri.date,
    hijriMonth: json.data.date.hijri.month.en,
    hijriYear: json.data.date.hijri.year,
  };
}

function stripTimezone(time) {
  // AlAdhan returns "HH:MM (TZ)" — strip the timezone part
  return time.split(" ")[0];
}

function toMinutes(time) {
  const [h, m] = stripTimezone(time).split(":");
  return Number(h) * 60 + Number(m);
}

function to12Hour(time) {
  const clean = stripTimezone(time);
  const [h, m] = clean.split(":");
  const hour = Number(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${m} ${ampm}`;
}

function determineNextPrayer(timings) {
  const tz = process.env.PRAYER_TIMEZONE || "UTC";
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-GB", {
    timeZone: tz,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
  const nowMinutes = toMinutes(timeStr);

  const prayers = [
    { name: "Fajr", time: timings.Fajr },
    { name: "Sunrise", time: timings.Sunrise },
    { name: "Dhuhr", time: timings.Dhuhr },
    { name: "Asr", time: timings.Asr },
    { name: "Maghrib", time: timings.Maghrib },
    { name: "Isha", time: timings.Isha },
  ];

  const next = prayers.find((p) => toMinutes(p.time) > nowMinutes);
  return next ? next.name : prayers[0].name; // wrap to Fajr if past Isha
}

async function pushToTrmnl(mergeVariables) {
  const uuid = process.env.TRMNL_PLUGIN_UUID;
  const apiKey = process.env.TRMNL_API_KEY;

  if (!uuid || !apiKey) {
    throw new Error("TRMNL_PLUGIN_UUID and TRMNL_API_KEY are required");
  }

  const res = await fetch(`${TRMNL_API}/${uuid}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ merge_variables: mergeVariables }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`TRMNL API error: ${res.status} — ${body}`);
  }

  return res.json();
}

async function main() {
  const { timings, date, hijri, hijriMonth, hijriYear } =
    await fetchPrayerTimes();
  const nextPrayer = determineNextPrayer(timings);

  const mergeVariables = {
    fajr: to12Hour(timings.Fajr),
    sunrise: to12Hour(timings.Sunrise),
    dhuhr: to12Hour(timings.Dhuhr),
    asr: to12Hour(timings.Asr),
    maghrib: to12Hour(timings.Maghrib),
    isha: to12Hour(timings.Isha),
    next_prayer: nextPrayer,
    date,
    hijri_date: `${hijri} ${hijriMonth} ${hijriYear}`,
  };

  console.log("Pushing to TRMNL:", JSON.stringify(mergeVariables, null, 2));
  const result = await pushToTrmnl(mergeVariables);
  console.log("Success:", JSON.stringify(result));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
