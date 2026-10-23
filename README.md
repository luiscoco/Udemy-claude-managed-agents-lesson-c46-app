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

The snapshot below uses the current local file's variable names. Every non-PORT value, including IDs, is redacted **before** rendering the image.

![Sanitized local .env configuration](docs/images/env-redacted.png)

Regenerate it locally with `python scripts/capture-env-example.py` after installing Python Playwright and its Chromium browser. This optional documentation tool is not needed to run the app.

## How the application was developed

The browser collects inputs; the Node host validates requests; the lesson implementation produces observable evidence. The architecture page walks through the real source with numbered steps, prerequisite configuration, source filenames and code excerpts.

### Lesson implementation

[src/lesson.ts](https://github.com/luiscoco/Udemy-claude-managed-agents-lesson-c46-app/blob/main/src/lesson.ts)

```typescript
  async run(input) {

const reportName=text(input,"report"),habitat=text(input,"habitat"),limit=number(input,"limit");
if(reportName!=="survey_counts"||!["forest","wetland"].includes(habitat)||!Number.isInteger(limit)||limit<1||limit>20)return report("rejected","Only the reviewed bounded report schema is supported",{},["Validate before opening a database connection"]);
const {DatabaseSync}=await import("node:sqlite");const db=new DatabaseSync(":memory:");
try{db.exec("CREATE TABLE observations(tenant TEXT,habitat TEXT); INSERT INTO observations VALUES ('demo','wetland'),('demo','wetland'),('demo','forest'),('other','wetland'); PRAGMA query_only=ON;");
const sql="SELECT habitat,COUNT(*) AS count FROM observations WHERE tenant=? AND habitat=? GROUP BY habitat LIMIT ?";
const rows=db.prepare(sql).all("demo",habitat,limit);
return report("passed","Executed the fixed parameterized local report",{count:rows.length?Number(rows[0].count):0,rows,sql,parameters:["demo",habitat,limit],tenantFrom:"server-owned demo context",database:"SQLite in-memory fixture"},["Install the local seed data","Enable query-only mode","Bind tenant and habitat as parameters","Return only the fixed report fields"]);
}finally{db.close();}

  }
};
```

Read the architecture page for the remaining source excerpts and explanations, including input handling and optional provider behavior. The diagram describes this application, rather than implying that an external integration has been implemented.

## Validation

```powershell
npm test
python scripts/verify-walkthrough.py
```

The source hash check detects when walkthrough excerpts need refreshing. Browser verification covers page navigation, readable text, mobile layout, dark mode, diagram and image routes. Local scenarios and live provider calls are recorded separately in the workspace verification report; local success is not evidence of a live provider operation.

## Repository contents

Application sources, student web pages, safe configuration example and documentation images are included. `node_modules`, `presentation`, `output`, `reviewed`, `v3`, `teaching-material`, build output, local journals, credentials and local resource files are ignored. Existing teaching videos and presentations remain in the original workspace.
