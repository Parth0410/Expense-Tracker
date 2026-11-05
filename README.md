# Expense Tracker

## Run locally

```powershell
cd expense-tracker
python -m http.server 8080
```

Open `http://localhost:8080`.

## Publish for access on any device

This is a static application. Deploy the folder contents to any HTTPS static host, such as GitHub Pages, Netlify, Cloudflare Pages, Azure Static Web Apps, or Firebase Hosting.

After deployment, open the HTTPS URL on a phone or computer. Supported browsers can install the app from the browser menu.

Transactions are stored in each browser using `localStorage`. They remain available on that device and browser, but are not synchronized between devices.
