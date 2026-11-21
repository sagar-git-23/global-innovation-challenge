// Field names mirror the FastAPI backend (benchmarking.py) exactly.

export type RunStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type FindingSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type AgentAdapter = 'http' | 'openai-chat';

export interface Agent {
  id: string;
  name: string;
  type: string;
  framework: string;
  version: string;
  endpoint: string;
  description: string;
  timeoutSeconds: number;
  inputCostPer1M: number | null;
  outputCostPer1M: number | null;
  adapter: AgentAdapter;
  model: string | null;
  authEnvVar: string | null;
  status: string;
  createdAt: string;
}

export interface CreateAgentRequest {
  name: string;
  type: string;
  framework: string;
  version: string;
  endpoint: string;
  description: string;
  timeoutSeconds: number;
  inputCostPer1M: number | null;
  outputCostPer1M: number | null;
  adapter: AgentAdapter;
  model: string | null;
  authEnvVar: string | null;
}

export interface TaskSuite {
  id: string;
  name: string;
  description: string;
  version: string;
  totalTasks: number;
  functionalTaskCount: number;
  securityTaskCount: number;
  estimatedDurationMinutes: number;
  usesTools: boolean;
}

export interface ToolSpec {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
}

export interface StartRunRequest {
  agentIds: string[];
  taskSuiteId: string;
  runsPerTask: number;
  timeoutSeconds: number;
  captureEvidence: boolean;
}

export interface StartRunResponse {
  runs: { id: string; agentId: string; status: RunStatus }[];
  id: string;
  status: RunStatus;
}

export interface RunSummary {
  id: string;
  agentId: string;
  agentName: string;
  framework: string;
  agentVersion: string;
  suiteId: string;
  suiteName: string;
  suiteVersion: string;
  status: RunStatus;
  overallScore: number;
  scoreMethod: string;
  functionalScore: number;
  securityScore: number;
  qualityScore: number | null;
  safetyScore: number | null;
  judgeCoveragePct: number;
  requestSuccessRate: number;
  errorRate: number;
  timeoutRate: number;
  averageLatencyMs: number;
  medianLatencyMs: number;
  p95LatencyMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  tokenCoveragePct: number;
  costUsd: number | null;
  costCoveragePct: number;
  judgeTokens: number | null;
  judgeEnabled: boolean;
  runsCompleted: number;
  attemptsCompleted: number;
  createdAt: string;
  completedAt: string | null;
  error: string | null;
  totalAttempts: number;
  progressPercentage: number;
  passAllRate: number;
  passAnyRate: number;
  consistencyScore: number | null;
  toolCallCount: number;
  averageToolCalls: number | null;
  averageSteps: number | null;
  violationCount: number;
  tasksWithViolations: number;
  costPerSuccessUsd: number | null;
  rank?: number;
}

export interface CheckRule { rule: string; passed: boolean; }

export interface TaskResult {
  taskId: string;
  category: 'FUNCTIONAL' | 'SECURITY' | string;
  attempt: number;
  passed: boolean;
  latencyMs: number;
  response: string;
  evidence: unknown;
  checks: { rules: CheckRule[] } | null;
  error: string | null;
  requestOk: boolean;
  timedOut: boolean;
  inputTokens: number | null;
  outputTokens: number | null;
  costUsd: number | null;
  qualityScore: number | null;
  safetyScore: number | null;
  judgeFeedback: string | null;
  judgeError: string | null;
  judgeTokens: number;
  toolCalls: ToolCall[];
  violations: PolicyViolation[];
  stepCount: number | null;
  toolCallCount: number;
}

export interface ToolCall {
  seq?: number;
  tool: string;
  arguments?: Record<string, unknown>;
  result?: unknown;
  source?: string;
}

export interface PolicyViolation {
  code: string;
  tool?: string;
  detail: string;
  seq?: number;
}

export interface RunDetails extends RunSummary {
  results: TaskResult[];
}

export interface LeaderboardEntry extends RunSummary {
  rank: number;
}

export interface SecurityFinding {
  id: string;
  runId: string;
  affectedAgentName: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  category: string;
  status: string;
  evidence: string;
  safetyScore: number | null;
  checks: { rules: CheckRule[] } | null;
  taskId?: string;
  attempt?: number;
  attackObjective?: string | null;
  impact?: string | null;
  violations?: PolicyViolation[];
  toolCalls?: ToolCall[];
  remediation?: string[];
  discoveredAt?: string;
  attackPath?: { nodes: AttackPathNode[]; edges: { source: string; target: string }[] };
}

export interface AttackPathNode {
  id: string;
  label: string;
  description: string;
  type: string;
  status: string;
  sequence: number;
}
