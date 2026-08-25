# Eco Voltex Invoice System — Frontend

A React web application for creating and managing Eco Voltex invoices and quotations. It connects to a separate authenticated API to store records, track payments, and manage clients.

## What it does

- Sign in and sign out with token-based authentication.
- Create invoices with client details, work types, services, optional materials, discounts, payment method, and payment amount.
- Search existing clients while creating an invoice.
- View, filter, print, and download saved invoices.
- Create quotations with services, materials, discounts, notes, and a validity date.
- View, print, download, delete, and convert saved quotations into invoices.
- Use the admin dashboard to view invoice totals and revenue, filter records, update payments, edit invoices, delete invoices, and review unpaid balances.
- Render printable invoice HTML through a shared utility at `src/utils/invoiceHtml.js`.

## Technology

- React 18
- Create React App (`react-scripts`)
- React Router
- Axios
- Capacitor configuration for Android packaging

## Requirements

- Node.js 18 or later
- npm
- A running backend API that provides the required authentication, invoice, quotation, and client endpoints

## Installation

```bash
git clone https://github.com/Umer-014/Eco-Voltex-Invoice-Frontend.git
cd frontend-updated
npm install
```

## API configuration

Create a file named `.env` in the project root:

```env
REACT_APP_API_URL=http://localhost:5000
```

Replace the URL with your backend API URL. The Axios client reads this value in `src/lib/lib.js` and automatically sends the saved `eco_token` as a Bearer token.

Do not commit `.env` files containing private URLs or credentials.

## Run the app

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm start` | Start the development server. |
| `npm run build` | Create a production build in `build/`. |
| `npm test` | Run the test suite. |

## Application routes

All application pages require login. Unauthenticated users are redirected to `/login`.

| Route | Page |
| --- | --- |
| `/login` | Sign in page |
| `/create-invoice` | Create an invoice |
| `/saved-invoices` | Search, view, print, and download invoices |
| `/create-quote` | Create a quotation |
| `/saved-quotes` | Manage quotations and convert one to an invoice |
| `/admin` | Dashboard, payment tracking, filters, invoice editing, and unpaid-invoice list |

## API endpoints used by the frontend

The API base URL is set by `REACT_APP_API_URL`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/auth/login` | Sign in |
| `POST` | `/auth/logout` | Sign out |
| `GET` | `/auth/me` | Restore the logged-in user |
| `GET` | `/clients/?name=...` | Search clients |
| `GET`, `POST` | `/invoices` | List and create invoices |
| `GET`, `PUT`, `DELETE` | `/invoices/:invoiceNumber` | Read, update, or delete an invoice |
| `GET`, `POST` | `/quotes` | List and create quotations |
| `DELETE` | `/quotes/:quoteNumber/` | Delete a quotation |

## Project structure

```text
src/
├── Components/
│   ├── Admin.js                 # Invoice dashboard and administration
│   ├── InvoiceCreate.js         # Invoice form
│   ├── SavedInvoices.js         # Saved invoice list and printing
│   ├── Login.js                 # Authentication screen
│   └── Quotation/               # Quotation creation and management
├── context/AuthContext.jsx      # Login state and token handling
├── lib/lib.js                   # Configured Axios API client
├── utils/invoiceHtml.js         # Shared printable invoice template
├── App.js                       # Application providers and router
└── index.js                     # React entry point
```

## Android / Capacitor

The project includes a Capacitor configuration (`capacitor.config.ts`). After creating a production build, sync it with Capacitor using:

```bash
npm run build
npx cap sync android
```

The Android platform must be set up separately before opening or building the native Android project.

## Notes

- Invoice printing opens a new browser window using the shared invoice HTML template.
- This repository is the frontend only; it needs its backend API to work fully.
- The frontend stores the authentication token in browser local storage under `eco_token`.

