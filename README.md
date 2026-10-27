# StreamOps — Streaming Operations Console

A full-stack learning project for managing a fictional streaming catalogue and tracking service incidents. StreamOps brings together a browser UI, REST-style API, validation, and PostgreSQL persistence in one small application.

**Built with:** HTML · CSS · JavaScript · Node.js · Express · PostgreSQL · Node.js Test Runner

> **Project scope:** This is an independent educational demo, not a real streaming service. Catalogue and incident records persist in PostgreSQL. Service-health values, charts, and trend indicators are illustrative sample data—not live monitoring or production telemetry.

## Screenshots

The screenshots below show the application running locally. Add your genuine PNG screenshots to `docs/screenshots/` using these exact filenames:

### Overview
![StreamOps overview dashboard](docs/screenshots/overview.png.png)

### Content catalogue
![StreamOps content catalogue](docs/screenshots/catalogue.png.png)

### Incident tracker
![StreamOps incident management](docs/screenshots/incidents.png.png)

### Learning lab
![StreamOps learning lab](docs/screenshots/learning-lab.png.png)


## What you can do

- **Manage a content catalogue:** browse, search, filter, and add titles.
- **Track incidents:** create incidents, inspect severity and status, and move work through Open → Investigating → Resolved.
- **Persist application data:** store titles and incidents in PostgreSQL so records remain after refresh.
- **Explore engineering concepts:** use the built-in learning lab for architecture, HTTP APIs, database design, incident lifecycles, and testing.
- **Run automated checks:** execute nine unit tests for shared validation logic.

## Architecture

```mermaid
flowchart LR
    B["Browser<br/>HTML · CSS · JavaScript"] -->|"HTTP / JSON"| A["Express API<br/>server.js"]
    A --> V["Shared validation<br/>lib/validation.js"]
    A -->|"Parameterized SQL<br/>pg driver"| DB[("PostgreSQL")]
    M["SQL migrations<br/>scripts/migrate.js"] --> DB
    S["Demo seed data<br/>scripts/seed.js"] --> DB
    B -.-> L["Learning lab"]
    B -.-> D["Illustrative health metrics"]
```

The browser sends requests to the Express API. The server validates input and uses parameterized SQL queries to read and write PostgreSQL records. The learning lab runs in the browser; service-health visuals are demo values and are not connected to real monitoring systems.

For the expanded diagram and component responsibilities, see [docs/architecture.md](docs/architecture.md).

## Tech stack

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | HTML, CSS, vanilla JavaScript | Dashboard, catalogue, incident workflows, learning lab |
| API | Node.js, Express | HTTP routes, request handling, response codes |
| Validation | Shared JavaScript module | Required fields, allowed values, and input limits |
| Database | PostgreSQL, `pg` | Persistent title and incident records |
| Database setup | SQL migrations and seed script | Repeatable schema setup and safe demo seeding |
| Tests | Node.js built-in test runner | Automated unit tests for validation rules |

## Run locally on Windows

### Prerequisites

- Node.js 20 or newer
- PostgreSQL 13 or newer
- Git (to clone the repository)

### 1. Clone the repository

```powershell
git clone https://github.com/jothikapugaz/streamops.git
cd streamops
```

### 2. Create the database

In pgAdmin, connect to your local PostgreSQL server, open the Query Tool, and run:

```sql
CREATE DATABASE streamops;
```

If the database already exists, do not create it again.

### 3. Configure your environment

```powershell
Copy-Item .env.example .env
```

Edit `.env` and replace `your_password` with your local PostgreSQL user's password:

```dotenv
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/streamops
PORT=3000
```

Keep `.env` private; it is excluded by `.gitignore`. If your password contains URL-special characters, URL-encode them in the connection URL.

### 4. Install dependencies and prepare the database

```powershell
npm install
npm run db:migrate
npm run db:seed
```

The migration runner records completed migrations and skips them on later runs. The seed script adds fictional starter records only when both application tables are empty.

### 5. Start the application

```powershell
npm start
```

