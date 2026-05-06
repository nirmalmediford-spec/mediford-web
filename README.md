# Mediford Inquiry — Web App

Modern web companion to the Mediford Inquiry Android app.
Same Firebase backend (Auth + Firestore) — data syncs in real-time across phone and web.

## ⚡ Quick deploy

See **[DEPLOY-WEB-GUIDE.md](./DEPLOY-WEB-GUIDE.md)** for step-by-step setup.

After setup, the site auto-deploys to **https://mediford-inquiry.web.app** on every push to `main`.

## 🎨 Features

- **Dashboard** — KPIs, charts (pipeline, tender status, 6-month trend), team workload
- **Leads** — sortable table with filters, Excel import/export, PDF reports
- **Tenders** — table with deadline countdowns, status filters, Excel export, PDF reports
- **Calendar** — monthly view of all tender deadlines & pre-bid meetings
- **Reports** — Pipeline, Active Leads, Tenders, Active Tenders, Team Performance (PDFs)
- **Team** — admin-only role management
- **Profile** — update your own name, phone, designation

## 🔐 Roles

Same as Android app:

| Role | Sees Leads | Sees Tenders | Manages Team |
|------|:----------:|:------------:|:------------:|
| ADMIN | ✅ | ✅ | ✅ |
| MANAGER | ✅ | ✅ | — |
| SALES | ✅ | — | — |
| TELECALLER | ✅ | — | — |
| TENDER_MANAGER | — | ✅ | — |
| TENDER_EXECUTIVE | — | ✅ | — |

## 🛠️ Tech

- React 18 + Vite (fast)
- Material-UI v5 (matches Mediford purple theme)
- Recharts (dashboard charts)
- @mui/x-data-grid (Excel-like tables)
- Firebase 10 (auth, firestore, storage)
- jsPDF + jspdf-autotable (PDF reports with branding)
- xlsx (Excel import/export)
- date-fns (dates)

## 💻 Local dev (optional)

```bash
npm install
npm run dev    # opens http://localhost:5173
```

Make sure to fill in `src/firebase.js` with your Web App ID first.

## 🚢 Production build

```bash
npm run build
```

Output goes to `dist/`.

## 📱 Mobile

Fully responsive — works on phone browsers too.
But the dedicated Android app is faster on phones for daily use.
