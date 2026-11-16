# prayer-trmnl

Show today's Islamic prayer times on a TRMNL device, with the next prayer highlighted.

TRMNL polls the [AlAdhan API](https://aladhan.com/prayer-times-api) directly. There is no server, script, or GitHub Action: the plugin fetches the day's timings and [template.html](template.html) works out the next prayer when the screen renders.

## How It Works

1. On each refresh, TRMNL fetches the polling URL, which asks AlAdhan for today's timings in Edmonton.
2. The JSON response is available to the markup as `data` (`data.timings.Fajr` is `"07:19"`, `data.date.readable` is `"16 Nov 2026"`).
3. [template.html](template.html) gets the local time from `"now"` plus `trmnl.user.utc_offset`, picks the first prayer later than now (wrapping to Fajr after Isha), and formats each time as 12-hour.

## TRMNL Setup

1. In TRMNL, create (or open) a Private Plugin.
2. Set **Strategy** to **Polling** and **Polling Verb** to **GET**.
3. Set **Polling URL** to:

   ```
   https://api.aladhan.com/v1/timings/{{ "now" | date: "%s" | plus: trmnl.user.utc_offset | date: "%d-%m-%Y" }}?latitude=53.5461&longitude=-113.4937&method=2&timezonestring=America/Edmonton
   ```

   Click **Parse** under the box to check that it resolves to today's date.
4. Set **Max refresh rate** to **Every 15 mins**.
5. Open **Edit Markup**, paste the contents of [template.html](template.html) into the **Full** layout, and save.
6. In **Account → Time zone, language, theme and beta features**, set the time zone to **Alberta**. The template uses the account's UTC offset for the date in the URL, the next-prayer comparison, and the refresh time in the title bar.

## Changing Location or Method

Edit the query string in the polling URL:

- `latitude` / `longitude`: where to calculate prayer times
- `method`: AlAdhan calculation method id (`2` is ISNA)
- `timezonestring`: IANA time zone the returned times are in; keep it the same as the TRMNL account's time zone

AlAdhan's time zone comes from `timezonestring`, while the template's notion of "now" comes from the TRMNL account time zone, so the two must agree.
