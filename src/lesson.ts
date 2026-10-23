import { text, number, flag, list, object, hash, report, unique, safePath, type Lesson, type Input } from "./core";

// A focused local experiment derived from this lesson’s reviewed presentation.
export const lesson: Lesson = {
  number: 46,
  title: "Safe Data Access with a Database Agent",
  description: "Imagine students ask an agent how many habitat observations belong to their project. The agent needs a small report, not an administrator account or a general SQL console.",
  concepts: ["Use fixed reports, not raw SQL tools", "Bind tenant values on the host", "Read-only query and bounded results"],
  scope: "Executes a parameterized query on a seeded in-memory SQLite reporting database. PostgreSQL grants/RLS are not tested by this sample. Each run starts from a fresh local seed. The run journal stores results, not production workflow state.",
  cases: [{"id": "0", "label": "Read the owned wetland report", "input": {"report": "survey_counts", "habitat": "wetland", "limit": 10}, "expected": "passed", "checks": {"count": 2}}, {"id": "1", "label": "Reject an arbitrary SQL operation", "input": {"report": "DROP TABLE observations", "habitat": "wetland", "limit": 10}, "expected": "rejected", "checks": {}}, {"id": "2", "label": "Reject an invalid result limit", "input": {"report": "survey_counts", "habitat": "forest", "limit": 10000}, "expected": "rejected", "checks": {}}],
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
