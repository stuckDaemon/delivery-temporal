# Delivery Service (Temporal + Sequelize + CSV Import + Traffic Monitoring)

This repository contains a **production‑ready proof‑of‑concept** for a delivery tracking and traffic‑monitoring system.
It demonstrates how to integrate:

* [Temporal](https://temporal.io/) — **Workflow orchestration**
* [Sequelize](https://sequelize.org/) + `sequelize-typescript` — **Database ORM**
* Mapbox Directions API — **Traffic delay checks**
* Folder‑based CSV import — **Bulk delivery creation**
* Temporal workers — **Workflows, activities, file watching**
* Retry‑aware activities — **Resilient production behavior**

---

## 📂 Project Structure

```
src/
api/                  # Express REST API for deliveries & notifications
activities/           # Temporal activities (DB queries, traffic checks, AI, CSV)
config/               # Database + environment configuration
models/               # Sequelize models
workflows/            # Temporal workflows (import, monitor traffic, notify)
workers/              # Temporal workers & CSV file watcher
imports/deliveries/   # Folder for incoming CSV delivery files
```

---

## 🛠 Installation & Setup

### 1️⃣ Install dependencies

```bash
yarn install
```

### 2️⃣ Start PostgreSQL (via Docker)

```bash
docker-compose up -d
```

### 3️⃣ Configure environment variables

Create `.env` in the project root:

```env
API_PORT=3000
DATABASE_URL=postgres://user:pass@localhost:5432/delivery

MAPBOX_TOKEN=your_mapbox_token
USE_MOCK_TRAFFIC=false

OPENAI_API_KEY=sk-...

# Optional: Twilio for notifications
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

If you just want to run locally without external APIs, enable mock mode:

```env
USE_MOCK_TRAFFIC=true
MAPBOX_TOKEN=dummy
OPENAI_API_KEY=dummy
TWILIO_ACCOUNT_SID=dummy
TWILIO_AUTH_TOKEN=dummy
TWILIO_PHONE_NUMBER=+10000000000
```

---

## ▶ Running the System

The system is composed of **three main processes** that must be running together:

1. **API server** — Handles HTTP requests for deliveries and notifications
2. **Temporal main worker** — Runs workflows & activities (DB, traffic checks, notifications)
3. **CSV watcher** — Monitors the `imports/deliveries/` folder for new CSV files
4  **Cron Schedulers** — Running as separate cron scheduler to run workflows

Run each in its own terminal:

```bash
# Terminal 1: API
yarn dev:api

# Terminal 2: Temporal worker
yarn dev:worker

# Terminal 3: CSV watcher
yarn dev:watcher

# Terminal 4: Cron workflows
yarn schedules:create
```

> ⚠ If `worker` or `watcher` is not running, workflows will **not** trigger.

---

## 📥 Importing Deliveries

### Option 1 — Drop a CSV File

1. Create a CSV with the following columns:

```csv
customerName,contact,origin,destination
John Doe,+393278513007,-122.42,37.78
Jane Smith,+393278513008,-122.50,37.70
Mario Rossi,+393278513009,9.19,45.46
Giulia Verdi,+393278513010,10.99,44.50
```

* `origin` / `destination` → longitude,latitude
* `contact` → E.164 phone format for SMS notifications

2. Place it into:

```
imports/deliveries/
```

3. The watcher will:

    * Rename file → `imported_<filename>.csv`
    * Trigger the `importDeliveriesWorkflow`
    * Insert each delivery into the database

---

### Option 2 — Import via API

```bash
curl -X POST http://localhost:3000/deliveries/import \
  -H "Content-Type: application/json" \
  -d '[{
    "customerName":"Alice Johnson",
    "contact":"+15551234567",
    "origin":"8.68,45.07",
    "destination":"7.68,45.07"
  }]'
```

Once created you can then set as delivered, in this way notifications and pulling from db will stop. 

```bash
curl -X POST http://localhost:3000/deliveries/mark-delivered \
  -H "Content-Type: application/json" \
  -d '{"ids": ["uuid-of-delivery-1", "uuid-of-delivery-2"]}'
```

Replace the UUIDs with the actual delivery IDs.

---

## 🚦 Traffic Monitoring Workflow

Runs automatically **every 5 minutes** (via Temporal schedules):

1. Fetches **active deliveries** from DB
2. Calls **Mapbox API** (or mock) to check ETA
3. Updates **delay** in the DB
4. Optionally triggers **notification workflow** if delay changes

---

## 📢 Notifications

If Twilio is configured:

* Generates **AI‑written messages** via OpenAI
* Sends SMS updates via Twilio
* Falls back to **default text** if AI fails

---

## 📈 Scaling Notes

* **Main worker** can run in multiple instances for parallel workflow execution
* **Watcher** must be **single instance** to prevent duplicate imports
* In Kubernetes: scale main worker with **HPA**, keep watcher as a singleton

---

## 🧪 Testing Without APIs (Mock Mode)

Enable mock mode in `.env`:

```env
USE_MOCK_TRAFFIC=true
```

* Simulates traffic delays with random numbers
* Logs Twilio sends without actually sending
* Still generates AI messages (or uses fallback text)

---

## ⏳ Scheduling Workflows

### Start schedules

```bash
yarn schedules:create
```

Starts:

* `monitorTrafficWorkflow`
* `processNotificationsWorkflow`

---

### Terminate Scheduled Workflows

Use this command to **stop the recurring workflows** responsible for traffic monitoring and notification sending. This cleanly terminates the scheduled workflows, preventing further automatic executions:

```bash
yarn schedules:terminate
```

---

### Monitor Workflows with Temporal Web UI

Inspect workflow runs, view logs, and manage executions in the Temporal Web UI, accessible at:

```
http://localhost:8080
```

Make sure your Temporal server and web UI are running and reachable here.

---
