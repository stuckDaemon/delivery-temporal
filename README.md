Here’s a **cleaned-up and complete README** that keeps your style, fills in the missing bits, and makes it easy for someone to actually run and test the whole system.
I’ve expanded the **environment variables section**, added **how to run end-to-end**, and clarified the **Temporal + API relationship**.

---

# Delivery Service (Temporal + Sequelize + CSV Import + Traffic Monitoring)

This project is a **proof-of-concept** for a delivery tracking & traffic monitoring system using:

* [Temporal](https://temporal.io/) for orchestrating workflows
* [Sequelize](https://sequelize.org/) with `sequelize-typescript` for DB ORM
* Mapbox Directions API for traffic delay checks
* Folder-based CSV import for bulk creation of deliveries
* Workers for running Temporal workflows, activities, and file watchers
* Retry-aware activities for production resilience

---

## Project Structure

```
src/
api/                  # Express API (REST endpoints for deliveries & notifications)
activities/           # Temporal activities (DB queries, traffic checks, imports, AI)
config/               # DB + env config
models/               # Sequelize models
workflows/            # Temporal workflows (import, monitor traffic, send notifications)
workers/              # Temporal worker(s) and file watcher
imports/deliveries/   # CSV folder for imports
```

---

## Installation

```sh
yarn install
```

Set up your `.env` (see below) and run Postgres from `docker-compose.yaml`:

```sh
docker-compose up -d
```

Run database migrations (if you have them) or let Sequelize auto-create tables on first run.

---

## Environment Variables

Example `.env`:

```env
# API
API_PORT=3000

# Database
DATABASE_URL=postgres://user:pass@localhost:5432/delivery

# Mapbox API
MAPBOX_TOKEN=your_mapbox_token
USE_MOCK_TRAFFIC=false # set to true for random delays without API calls

# OpenAI API
OPENAI_API_KEY=sk-...

# Twilio (optional if using notifications)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

---

## Development Commands

```sh
# Start the API
yarn dev:api

# Start the Temporal main worker (runs workflows & all activities)
yarn dev:worker

# Start the CSV watcher (monitors imports/deliveries folder)
yarn dev:watcher
```

> **Run at least:**
>
> * `dev:worker` (Temporal)
> * `dev:watcher` (CSV imports)
    >   Otherwise, workflows won’t trigger.

---

## Usage

### 1. Prepare CSV

Example (`imports/deliveries/sample.csv`):

```csv
customerName,contact,origin,destination
Paolo Ferri,+393278513015,8.68,45.07,7.68,45.07
```

* `origin` and `destination` are longitude,latitude pairs.
* The `contact` must be in **E.164 format** for Twilio to work.

---

### 2. Drop CSV into Import Folder

Place your file in:

```
imports/deliveries/
```

The watcher will:

1. Rename the file to `imported_<filename>.csv`
2. Trigger `importDeliveriesWorkflow`
3. Insert each delivery into the DB

---

## Traffic Monitoring Workflow

The `monitorTrafficWorkflow` runs **every 5 minutes** (via Temporal schedule or loop):

1. Fetches active deliveries from the DB (`db.activity.ts`)
2. Calls Mapbox API (`traffic.activity.ts`) to get estimated delays
3. Updates DB with the new delay
4. Optionally triggers **notification workflow** if delay changes significantly

---

## Notifications

If Twilio is configured:

* `notification.activity.ts` will queue and send SMS updates.
* AI-generated messages (`ai.activity.ts`) make notifications polite and human-readable.
* Fallback messages are used if OpenAI fails.

---

## Scaling

* Run multiple **main workers** for parallel workflow execution.
* In Kubernetes, deploy `main.worker` as a Deployment with **HPA** for auto-scaling.
* Keep `watcher.worker` as a **single instance** to avoid duplicate imports.
* Temporal schedules handle high-volume recurring workflows safely.

---

## Testing

You can test without hitting external APIs by enabling:

```env
USE_MOCK_TRAFFIC=true
```

This will simulate delays with random numbers, so you can test the end-to-end workflow without Mapbox calls.

---
## Local Quickstart (Mock Mode)

This mode lets you see the **traffic monitoring + notifications + AI message generation** working without any external dependencies.

---

### 1. Enable Mock Mode in `.env`

```env
USE_MOCK_TRAFFIC=true
MAPBOX_TOKEN=dummy
OPENAI_API_KEY=dummy
TWILIO_ACCOUNT_SID=dummy
TWILIO_AUTH_TOKEN=dummy
TWILIO_PHONE_NUMBER=+10000000000
```

Mock mode will:

* Use random delays instead of calling Mapbox
* Skip Twilio network calls (it will still log the “send” action)
* Still generate messages using your AI activity, but will **fall back to the predefined text** if OpenAI key is fake

---

### 2. Start Required Processes

In three different terminals:

```sh
# Terminal 1: Postgres
docker-compose up -d

# Terminal 2: Temporal main worker (runs workflows + activities)
yarn dev:worker

# Terminal 3: CSV watcher
yarn dev:watcher
```

---

### 3. Create a Test CSV

Create `imports/deliveries/test.csv`:

```csv
customerName,contact,origin,destination
Test Customer,+15550001111,8.68,45.07
```

---

### 4. Drop File into Import Folder

Move the file into:

```sh
mv test.csv imports/deliveries/
```

You should see:

```
✅ Imported 1 deliveries from imports/deliveries/imported_test.csv
[DB Activity] Found 1 deliveries to check
[Traffic Activity] [MOCK] 8.68,45.07 → 7.68,45.07: 37 min
[AI Activity] Generated message: Hi Test Customer, your delivery may be delayed by 37 minutes...
[Notification Activity] Queued notification for +15550001111
```

---

### 5. Check DB

You can verify with psql:

```sh
docker exec -it delivery-postgres psql -U user -d delivery -c "SELECT * FROM deliveries;"
docker exec -it delivery-postgres psql -U user -d delivery -c "SELECT * FROM notifications;"
```

You should see:

* `lastKnownDelay` updated for your delivery
* Notification queued with `delivered=false`

---

### 6. Mark Notification as Sent (Optional)

```sh
docker exec -it delivery-postgres psql -U user -d delivery -c "UPDATE notifications SET delivered=true WHERE delivered=false;"
```

