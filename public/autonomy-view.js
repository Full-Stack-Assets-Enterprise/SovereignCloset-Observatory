export const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g,(character) => ({
  "&":"&amp;",
  "<":"&lt;",
  ">":"&gt;",
  "'":"&#39;",
  '"':"&quot;"
}[character]));

export function renderMetricCards(overview) {
  const stats = overview?.stats || {};
  const metrics = [
    ["Autonomous cycles",stats.cycles ?? 0,"Recursive internal runs"],
    ["Evidence events",stats.events ?? 0,"Append-only observations and decisions"],
    ["Policy genomes",stats.policies ?? 0,"Versioned champion and challengers"],
    ["Constitutional violations",stats.constitutionalViolations ?? 0,"Hard-rule failures"]
  ];
  return metrics.map(([label,value,detail]) => `<article class="metric">
    <span>${escapeHtml(label)}</span>
    <strong>${escapeHtml(value)}</strong>
    <small>${escapeHtml(detail)}</small>
  </article>`).join("");
}

export function renderAgentCards(agents = []) {
  return agents.map((agent,index) => `<article class="agent-card state-${escapeHtml(agent.state)}" data-state="${escapeHtml(agent.state)}">
    <div class="agent-index">${String(index + 1).padStart(2,"0")}</div>
    <div class="agent-copy">
      <span>${escapeHtml(agent.id)}</span>
      <h3>${escapeHtml(agent.name)}</h3>
      <p>${escapeHtml(agent.mandate)}</p>
    </div>
    <div class="agent-state"><i></i>${escapeHtml(agent.state).toUpperCase()}</div>
  </article>`).join("");
}

export function renderCycleTimeline(cycle) {
  if (!cycle?.events?.length) return `<div class="empty-state">No autonomous cycle has run in this workspace yet.</div>`;
  return cycle.events.map((event) => `<article class="cycle-event" data-stage="${escapeHtml(event.stage)}">
    <div class="event-sequence">${String(event.sequence).padStart(2,"0")}</div>
    <div class="event-copy">
      <div class="event-meta"><span>${escapeHtml(event.agent)}</span><strong>${escapeHtml(event.evidenceType).toUpperCase()}</strong></div>
      <h3>${escapeHtml(event.stage).replaceAll("-"," ")}</h3>
      <p>${escapeHtml(event.summary)}</p>
    </div>
  </article>`).join("");
}

export function renderCycleHistory(cycles = []) {
  if (!cycles.length) return `<div class="empty-state">No completed cycles are available.</div>`;
  return cycles.map((cycle) => {
    const delta = Number(cycle.utilityDelta || 0);
    const signedDelta = `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}`;
    return `<article class="history-row">
      <div><span>${escapeHtml(cycle.id)}</span><strong>${escapeHtml(cycle.decision || cycle.status).toUpperCase()}</strong></div>
      <div><span>UTILITY DELTA</span><strong>${escapeHtml(signedDelta)}</strong></div>
      <time>${escapeHtml(cycle.createdAt || "Pending")}</time>
    </article>`;
  }).join("");
}
