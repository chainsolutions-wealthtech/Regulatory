import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";

const repository = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
if (!repository || !token) throw new Error("GITHUB_REPOSITORY_AND_TOKEN_REQUIRED");

const policy = JSON.parse(await readFile("ops/continuity/POLICY.json", "utf8"));
const checkpoint = JSON.parse(await readFile("ops/continuity/CHECKPOINT.json", "utf8"));
const now = Date.now();

const api = async (path) => {
  const response = await fetch(`https://api.github.com/repos/${repository}${path}`, {
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "x-github-api-version": "2022-11-28",
      "user-agent": "regulatory-continuity-watchdog",
    },
  });
  if (!response.ok) throw new Error(`GITHUB_API_${response.status}:${path}`);
  return response.json();
};

const branch = await api(`/branches/${policy.canonicalBranch}`);
const head = branch.commit.sha;
const commits = await api(`/commits?sha=${policy.canonicalBranch}&per_page=${policy.watchdog.recentCommitWindow}`);
const runsPayload = await api(`/actions/runs?branch=${policy.canonicalBranch}&per_page=${policy.watchdog.recentRunWindow}`);
const runs = runsPayload.workflow_runs.filter((run) => run.name !== "Continuity Watchdog");

const ageMinutes = (timestamp) => Math.floor((now - Date.parse(timestamp)) / 60000);
const ignoredPrefix = (message) => policy.ignoredCommitMessagePrefixes.some((prefix) => String(message).startsWith(prefix));

const stalledRuns = runs
  .filter((run) => ["queued", "in_progress"].includes(run.status))
  .filter((run) => ageMinutes(run.run_started_at ?? run.created_at) > policy.watchdog.workflowStallMinutes)
  .map((run) => ({ id: run.id, name: run.name, status: run.status, ageMinutes: ageMinutes(run.run_started_at ?? run.created_at), url: run.html_url }));

const consecutiveFailures = [];
const byName = new Map();
for (const run of runs) {
  const list = byName.get(run.name) ?? [];
  list.push(run);
  byName.set(run.name, list);
}
for (const [name, list] of byName.entries()) {
  let count = 0;
  const failed = [];
  for (const run of list) {
    if (run.status !== "completed") continue;
    if (run.conclusion === "failure") {
      count += 1;
      failed.push({ id: run.id, headSha: run.head_sha, url: run.html_url });
      if (count >= policy.watchdog.repeatedFailureThreshold) break;
    } else {
      break;
    }
  }
  if (count >= policy.watchdog.repeatedFailureThreshold) consecutiveFailures.push({ workflow: name, count, runs: failed });
}

const materialCommits = commits.filter((commit) => !ignoredPrefix(commit.commit.message));
const latestMaterial = materialCommits[0] ?? commits[0];
const noMaterialProgressMinutes = latestMaterial ? ageMinutes(latestMaterial.commit.committer?.date ?? latestMaterial.commit.author?.date) : null;

const checkpointBehind = checkpoint.sourceHead !== head;
let checkpointDelta = null;
if (checkpointBehind) {
  try { checkpointDelta = await api(`/compare/${checkpoint.sourceHead}...${head}`); }
  catch { checkpointDelta = { status: "UNAVAILABLE" }; }
}
const checkpointRecordedAt = Date.parse(checkpoint.recordedAt);
const checkpointAgeMinutes = Number.isFinite(checkpointRecordedAt) ? Math.floor((now - checkpointRecordedAt) / 60000) : null;
const deltaMessages = Array.isArray(checkpointDelta?.commits) ? checkpointDelta.commits.map((commit) => commit.commit.message) : [];
const onlyIgnoredDelta = checkpointBehind && deltaMessages.length > 0 && deltaMessages.every((message) => ignoredPrefix(message));

const findings = [];
if (stalledRuns.length) findings.push({ code: "WORKFLOW_STALLED", severity: "CRITICAL", details: stalledRuns });
if (consecutiveFailures.length) findings.push({ code: "REPEATED_WORKFLOW_FAILURE", severity: "CRITICAL", details: consecutiveFailures });
if (noMaterialProgressMinutes !== null && noMaterialProgressMinutes > policy.watchdog.noMaterialProgressMinutes) {
  findings.push({ code: "NO_MATERIAL_PROGRESS", severity: "WARNING", details: { minutes: noMaterialProgressMinutes, latestMaterialHead: latestMaterial?.sha ?? null } });
}
if (checkpointBehind && !onlyIgnoredDelta && checkpointAgeMinutes !== null && checkpointAgeMinutes > policy.watchdog.checkpointGraceMinutes) {
  findings.push({ code: "CHECKPOINT_STALE", severity: "WARNING", details: { checkpointHead: checkpoint.sourceHead, currentHead: head, checkpointAgeMinutes, aheadBy: checkpointDelta?.ahead_by ?? null, messages: deltaMessages.slice(0, 12) } });
}
if (checkpoint.branch !== policy.canonicalBranch || checkpoint.repository !== repository) {
  findings.push({ code: "CHECKPOINT_IDENTITY_DIVERGENCE", severity: "CRITICAL", details: { checkpointRepository: checkpoint.repository, checkpointBranch: checkpoint.branch, repository, canonicalBranch: policy.canonicalBranch } });
}

const report = {
  schemaVersion: "REGULATORY_CONTINUITY_WATCHDOG_REPORT_V1",
  generatedAt: new Date().toISOString(),
  repository, canonicalBranch: policy.canonicalBranch, head,
  checkpointHead: checkpoint.sourceHead, checkpointBehind,
  checkpointDeltaOnlyIgnoredEvidenceCommits: onlyIgnoredDelta,
  latestMaterialCommit: latestMaterial ? { sha: latestMaterial.sha, message: latestMaterial.commit.message, ageMinutes: noMaterialProgressMinutes } : null,
  stalledRuns, consecutiveFailures, findings,
  status: findings.some((item) => item.severity === "CRITICAL") ? "BLOCKED_OR_LOOP_RISK" : findings.length ? "ATTENTION" : "HEALTHY",
  invariants: policy.safety,
};

await writeFile("continuity-watchdog-report.json", JSON.stringify(report, null, 2) + "\n", "utf8");

const summary = process.env.GITHUB_STEP_SUMMARY;
if (summary) {
  const lines = ["# Regulatory Continuity Watchdog", "", `- Status: **${report.status}**`, `- HEAD: ${head}`, `- Checkpoint: ${checkpoint.sourceHead}`, `- Findings: **${findings.length}**`, ""];
  for (const finding of findings) lines.push(`## ${finding.severity} — ${finding.code}`, "", JSON.stringify(finding.details, null, 2), "");
  await writeFile(summary, lines.join("\n"), { flag: "a" });
}

for (const finding of findings) {
  const command = finding.severity === "CRITICAL" ? "error" : "warning";
  console.log(`::${command} title=Continuity ${finding.code}::${JSON.stringify(finding.details).slice(0, 3000)}`);
}
console.log(JSON.stringify(report, null, 2));
