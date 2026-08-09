# Digitalized Ticketing System

Electronic queue/appointment system. Customers book a ticket (web, app, or kiosk) and
get a QR code + live queue position; staff call the next ticket from a dashboard;
everyone sees updates in real time via Socket.IO. Notifications go out by email (and
SMS/push when configured).

## Tech stack

| Layer               | Technology                                    | Status in this scaffold |
| -------------------- | --------------------------------------------- | ------------------------ |
| Frontend            | React + TypeScript + Tailwind CSS             | ✅ implemented |
| Mobile              | Flutter                                       | ✅ implemented (customer flow) |
| Backend             | Node.js + Express + TypeScript                | ✅ implemented |
| Database            | PostgreSQL                                    | ✅ (via Prisma) |
| ORM                 | Prisma                                        | ✅ implemented |
| Authentication      | Firebase Authentication (customers) + JWT/bcrypt (staff/admin) | ✅ implemented |
| Real-Time Updates   | Socket.IO                                     | ✅ implemented |
| Push Notifications  | Firebase Cloud Messaging                      | 🔲 stub only |
| Email               | Nodemailer                                    | ✅ implemented (falls back to console log without SMTP creds) |
| SMS                 | Twilio                                        | 🔲 stub only |
| QR Codes            | `qrcode` (backend) + `qr_flutter` (mobile) + `html5-qrcode`-ready web display | ✅ implemented |
| API Testing         | Postman                                       | — bring your own collection |
| Version Control     | Git & GitHub                                  | ✅ repo initialized |
| UI/UX Design        | Figma                                         | — external |
| Containerization    | Docker                                        | ✅ implemented (backend, frontend, Postgres via docker-compose) |
| Frontend Deployment | Vercel                                        | ⏳ not yet configured |
| Backend Deployment  | Railway or Render                             | ⏳ not yet configured |
| Database Hosting    | Railway PostgreSQL or Supabase PostgreSQL     | ⏳ not yet configured |
| Security            | JWT, bcrypt, Zod, Helmet, CORS, Rate Limiting | ✅ implemented |
| Analytics           | Chart.js                                      | ✅ implemented (admin dashboard) |

## Domain model

- **Service** — a queue/service point (e.g. "Passport Renewal", "Teller"), with an
  average service time used to estimate wait.
- **Ticket** — a customer's place in a service's queue. States:
  `WAITING → CALLED → SERVING → COMPLETED`, or `CANCELLED` / `NO_SHOW`.
- **User** — a customer, identified by Firebase UID (created lazily on first booking).
- **StaffUser** — an internal account (email + bcrypt password hash) that can log in
  to the staff dashboard and call tickets forward. Issued a JWT session on login.

## Repo layout

```
digital-ticketing-system/
  backend/           Express + TypeScript API, Prisma schema, Socket.IO server, Dockerfile
  frontend/          React + TypeScript + Tailwind app (customer booking + staff dashboard), Dockerfile
  mobile/            Flutter app (customer booking + live ticket status), Android/iOS
  docker-compose.yml Postgres + backend + frontend, wired together
```

## Running locally (without Docker)

### 1. Database

Point `DATABASE_URL` (see `backend/.env.example`) at a PostgreSQL instance, then:

```bash
cd backend
npm install
npx prisma migrate dev --name init
```

### 2. Backend

```bash
cd backend
cp .env.example .env   # fill in DATABASE_URL, FIREBASE_*, JWT_SECRET, etc.
npm run dev             # http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```

### 4. Mobile (Flutter)

```bash
cd mobile
flutter pub get
# Android emulator reaches host localhost at 10.0.2.2 (already the default in lib/config.dart)
flutter run --dart-define=API_URL=http://10.0.2.2:4000 --dart-define=SOCKET_URL=http://10.0.2.2:4000
# Physical device or iOS simulator: point API_URL/SOCKET_URL at your machine's LAN IP instead.
```

The mobile app covers the customer flow only (pick a service, book, watch live queue
status with a QR code) — the staff dashboard and admin analytics stay web-only.

## Running with Docker

```bash
docker compose up --build
```

This starts three containers:
- `postgres` — Postgres 16, with a named volume so data survives restarts
- `backend` — runs `prisma migrate deploy` on boot, then serves the API on `:4000`
- `frontend` — nginx serving the built React app on `:8080`, proxying `/api` and
  `/socket.io` through to `backend` so the browser only ever talks to one origin

Open **http://localhost:8080**. To point the Flutter app at this stack instead of a
local `npm run dev` backend, use `--dart-define=API_URL=http://<host-ip>:4000`.

Override secrets via a `.env` file next to `docker-compose.yml` (`JWT_SECRET`,
`FIREBASE_*`, `SMTP_*`, `TWILIO_*`) — see `docker-compose.yml` for the full list of
supported variables. None are required to boot the stack; unset ones just keep the
corresponding feature in stub mode.

## What's stubbed vs real

- **Email** sends for real once `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` are set; otherwise
  it logs the message to the console so local dev doesn't need a mail server.
- **SMS (Twilio)** and **push (FCM)** are wired through a single
  `notification.service.ts` dispatcher but only fire when their respective env vars
  are present — safe to leave unconfigured in development.
- **Cloud deployment configs** (Vercel / Railway / Render) are listed in the stack but
  intentionally left out of this pass — say the word and they're next.
