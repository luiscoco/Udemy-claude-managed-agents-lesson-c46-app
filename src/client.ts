(() => {
  type Data = Record<string, unknown>;
  const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
  let scenarios: { id: string; label: string; input: Data }[] = [];
  let initial: Data = {};
  let liveConfigured = false;
  const friendly = (key: string) => key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, char => char.toUpperCase());
  function populate(input: Data) {
    initial = input; $("fields").replaceChildren();
    for (const [key, value] of Object.entries(input)) {
      const label = document.createElement("label"); label.textContent = friendly(key);
      let field: HTMLInputElement | HTMLTextAreaElement;
      if (typeof value === "object" || typeof value === "string" && (value.length > 100 || value.includes("\n"))) { field = document.createElement("textarea"); field.rows = 4; field.value = typeof value === "string" ? value : JSON.stringify(value, null, 2); }
      else { field = document.createElement("input"); field.type = typeof value === "boolean" ? "checkbox" : typeof value === "number" ? "number" : "text"; if (field.type === "checkbox") field.checked = Boolean(value); else field.value = String(value); }
      field.dataset.key = key; label.append(field); $("fields").append(label);
    }
  }
  function read(): Data {
    const value: Data = {};
    for (const field of $("fields").querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-key]")) {
      const key = field.dataset.key!; const original = initial[key];
      value[key] = typeof original === "boolean" ? (field as HTMLInputElement).checked : typeof original === "number" ? Number(field.value) : typeof original === "object" ? JSON.parse(field.value) : field.value;
    }
    return value;
  }
  async function run(live: boolean) {
    $("run").setAttribute("disabled", ""); $("live").setAttribute("disabled", ""); $("status").textContent = live ? "Waiting for the live text-only session…" : "Running the local experiment…";
    try {
      const response = await fetch(live ? "/api/live" : "/api/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(read()) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Request failed");
      if (live) { $("live-result").hidden = false; $("live-answer").textContent = data.answer || "No answer text was observed."; $("live-evidence").textContent = JSON.stringify(data, null, 2); $("status").textContent = `Live commentary stop reason: ${data.stopReason}.`; }
      else { $("empty").hidden = true; $("result").hidden = false; $("outcome").textContent = data.outcome; $("outcome").dataset.state = data.outcome; $("summary").textContent = data.summary; $("evidence").textContent = JSON.stringify(data.evidence, null, 2); $("steps").replaceChildren(); for (const step of data.steps) { const li = document.createElement("li"); li.textContent = step; $("steps").append(li); } $("status").textContent = "Experiment recorded in the local run journal."; }
    } catch (error) { $("status").textContent = error instanceof Error ? error.message : "Request failed"; }
    finally { $("run").removeAttribute("disabled"); if (liveConfigured) $("live").removeAttribute("disabled"); }
  }
  $("run").addEventListener("click", () => void run(false)); $("live").addEventListener("click", () => void run(true));
  $("scenario").addEventListener("change", () => populate(scenarios[Number(($<HTMLSelectElement>("scenario")).value)].input));
  Promise.all([fetch("/api/lesson").then(res => res.json()), fetch("/api/source").then(res => res.text())]).then(([lesson, source]) => {
    scenarios = lesson.cases; liveConfigured = lesson.liveConfigured;
    document.title = `C${String(lesson.number).padStart(2, "0")} · ${lesson.title}`;
    $("title").textContent = lesson.title; $("description").textContent = lesson.description; $("badge").textContent = `CONCEPT ${String(lesson.number).padStart(2, "0")} / 60`; $("scope").textContent = lesson.scope; $("code").textContent = source;
    for (const concept of lesson.concepts) { const li = document.createElement("li"); li.textContent = concept; $("concepts").append(li); }
    scenarios.forEach((scenario, index) => { const option = document.createElement("option"); option.value = String(index); option.textContent = scenario.label; $("scenario").append(option); });
    populate(scenarios[0].input); $("run").removeAttribute("disabled"); if (liveConfigured) $("live").removeAttribute("disabled");
    $("status").textContent = "Local experiment ready. Choose a scenario or edit its inputs.";
  }).catch(error => { $("status").textContent = String(error); });
})();