Open [http://localhost:3000](http://localhost:3000). Check the API and database connection at [http://localhost:3000/api/health](http://localhost:3000/api/health). A healthy response looks like:

```json
{"status":"ok","database":"connected"}
```

Keep the terminal open while using the app. Press `Ctrl+C` to stop the server. Use `npm run dev` for development with automatic server restarts.

## API reference

All standalone API routes are prefixed with `/api`.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check API and database connectivity |
| GET | `/api/titles` | List catalogue records |
| POST | `/api/titles` | Validate and create a title |
| GET | `/api/incidents` | List incidents |
| POST | `/api/incidents` | Validate and create an incident |
| PUT | `/api/incidents/:id` | Update an incident's status |

The API checks required fields and supported values. Database writes use parameterized queries. Updating a nonexistent incident returns `404`; unexpected server errors return a generic response while details are logged in the server terminal.

## Tests

### Unit tests

Run the nine fast unit tests for shared validation rules:

```powershell
npm test
```

### API/database integration tests

The integration suite starts the real Express app on an ephemeral local port and sends HTTP requests to it while using a dedicated PostgreSQL database. It checks database connectivity, title creation and persistence, validation failures, incident creation and status updates, and expected HTTP status codes.

**Safety first:** use a separate database named `streamops_test`. The test suite refuses to run unless `STREAMOPS_TEST_DATABASE_URL` points to a database whose name ends in `_test` or `-test`. Never point it at your normal development or production database.

1. Create the test database once in pgAdmin:

   ```sql
   CREATE DATABASE streamops_test;
   ```

2. Add a test connection to your local `.env` file (use your own PostgreSQL password):

   ```dotenv
   STREAMOPS_TEST_DATABASE_URL=postgresql://postgres:your_password@localhost:5432/streamops_test
   ```

3. Apply the migrations to the **test database**, not the normal `streamops` database. In PowerShell:

   ```powershell
   $env:DATABASE_URL = "postgresql://postgres:your_password@localhost:5432/streamops_test"
   npm run db:migrate
   Remove-Item Env:DATABASE_URL
   ```

4. Run the integration tests:

   ```powershell
   npm run test:integration
   ```

The suite creates uniquely named test records and removes those records afterward. The GitHub Actions workflow provisions a disposable PostgreSQL service and runs migrations, unit tests, and integration tests automatically on pushes and pull requests.

Integration tests exercise actual HTTP requests and SQL queries; they are distinct from the unit tests.

## Repository structure

```text
streamops/
├── api/                     # Hatchable-hosted API handlers
├── docs/
│   ├── architecture.md      # Architecture and request flow
│   └── screenshots/         # Genuine application screenshots
├── lib/
│   └── validation.js        # Shared validation rules
├── migrations/              # PostgreSQL schema migrations
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── scripts/
│   ├── migrate.js
│   └── seed.js
├── tests/
│   └── validation.test.mjs
├── server.js                # Standalone Express server
├── seed.sql
├── .env.example
└── package.json
```

## Design decisions worth discussing

- **Separate UI, API, and persistence:** each layer has a clear responsibility.
- **Validate on the server:** browser-side checks alone cannot be trusted for incoming requests.
- **Use parameterized SQL:** user-provided values are passed separately from SQL query text.
- **Track migrations:** database schema setup is repeatable instead of relying on manual table creation.
- **Guard demo seeding:** the seed script avoids adding sample data to a database that already contains application records.
- **Be transparent about simulated metrics:** the dashboard does not imply that a real streaming platform is being monitored.

## Current limitations and next steps

- [x] Add repeatable HTTP/database integration tests.
- [ ] Add genuine screenshots of the locally running application.
- [ ] Improve accessibility and keyboard interaction checks.
- [ ] Consider pagination and stronger server-side search/filtering.
- [ ] Replace illustrative health metrics with a clearly scoped real telemetry source if the project evolves in that direction.

## Hosted version

The repository also retains the original Hatchable API handlers under `api/`. They use Hatchable's platform-provided database client and are not standalone Express routes. The conventional local app uses `server.js`; both versions share `lib/validation.js`.

The project workspace is available at the [StreamOps Hatchable console](https://hatchable.com/console/projects/streamops-streaming-y8c2). Access to that workspace is managed separately from this GitHub repository.

## About this project

StreamOps is an independent portfolio project created to practise full-stack application structure, REST-style APIs, input validation, SQL persistence, and operational workflows. It is not affiliated with or endorsed by Netflix or any other streaming company.
