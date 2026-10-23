# C46 · Safe Data Access with a Database Agent

Executes a parameterized query on a seeded in-memory SQLite reporting database. PostgreSQL grants/RLS are not tested by this sample. Each run starts from a fresh local seed. The run journal stores results, not production workflow state.

## Concepts students will learn

- Use fixed reports, not raw SQL tools
- Bind tenant values on the host
- Read-only query and bounded results

## Configure and run

Use Node.js 24 or later. In PowerShell, from this repository's folder:

```powershell
node --version
npm ci
Copy-Item .env.example .env
notepad .env
```

No API key is required for the local experiment. Optional live commentary requires your own API key, agent ID and environment ID. It explains the local result; it does not activate the integration discussed in the lesson.

For the optional live path, set your API key, then run npm run setup if you do not already have resource IDs. The script creates the environment before a text-only agent, saves each ID immediately, and reuses IDs already configured. It uses CLAUDE_MODEL or the source default; choose a model available to your account. An uncertain network failure may have created a resource: inspect your account before retrying.

```powershell
npm start
```

Open `http://127.0.0.1:3046`. Navigation leads to `/guide.html#learning`, `/guide.html#run-guide`, `/architecture.html`, and the application lab. If you change `PORT`, use the configured port. Keep the terminal running; stop with Ctrl+C. `npm run dev` also starts the web application.

Select the first scenario, inspect its editable fields, press Run experiment, and compare the outcome and evidence with the table above. Select another scenario to investigate the boundary condition.

## Create your .env file

Copy `.env.example` to `.env` and enter your own values. Do not commit the real file. Restart the server after editing it. The example contains safe placeholders; optional settings may be left blank to use source defaults. Resource IDs and keys stay on the server.

```dotenv
ANTHROPIC_API_KEY=your_api_key
CLAUDE_MANAGED_AGENT_ID=your_agent_id
CLAUDE_MANAGED_ENVIRONMENT_ID=your_environment_id
PORT=3046
```

## How the app was build

### 1. Validate a fixed report contract

Only survey_counts with an allowed habitat and a limit from 1 to 20 is accepted. Callers cannot supply arbitrary SQL or a tenant identifier.

Source: [src/lesson.ts](src/lesson.ts#L13) · selected statements

```typescript
const reportName = text(input, "report"),
  habitat = text(input, "habitat"),
  limit = number(input, "limit");

if (
  reportName !== "survey_counts" ||
  !["forest", "wetland"].includes(habitat) ||
  !Number.isInteger(limit) ||
  limit < 1 ||
  limit > 20
)
  return report(
    "rejected",
    "Only the reviewed bounded report schema is supported",
    {},
    ["Validate before opening a database connection"],
  );
```

### 2. Create the SQLite fixture and run a parameterized report

This is an actual in-memory SQLite query. The fixed SQL binds the server-owned demo tenant, habitat and limit as values, enables query-only mode, and closes the database in finally. The other tenant’s rows remain outside the selected report.

Source: [src/lesson.ts](src/lesson.ts#L15) · selected statements

```typescript
const { DatabaseSync } = await import("node:sqlite");

const db = new DatabaseSync(":memory:");

try {
  db.exec(
    "CREATE TABLE observations(tenant TEXT,habitat TEXT); INSERT INTO observations VALUES ('demo','wetland'),('demo','wetland'),('demo','forest'),('other','wetland'); PRAGMA query_only=ON;",
  );
  const sql =
    "SELECT habitat,COUNT(*) AS count FROM observations WHERE tenant=? AND habitat=? GROUP BY habitat LIMIT ?";
  const rows = db.prepare(sql).all("demo", habitat, limit);
  return report(
    "passed",
    "Executed the fixed parameterized local report",
    {
      count: rows.length ? Number(rows[0].count) : 0,
      rows,
      sql,
      parameters: ["demo", habitat, limit],
      tenantFrom: "server-owned demo context",
      database: "SQLite in-memory fixture",
    },
    [
      "Install the local seed data",
      "Enable query-only mode",
      "Bind tenant and habitat as parameters",
      "Return only the fixed report fields",
    ],
  );
} finally {
  db.close();
}
```

### Check your understanding

Run **Read the owned wetland report** in the application. Compare the result with these scenario expectations:

```json
{
  "input": {
    "report": "survey_counts",
    "habitat": "wetland",
    "limit": 10
  },
  "expectedOutcome": "passed",
  "checkEvidence": {
    "count": 2
  }
}
```

Then try **Reject an arbitrary SQL operation**. Its expected outcome is `rejected`; identify the condition or evidence field that explains the difference.

## Validation

```powershell
npm test
python scripts/verify-walkthrough.py
```

The source hash check detects when walkthrough excerpts need refreshing. Browser verification covers page navigation, readable text, mobile layout, dark mode, diagram and image routes. Local scenarios and live provider calls are recorded separately in the workspace verification report; local success is not evidence of a live provider operation.

## Repository contents

Application sources, student web pages, safe configuration example and documentation images are included. `node_modules`, `presentation`, `output`, `reviewed`, `v3`, `teaching-material`, build output, local journals, credentials and local resource files are ignored. Existing teaching videos and presentations remain in the original workspace.
