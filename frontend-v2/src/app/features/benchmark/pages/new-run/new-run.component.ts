import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { apiError } from '../../../../core/utils/format';
import { Agent, StartRunResponse, TaskSuite, ToolSpec } from '../../models/benchmark.models';
import { BenchmarkApiService } from '../../services/benchmark-api.service';

@Component({
  selector: 'app-new-run',
  imports: [RouterLink],
  templateUrl: './new-run.component.html'
})
export class NewRunComponent {
  private readonly api = inject(BenchmarkApiService);
  private readonly route = inject(ActivatedRoute);

  readonly agents = signal<Agent[]>([]);
  readonly suites = signal<TaskSuite[]>([]);
  readonly toolSpecs = signal<ToolSpec[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal('');

  readonly selected = signal<Set<string>>(new Set());
  readonly suiteId = signal('');
  readonly runsPerTask = signal(1);
  readonly timeoutSeconds = signal(60);
  readonly captureEvidence = signal(true);

  readonly starting = signal(false);
  readonly startError = signal('');
  readonly created = signal<StartRunResponse | null>(null);

  readonly suite = computed(() => this.suites().find(s => s.id === this.suiteId()) ?? null);
  readonly totalAttempts = computed(() => (this.suite()?.totalTasks ?? 0) * this.runsPerTask() * this.selected().size);
  readonly canStart = computed(() => this.selected().size > 0 && !!this.suite() && !this.starting());

  constructor() {
    forkJoin({ agents: this.api.loadAgents(), suites: this.api.getTaskSuites(), toolSpecs: this.api.getToolSpecs() }).subscribe({
      next: ({ agents, suites, toolSpecs }) => {
        this.agents.set(agents);
        this.suites.set(suites);
        this.toolSpecs.set(toolSpecs.tools);
        if (suites.length) this.suiteId.set(suites[0].id);
        const preselected = this.route.snapshot.queryParamMap.get('agentId');
        if (preselected && agents.some(a => a.id === preselected)) this.selected.set(new Set([preselected]));
        this.loading.set(false);
      },
      error: e => { this.loadError.set(apiError(e)); this.loading.set(false); }
    });
  }

  toggle(id: string): void {
    const next = new Set(this.selected());
    next.has(id) ? next.delete(id) : next.add(id);
    this.selected.set(next);
  }

  setNumber(target: 'runs' | 'timeout', event: Event): void {
    const n = Number((event.target as HTMLInputElement).value);
    if (target === 'runs') this.runsPerTask.set(Math.min(10, Math.max(1, Math.round(n) || 1)));
    else this.timeoutSeconds.set(Math.min(600, Math.max(5, Math.round(n) || 60)));
  }

  agentName(id: string): string {
    return this.agents().find(a => a.id === id)?.name ?? id;
  }

  start(): void {
    if (!this.canStart()) return;
    this.starting.set(true);
    this.startError.set('');
    this.api.startRuns({
      agentIds: [...this.selected()],
      taskSuiteId: this.suiteId(),
      runsPerTask: this.runsPerTask(),
      timeoutSeconds: this.timeoutSeconds(),
      captureEvidence: this.captureEvidence()
    }).subscribe({
      next: res => { this.created.set(res); this.starting.set(false); },
      error: e => { this.startError.set(apiError(e)); this.starting.set(false); }
    });
  }
}
