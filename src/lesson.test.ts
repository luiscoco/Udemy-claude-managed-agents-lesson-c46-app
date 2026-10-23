import { test } from "node:test";
import assert from "node:assert/strict";
import { lesson } from "./lesson";
for (const scenario of lesson.cases) {
  test(scenario.label, async () => {
    const result = await lesson.run(structuredClone(scenario.input));
    assert.equal(result.outcome, scenario.expected);
    for (const [key, value] of Object.entries(scenario.checks || {})) assert.deepEqual(result.evidence[key], value, key);
  });
}
