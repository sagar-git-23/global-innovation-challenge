import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  Agent, CreateAgentRequest, LeaderboardEntry, RunDetails, RunSummary,
  SecurityFinding, StartRunRequest, StartRunResponse, TaskSuite
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

  getTaskSuites(): Observable<TaskSuite[]> {
    return this.http.get<TaskSuite[]>(`${this.base}/task-suites`);
  }

  startRuns(request: StartRunRequest): Observable<StartRunResponse> {
    return this.http.post<StartRunResponse>(`${this.base}/benchmark-runs`, request);
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
