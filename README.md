# Delivery Service (Temporal + Sequelize + CSV Import)

This project is a **proof-of-concept** for a delivery tracking system using:
- [Temporal](https://temporal.io/) for orchestrating workflows
- [Sequelize](https://sequelize.org/) with `sequelize-typescript` for DB ORM
- Folder-based CSV import for fast bulk creation of deliveries
- Workers for running Temporal workflows and file watchers

---

## Project Structure
```

src/
api/                # Express API
activities/         # Temporal activities
config/             # DB + env config
models/             # Sequelize models
workflows/          # Temporal workflows
workers/            # Temporal worker(s) and file watcher
imports/deliveries/   # CSV folder for imports

````

---

## Installation

```sh
yarn install
````

Set up your `.env` (see `src/config/env.ts` for required vars) and run Postgres from `docker-compose.yaml`:

```sh
docker-compose up -d
```

---

## Development Commands

```sh
# Start the API
yarn dev:api

# Start the Temporal main worker (runs workflows & activities)
yarn dev:worker

# Start the CSV watcher (monitors imports/deliveries folder)
yarn dev:watcher
```

> ⚠️ You should run **at least**:
>
> * `dev:worker`
> * `dev:watcher`
>
> Otherwise workflows won't trigger on file drop.

---

## Usage

### 1. Prepare CSV

Example (`imports/deliveries/sample.csv`):

```csv
customerName,contact,origin,destination
Paolo Ferri,+393278513015,8.68,45.07,7.68,45.07
```

### 2. Drop CSV into Import Folder

```
imports/deliveries/
```

The watcher will:

1. Rename the file to `imported_<filename>.csv`
2. Trigger `importDeliveriesWorkflow`
3. Insert each delivery into the DB

---

## Scaling

* You can run **multiple workers** for parallel workflow execution.
* In Kubernetes, run `main.worker` as a Deployment and **use HPA** (Horizontal Pod Autoscaler) for auto-scaling.
* Same for `watcher.worker` — but typically keep it **single instance** to avoid duplicate imports.
