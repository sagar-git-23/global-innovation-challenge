import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  Agent, CreateAgentRequest, LeaderboardEntry, RunDetails, RunSummary,
  SecurityFinding, StartRunRequest, StartRunResponse, TaskSuite, ToolSpec
} from '../models/benchmark.models';

@Injectable({ providedIn: 'root' })
export class BenchmarkApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/benchmark-api';

  loadAgents(): Observable<Agent[]> {
    return this.http.get<Agent[]>(`${this.base}/agents`);
  }

  createAgent(request: CreateAgentRequest): Observable<Agent> {
    return this.http.post<Agent>(`${this.base}/agents`, request);
  }

  testAgent(agentId: string): Observable<AgentTestResult> {
    return this.http.post<AgentTestResult>(`${this.base}/agents/${encodeURIComponent(agentId)}/test`, {});
  }

  getTaskSuites(): Observable<TaskSuite[]> {
    return this.http.get<TaskSuite[]>(`${this.base}/task-suites`);
  }

  getToolSpecs(): Observable<{ tools: ToolSpec[] }> {
    return this.http.get<{ tools: ToolSpec[] }>(`${this.base}/tool-specs`);
  }

  startRuns(request: StartRunRequest): Observable<StartRunResponse> {
    return this.http.post<StartRunResponse>(`${this.base}/benchmark-runs`, request);
  }

  cancelRun(runId: string): Observable<{ id: string; status: 'CANCELLED' }> {
    return this.http.post<{ id: string; status: 'CANCELLED' }>(`${this.base}/benchmark-runs/${encodeURIComponent(runId)}/cancel`, {});
  }

  getRuns(): Observable<RunSummary[]> {
    return this.http.get<RunSummary[]>(`${this.base}/benchmark-runs`);
  }

  getRun(runId: string): Observable<RunDetails> {
    return this.http.get<RunDetails>(`${this.base}/benchmark-runs/${encodeURIComponent(runId)}`);
  }

  getLeaderboard(): Observable<LeaderboardEntry[]> {
    return this.http.get<LeaderboardEntry[]>(`${this.base}/leaderboard`);
  }

  getFindings(): Observable<SecurityFinding[]> {
    return this.http.get<SecurityFinding[]>(`${this.base}/findings`);
  }

  /** The backend has no single-finding endpoint, so it is picked from the list. */
  getFinding(findingId: string): Observable<SecurityFinding> {
    return this.getFindings().pipe(
      map(list => {
        const found = list.find(f => f.id === findingId);
        if (!found) throw new Error('Security finding was not found.');
        return found;
      })
    );
  }
}

export interface AgentTestResult {
  agentId: string;
  reachable: boolean;
  latencyMs: number;
  message: string;
  checkedAt: string;
}
