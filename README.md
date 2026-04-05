# prayer-trmnl

Push daily Islamic prayer times to a TRMNL private plugin and render them as a simple highlighted schedule on the device.

## What This Repo Contains

- [push.js](/Users/ms/code/personal/prayer-trmnl/push.js): fetches prayer times from AlAdhan, determines the next prayer, and pushes `merge_variables` to TRMNL
- [template.html](/Users/ms/code/personal/prayer-trmnl/template.html): TRMNL plugin markup that renders the prayer schedule and highlights the upcoming prayer
- [.github/workflows/push-prayer-times.yml](/Users/ms/code/personal/prayer-trmnl/.github/workflows/push-prayer-times.yml): runs the push every 30 minutes

## How It Works

1. TRMNL renders `template.html` inside a private plugin.
2. `push.js` fetches today's prayer times for your configured latitude/longitude and calculation method.
3. The script converts the times to 12-hour format, finds the next prayer, and pushes those values to your TRMNL plugin.
4. The template highlights the next prayer row on the device.

## TRMNL Setup

1. Create a private plugin in TRMNL.
2. Paste the contents of [template.html](/Users/ms/code/personal/prayer-trmnl/template.html) into the plugin markup editor.
3. Copy the plugin UUID from the plugin settings page.
4. Create an API key in your TRMNL account settings.

## Configuration

Copy [.env.example](/Users/ms/code/personal/prayer-trmnl/.env.example) to `.env` or otherwise provide the same environment variables:

```bash
TRMNL_PLUGIN_UUID=your-plugin-uuid
TRMNL_API_KEY=your-trmnl-api-key
PRAYER_LATITUDE=53.5461
PRAYER_LONGITUDE=-113.4937
PRAYER_METHOD=2
PRAYER_TIMEZONE=America/Edmonton
```

## Environment Variables

- `TRMNL_PLUGIN_UUID`: private plugin UUID from TRMNL
- `TRMNL_API_KEY`: TRMNL bearer token
- `PRAYER_LATITUDE`: latitude used for prayer time lookup
- `PRAYER_LONGITUDE`: longitude used for prayer time lookup
- `PRAYER_METHOD`: AlAdhan calculation method id, defaults to `2`
- `PRAYER_TIMEZONE`: IANA timezone used for determining "next prayer", defaults to `UTC`

## Local Usage

Install nothing extra beyond Node 22+. The script uses the built-in `fetch` available in modern Node.

Run:

```bash
node push.js
```

Or:

```bash
npm run push
```

Expected behavior:

- fetch today's timings from AlAdhan
- print the payload being sent
- push `merge_variables` to your TRMNL private plugin

## GitHub Actions Usage

The workflow in [.github/workflows/push-prayer-times.yml](/Users/ms/code/personal/prayer-trmnl/.github/workflows/push-prayer-times.yml) runs every 30 minutes and can also be triggered manually.

Configure these in GitHub:

- repository secrets:
  - `TRMNL_PLUGIN_UUID`
  - `TRMNL_API_KEY`
- repository variables:
  - `PRAYER_LATITUDE`
  - `PRAYER_LONGITUDE`
  - `PRAYER_METHOD`
  - `PRAYER_TIMEZONE`

## Data Source

Prayer times come from the [AlAdhan API](https://aladhan.com/prayer-times-api).

## Notes

- The template currently renders a list-first layout with one highlighted row for the upcoming prayer.
- `push.js` still sends `hijri_date`, even though the current template does not display it.
- If you want a different visual treatment, edit [template.html](/Users/ms/code/personal/prayer-trmnl/template.html) only; the pushed variable names are already in place.
