import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import process from "node:process";

const root = process.cwd();
const command = process.argv[2] ?? "plan";
const runtimePolicy = await readJson("ops/agent-runtime/POLICY.json");
const continuityPolicy = await readJson("ops/continuity/POLICY.json");
const queue = await readJson("ops/agent-runtime/TASK_QUEUE.json");
const state = await readJson("ops/agent-runtime/STATE.json");
const checkpoint = await readJson("ops/continuity/CHECKPOINT.json");

function nowIso() {
  return new Date().toISOString();
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function writeJson(path, value) {
  await writeFile(path, JSON.stringify(value, null, 2) + "\n", "utf8");
}

async function ghOutput(name, value) {
  const output = process.env.GITHUB_OUTPUT;
  if (!output) return;
  const safe = String(value ?? "").replace(/\r?\n/g, "%0A");
  await writeFile(output, name + "=" + safe + "\n", { flag: "a" });
}

function githubHeaders(token) {
  return {
    accept: "application/vnd.github+json",
    authorization: "Bearer " + token,
    "x-github-api-version": "2022-11-28",
    "user-agent": "regulatory-continuous-agent-runtime",
  };
}

async function github(path, options = {}) {
  const repository = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;
  if (!repository || !token) throw new Error("GITHUB_REPOSITORY_AND_TOKEN_REQUIRED");
  const response = await fetch("https://api.github.com/repos/" + repository + path, {
    method: options.method ?? "GET",
    headers: {
      ...githubHeaders(token),
      ...(options.headers ?? {}),
      ...(options.body ? { "content-type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error("GITHUB_API_" + response.status + ":" + path + ":" + body.slice(0, 1000));
  }
  if (response.status === 204) return null;
  return response.json();
}

function ignoredCommit(message) {
  const prefixes = [
    ...(continuityPolicy.ignoredCommitMessagePrefixes ?? []),
    ...(runtimePolicy.ignoredCommitMessagePrefixes ?? []),
  ];
  return prefixes.some((prefix) => String(message ?? "").startsWith(prefix));
}

function parseLease(body) {
  const value = String(body ?? "");
  const get = (name) => {
    const match = value.match(new RegExp("^" + name + ":\\s*(.+)$", "mi"));
    return match ? match[1].trim() : null;
  };
  return {
    state: get("State") ?? "UNKNOWN",
    workerId: get("worker_id"),
    taskId: get("task_id"),
    baseHead: get("base_head"),
    acquiredAt: get("acquired_at"),
    expiresAt: get("expires_at"),
    heartbeatAt: get("heartbeat_at"),
  };
}

function leaseBodyHeld({ workerId, taskId, baseHead, acquiredAt, expiresAt, heartbeatAt }) {
  return [
    "# Regulatory Writer Lease",
    "",
    "State: HELD",
    "worker_id: " + workerId,
    "task_id: " + taskId,
    "base_head: " + baseHead,
    "acquired_at: " + acquiredAt,
    "expires_at: " + expiresAt,
    "heartbeat_at: " + heartbeatAt,
    "",
    "This issue is the single logical writer lease for autonomous or session-based agents working directly on canonical main.",
    "",
    "## Safety",
    "",
    "- no branch creation",
    "- no force push",
    "- no history rewrite",
    "- no regulatory activation",
    "- no simulated Legal/Compliance approval",
    "- no submission enablement",
    "- ready_for_submission=false",
    "",
    "Canonical protocol: ops/continuity/EXTERNAL_AGENT_CONTRACT.md",
  ].join("\n");
}

function leaseBodyAvailable({ completedTask, completedHead, outcome }) {
  return [
    "# Regulatory Writer Lease",
    "",
    "State: AVAILABLE",
    "",
    "last_completed_task: " + (completedTask || "NONE"),
    "last_completed_head: " + (completedHead || "UNKNOWN"),
    "last_outcome: " + (outcome || "UNKNOWN"),
    "released_at: " + nowIso(),
    "",
    "This issue is the single logical writer lease for autonomous or session-based agents working directly on canonical main.",
    "",
    "## Claim contract",
    "",
    "Before writing, an agent must set State: HELD with worker_id, task_id, base_head, acquired_at, expires_at and heartbeat_at.",
    "",
    "The agent must re-check main before every commit. If main diverges from base_head, it must reconcile before writing.",
    "",
    "## Expiry",
    "",
    "A stale lease may only be reclaimed after checking the current HEAD, active workflows, checkpoint and handoff.",
    "",
    "## Safety",
    "",
    "- no branch creation",
    "- no force push",
    "- no history rewrite",
    "- no regulatory activation",
    "- no simulated Legal/Compliance approval",
    "- no submission enablement",
    "- ready_for_submission=false",
    "",
    "Canonical protocol: ops/continuity/EXTERNAL_AGENT_CONTRACT.md",
  ].join("\n");
}

function workflowSnapshot(runs, targetHead) {
  const expected = runtimePolicy.requiredWorkflows;
  const result = {};
  for (const name of expected) {
    const matches = runs
      .filter((run) => run.name === name && run.head_sha === targetHead)
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
    const run = matches[0] ?? null;
    result[name] = run
      ? {
          id: run.id,
          status: run.status,
          conclusion: run.conclusion,
          url: run.html_url,
          createdAt: run.created_at,
          updatedAt: run.updated_at,
        }
      : { id: null, status: "missing", conclusion: null, url: null };
  }
  return result;
}

function classifyCi(snapshot) {
  const values = Object.values(snapshot);
  const missing = values.filter((item) => item.status === "missing");
  const pending = values.filter((item) => item.status === "queued" || item.status === "in_progress");
  const failed = values.filter((item) => item.status === "completed" && item.conclusion !== "success");
  const passed = values.filter((item) => item.status === "completed" && item.conclusion === "success");
  return { missing, pending, failed, passed, allPass: passed.length === values.length };
}

function getTask(taskId) {
  return queue.tasks.find((task) => task.id === taskId) ?? null;
}

function nextTask() {
  const completed = new Set(state.completedTaskIds ?? []);
  return queue.tasks
    .filter((task) => task.enabled !== false)
    .sort((a, b) => a.sequence - b.sequence)
    .find((task) => !completed.has(task.id)) ?? null;
}

function validateRuntimeConfig() {
  if (runtimePolicy.canonicalBranch !== continuityPolicy.canonicalBranch) {
    throw new Error("RUNTIME_CANONICAL_BRANCH_DIVERGENCE");
  }
  const ids = queue.tasks.map((task) => task.id);
  if (new Set(ids).size !== ids.length) throw new Error("RUNTIME_DUPLICATE_TASK_ID");
  if (runtimePolicy.safety.readyForSubmissionMustRemainFalse !== true) {
    throw new Error("RUNTIME_READY_FOR_SUBMISSION_SAFETY_MISSING");
  }
  if (runtimePolicy.safety.automaticRegulatoryActivation !== false) {
    throw new Error("RUNTIME_REGULATORY_ACTIVATION_MUST_BE_FALSE");
  }
}

async function plan() {
  validateRuntimeConfig();
  const branch = await github("/branches/" + runtimePolicy.canonicalBranch);
  const currentHead = branch.commit.sha;
  const commits = await github("/commits?sha=" + runtimePolicy.canonicalBranch + "&per_page=" + runtimePolicy.recentCommitWindow);
  const runsPayload = await github("/actions/runs?branch=" + runtimePolicy.canonicalBranch + "&per_page=" + runtimePolicy.recentRunWindow);
  const runs = runsPayload.workflow_runs ?? [];
  const material = commits.find((commit) => !ignoredCommit(commit.commit.message)) ?? commits[0];
  const materialHead = material?.sha ?? currentHead;
  const ci = workflowSnapshot(runs, materialHead);
  const ciClass = classifyCi(ci);
  const leaseIssue = await github("/issues/" + runtimePolicy.leaseIssueNumber);
  const lease = parseLease(leaseIssue.body);
  const now = Date.now();
  const leaseExpiry = lease.expiresAt ? Date.parse(lease.expiresAt) : NaN;
  const leaseExpired = lease.state === "HELD" && Number.isFinite(leaseExpiry) && leaseExpiry < now;
  const activeRuns = runs.filter((run) =>
    run.name !== runtimePolicy.workflowName &&
    ["queued", "in_progress"].includes(run.status)
  );
  const safeToReclaimLease = leaseExpired && activeRuns.length === 0 && currentHead === branch.commit.sha;

  const previousRuntimeRuns = runs
    .filter((run) => run.name === runtimePolicy.workflowName && run.status === "completed")
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  let consecutiveRuntimeFailures = 0;
  for (const run of previousRuntimeRuns) {
    if (run.conclusion === "failure") consecutiveRuntimeFailures += 1;
    else break;
  }

  let mode = "WAIT";
  let reason = "NO_ACTION";
  let task = null;
  let attempt = 1;

  if (lease.state === "HELD" && !leaseExpired) {
    mode = "WAIT";
    reason = "WRITER_LEASE_HELD:" + (lease.workerId ?? "UNKNOWN");
  } else if (lease.state === "HELD" && leaseExpired && !safeToReclaimLease) {
    mode = "BLOCKED";
    reason = "EXPIRED_LEASE_REQUIRES_SAFE_RECONCILIATION";
  } else if (
    consecutiveRuntimeFailures >= runtimePolicy.loopDetection.runtimeFailureThreshold &&
    !(state.activeTask && state.activeTask.status === "AWAITING_CI")
  ) {
    mode = "BLOCKED";
    reason = "REPEATED_RUNTIME_FAILURE_WITHOUT_MATERIAL_PROGRESS";
  } else if (state.activeTask && state.activeTask.status === "AWAITING_CI") {
    task = getTask(state.activeTask.taskId);
    attempt = Number(state.activeTask.attempt ?? 1);
    if (!task) {
      mode = "BLOCKED";
      reason = "ACTIVE_TASK_NOT_FOUND_IN_QUEUE";
    } else if (ciClass.missing.length || ciClass.pending.length) {
      mode = "WAIT";
      reason = "ACTIVE_TASK_CI_PENDING";
    } else if (ciClass.failed.length) {
      if (attempt >= runtimePolicy.loopDetection.maxAttemptsPerTask) {
        mode = "BLOCKED";
        reason = "ACTIVE_TASK_MAX_ATTEMPTS_REACHED";
      } else {
        mode = "SESSION_REPAIR_REQUIRED";
        reason = "ACTIVE_TASK_CI_FAILED_REQUIRES_CHATGPT_SESSION";
        attempt += 1;
      }
    } else if (ciClass.allPass) {
      mode = "RECONCILE";
      reason = "ACTIVE_TASK_ALL_GATES_PASS";
    } else {
      mode = "WAIT";
      reason = "ACTIVE_TASK_WAITING_FOR_GATES";
    }
  } else if (ciClass.missing.length || ciClass.pending.length) {
    mode = "WAIT";
    reason = "BASELINE_CI_PENDING_OR_MISSING";
  } else if (ciClass.failed.length) {
    mode = "BLOCKED";
    reason = "UNOWNED_BASELINE_CI_FAILURE";
  } else if (ciClass.allPass) {
    task = nextTask();
    if (!task) {
      mode = "IDLE";
      reason = "SAFE_QUEUE_EMPTY";
    } else if (task.kind === "STATE_ONLY") {
      mode = "RECONCILE";
      reason = "STATE_ONLY_TASK_READY";
    } else {
      mode = "SESSION_REQUIRED";
      reason = "SAFE_CODE_TASK_READY_FOR_CHATGPT_SESSION";
      attempt = 1;
    }
  }

  const today = nowIso().slice(0, 10);
  const daily = state.dailyBudget?.date === today ? state.dailyBudget : { date: today, agentRuns: 0, commits: 0 };
  // V2: code/reparation are executed only inside a ChatGPT subscription session.
  // GitHub Actions never invokes a paid model API and therefore does not enforce API-run budgets here.

  const plan = {
    schemaVersion: "REGULATORY_CONTINUOUS_AGENT_PLAN_V1",
    generatedAt: nowIso(),
    repository: process.env.GITHUB_REPOSITORY,
    canonicalBranch: runtimePolicy.canonicalBranch,
    currentHead,
    materialHead,
    checkpointHead: checkpoint.sourceHead,
    mode,
    reason,
    task,
    attempt,
    ci,
    ciSummary: {
      missing: ciClass.missing.length,
      pending: ciClass.pending.length,
      failed: ciClass.failed.length,
      passed: ciClass.passed.length,
      allPass: ciClass.allPass,
    },
    lease: {
      state: lease.state,
      workerId: lease.workerId,
      taskId: lease.taskId,
      expired: leaseExpired,
      safeToReclaim: safeToReclaimLease,
    },
    dailyBudget: daily,
    safety: runtimePolicy.safety,
  };
  await writeJson("continuous-agent-plan.json", plan);
  await ghOutput("mode", mode);
  await ghOutput("needs_write", mode === "RECONCILE" ? "true" : "false");
  await ghOutput("needs_session", ["SESSION_REQUIRED", "SESSION_REPAIR_REQUIRED"].includes(mode) ? "true" : "false");
  await ghOutput("should_run_agent", "false");
  await ghOutput("task_id", task?.id ?? "");
  await ghOutput("base_head", currentHead);
  await ghOutput("material_head", materialHead);
  await ghOutput("attempt", String(attempt));
  await ghOutput("reason", reason);
  console.log(JSON.stringify(plan, null, 2));
}

async function claim() {
  const planFile = process.env.CONTINUOUS_AGENT_PLAN ?? "continuous-agent-plan.json";
  const plan = JSON.parse(await readFile(planFile, "utf8"));
  const workerId = process.env.WORKER_ID;
  if (!workerId) throw new Error("WORKER_ID_REQUIRED");
  const branch = await github("/branches/" + runtimePolicy.canonicalBranch);
  if (branch.commit.sha !== plan.currentHead) {
    await ghOutput("claimed", "false");
    await ghOutput("claim_reason", "HEAD_DIVERGED");
    return;
  }
  const issue = await github("/issues/" + runtimePolicy.leaseIssueNumber);
  const lease = parseLease(issue.body);
  const now = Date.now();
  const expires = lease.expiresAt ? Date.parse(lease.expiresAt) : NaN;
  const expired = lease.state === "HELD" && Number.isFinite(expires) && expires < now;
  if (lease.state === "HELD" && !expired) {
    await ghOutput("claimed", "false");
    await ghOutput("claim_reason", "LEASE_HELD");
    return;
  }
  if (lease.state === "HELD" && expired && plan.lease.safeToReclaim !== true) {
    await ghOutput("claimed", "false");
    await ghOutput("claim_reason", "LEASE_EXPIRED_BUT_NOT_SAFE_TO_RECLAIM");
    return;
  }
  const acquiredAt = nowIso();
  const expiresAt = new Date(Date.now() + runtimePolicy.leaseMinutes * 60_000).toISOString();
  const body = leaseBodyHeld({
    workerId,
    taskId: plan.task?.id ?? "UNKNOWN",
    baseHead: plan.currentHead,
    acquiredAt,
    expiresAt,
    heartbeatAt: acquiredAt,
  });
  await github("/issues/" + runtimePolicy.leaseIssueNumber, { method: "PATCH", body: { body } });
  await ghOutput("claimed", "true");
  await ghOutput("claim_reason", expired ? "RECLAIMED_EXPIRED_LEASE" : "CLAIMED_AVAILABLE_LEASE");
}

async function release() {
  const workerId = process.env.WORKER_ID;
  const issue = await github("/issues/" + runtimePolicy.leaseIssueNumber);
  const lease = parseLease(issue.body);
  if (lease.state !== "HELD") return;
  if (lease.workerId !== workerId) {
    throw new Error("LEASE_OWNED_BY_DIFFERENT_WORKER:" + String(lease.workerId));
  }
  const body = leaseBodyAvailable({
    completedTask: process.env.TASK_ID,
    completedHead: process.env.COMPLETED_HEAD,
    outcome: process.env.OUTCOME,
  });
  await github("/issues/" + runtimePolicy.leaseIssueNumber, { method: "PATCH", body: { body } });
}

async function buildPrompt() {
  const plan = JSON.parse(await readFile(process.env.CONTINUOUS_AGENT_PLAN ?? "continuous-agent-plan.json", "utf8"));
  if (!plan.task) throw new Error("PROMPT_TASK_REQUIRED");
  const contract = await readFile("ops/continuity/EXTERNAL_AGENT_CONTRACT.md", "utf8");
  const failureLines = Object.entries(plan.ci)
    .filter(([, value]) => value.status === "completed" && value.conclusion !== "success")
    .map(([name, value]) => "- " + name + ": " + value.conclusion + " " + (value.url ?? ""));
  const lines = [
    "# Regulatory autonomous coding task",
    "",
    "You are a bounded coding worker. You modify the checked-out repository only. You MUST NOT commit, push, create branches, change GitHub settings, alter secrets, or expand your own permissions.",
    "",
    "Mandatory first action: read 00_START_HERE.md and follow its required reading order for every document relevant to this task.",
    "",
    "Repository: " + plan.repository,
    "Canonical branch: " + plan.canonicalBranch,
    "Workspace base HEAD: " + plan.currentHead,
    "Task ID: " + plan.task.id,
    "Attempt: " + plan.attempt,
    "Mode: " + plan.mode,
    "",
    "## Goal",
    plan.task.goal,
    "",
    "## Allowed path prefixes",
    ...plan.task.allowedPathPrefixes.map((value) => "- " + value),
    "",
    "## Task-specific forbidden path prefixes",
    ...(plan.task.forbiddenPathPrefixes ?? []).map((value) => "- " + value),
    "",
    "## Required behavior",
    "- Reuse existing architecture, repositories, APIs, types and Atomic Design components before creating anything.",
    "- Keep the change bounded to this task. Do not start the next roadmap slice.",
    "- Preserve all existing public behavior and compatibility unless the task explicitly requires an additive extension.",
    "- Add or extend tests for the behavior you change.",
    "- Update the relevant project state documents only when they are in the allowed paths.",
    "- Do not weaken or delete tests to obtain green CI.",
    "- If you encounter an external blocker or a human/legal/compliance decision, STOP safely and explain it in your final message instead of inventing a workaround.",
    "",
    "## Non-negotiable invariants",
    "- main only; do not create or switch branches.",
    "- ready_for_submission must remain false.",
    "- no automatic regulatory activation.",
    "- no automatic Legal, Compliance, Tax, Risk or Product approval.",
    "- no CLAUSE_ACTIVATE grant or activation route.",
    "- no force push or history rewrite.",
    "- no credential or secret files.",
    "- do not modify the continuous-agent runtime or its policy.",
    "",
    "## Validation expected",
    ...(plan.task.validationHints ?? []).map((value) => "- " + value),
    "",
    plan.mode === "REPAIR" ? "## Failed gates to reproduce and repair" : "",
    ...failureLines,
    "",
    "## External agent contract",
    contract,
    "",
    "Finish with a concise account of files changed, tests run, unresolved limitations, and why the change is non-regressive.",
  ];
  const output = process.env.PROMPT_OUTPUT ?? "continuous-agent-task.md";
  await writeFile(output, lines.join("\n") + "\n", "utf8");
}

function git(args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

async function gate() {
  const plan = JSON.parse(await readFile(process.env.CONTINUOUS_AGENT_PLAN ?? "continuous-agent-plan.json", "utf8"));
  if (!plan.task) throw new Error("GATE_TASK_REQUIRED");
  const baseHead = process.env.BASE_HEAD ?? plan.currentHead;
  const managedPaths = new Set(["ops/agent-runtime/STATE.json"]);
  const tracked = git(["diff", "--name-only", baseHead, "--"]).split("\n").filter(Boolean);
  const untracked = git(["ls-files", "--others", "--exclude-standard"]).split("\n").filter(Boolean);
  const changed = [...new Set([...tracked, ...untracked])].sort();
  if (changed.length === 0) throw new Error("CONTINUOUS_AGENT_NO_MATERIAL_DIFF");
  if (changed.length > runtimePolicy.budgets.maxChangedFilesPerTask) {
    throw new Error("CONTINUOUS_AGENT_CHANGED_FILE_BUDGET_EXCEEDED:" + changed.length);
  }

  const forbiddenPatterns = [
    ...(runtimePolicy.globalForbiddenPathPatterns ?? []),
    ...(plan.task.forbiddenPathPrefixes ?? []).map((prefix) => "^" + escapeRegex(prefix)),
  ].map((value) => new RegExp(value));
  const allowedPrefixes = plan.task.allowedPathPrefixes ?? [];

  for (const path of changed) {
    if (managedPaths.has(path)) continue;
    if (forbiddenPatterns.some((pattern) => pattern.test(path))) {
      throw new Error("CONTINUOUS_AGENT_FORBIDDEN_PATH:" + path);
    }
    if (!allowedPrefixes.some((prefix) => path === prefix || path.startsWith(prefix))) {
      throw new Error("CONTINUOUS_AGENT_PATH_OUTSIDE_TASK_SCOPE:" + path);
    }
  }

  const deleted = git(["diff", "--diff-filter=D", "--name-only", baseHead, "--"]).split("\n").filter(Boolean);
  for (const path of deleted) {
    if ((runtimePolicy.protectedDeletionPaths ?? []).some((protectedPath) => path === protectedPath || path.startsWith(protectedPath))) {
      throw new Error("CONTINUOUS_AGENT_PROTECTED_DELETION:" + path);
    }
  }

  const numstat = git(["diff", "--numstat", baseHead, "--"]).split("\n").filter(Boolean);
  let changedLines = 0;
  for (const line of numstat) {
    const [added, removed] = line.split("\t");
    changedLines += (Number(added) || 0) + (Number(removed) || 0);
  }
  if (changedLines > runtimePolicy.budgets.maxChangedLinesPerTask) {
    throw new Error("CONTINUOUS_AGENT_CHANGED_LINE_BUDGET_EXCEEDED:" + changedLines);
  }

  const diff = git(["diff", "--unified=0", baseHead, "--"]);
  const addedLines = diff
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
    .map((line) => line.slice(1));
  for (const rawPattern of runtimePolicy.forbiddenAddedLinePatterns ?? []) {
    const pattern = new RegExp(rawPattern, "i");
    const match = addedLines.find((line) => pattern.test(line));
    if (match) throw new Error("CONTINUOUS_AGENT_FORBIDDEN_CONTENT:" + rawPattern + ":" + match.slice(0, 300));
  }

  const report = {
    schemaVersion: "REGULATORY_CONTINUOUS_AGENT_GATE_V1",
    generatedAt: nowIso(),
    taskId: plan.task.id,
    baseHead,
    changedFiles: changed,
    changedFileCount: changed.length,
    changedLines,
    result: "PASS",
  };
  await writeJson("continuous-agent-gate-report.json", report);
  console.log(JSON.stringify(report, null, 2));
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^$()|[\]{}\\]/g, "\\$&");
}

async function markAwaiting() {
  const plan = JSON.parse(await readFile(process.env.CONTINUOUS_AGENT_PLAN ?? "continuous-agent-plan.json", "utf8"));
  if (!plan.task) throw new Error("MARK_AWAITING_TASK_REQUIRED");
  const today = nowIso().slice(0, 10);
  const daily = state.dailyBudget?.date === today ? state.dailyBudget : { date: today, agentRuns: 0, commits: 0 };
  state.activeTask = {
    taskId: plan.task.id,
    status: "AWAITING_CI",
    attempt: plan.attempt,
    baseHead: plan.currentHead,
    startedAt: state.activeTask?.taskId === plan.task.id ? state.activeTask.startedAt : nowIso(),
    updatedAt: nowIso(),
  };
  state.dailyBudget = {
    date: today,
    agentRuns: daily.agentRuns + 1,
    commits: daily.commits + 1,
  };
  state.lastRuntimeAction = {
    at: nowIso(),
    action: plan.mode === "SESSION_REPAIR_REQUIRED" ? "SESSION_REPAIR_COMMIT_PREPARED" : "SESSION_CODE_COMMIT_PREPARED",
    taskId: plan.task.id,
  };
  await writeJson("ops/agent-runtime/STATE.json", state);
}

async function reconcile() {
  const plan = JSON.parse(await readFile(process.env.CONTINUOUS_AGENT_PLAN ?? "continuous-agent-plan.json", "utf8"));
  if (!plan.task) throw new Error("RECONCILE_TASK_REQUIRED");
  const task = plan.task;
  const completed = new Set(state.completedTaskIds ?? []);
  completed.add(task.id);
  state.completedTaskIds = [...completed];
  state.activeTask = null;
  state.lastValidatedHead = plan.materialHead;
  state.lastRuntimeAction = { at: nowIso(), action: "TASK_RECONCILED", taskId: task.id };

  const next = queue.tasks
    .filter((candidate) => candidate.enabled !== false)
    .sort((a, b) => a.sequence - b.sequence)
    .find((candidate) => !completed.has(candidate.id)) ?? null;

  checkpoint.sourceHead = plan.materialHead;
  checkpoint.recordedAt = nowIso();
  checkpoint.lastCompletedSlice = task.completionSlice;
  checkpoint.validationState = {
    regulatoryCI: "PASS",
    runtimeQualityCI: "PASS",
    securityAndReviewPolicyCI: "PASS",
    browserAndAccessibilityCI: "PASS",
  };
  checkpoint.nextSlice = next ? next.completionSlice : "SAFE_AUTONOMOUS_QUEUE_EMPTY";
  checkpoint.nextAuthorizedAction = next ? next.goal : "No further autonomous task is queued. Preserve state and wait for an explicitly governed task.";
  checkpoint.runtime = {
    status: next ? "SESSION_DRIVEN_ACTIVE" : "IDLE_SAFE_QUEUE_EMPTY",
    executionMode: "CHATGPT_SUBSCRIPTION_SESSION",
    workflow: ".github/workflows/continuous-agent-runtime.yml",
    taskQueue: "ops/agent-runtime/TASK_QUEUE.json",
    state: "ops/agent-runtime/STATE.json",
    leaseIssue: runtimePolicy.leaseIssueNumber,
    lastReconciledTask: task.id,
  };

  await Promise.all([
    writeJson("ops/agent-runtime/STATE.json", state),
    writeJson("ops/continuity/CHECKPOINT.json", checkpoint),
  ]);
}

if (command === "plan") await plan();
else if (command === "claim") await claim();
else if (command === "release") await release();
else if (command === "prompt") await buildPrompt();
else if (command === "gate") await gate();
else if (command === "mark-awaiting") await markAwaiting();
else if (command === "reconcile") await reconcile();
else throw new Error("UNKNOWN_CONTINUOUS_AGENT_COMMAND:" + command);
