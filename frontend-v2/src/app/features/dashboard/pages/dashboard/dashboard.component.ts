import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { MsPipe, StatusTonePipe, TonePipe } from '../../../../core/utils/format';
import { Agent, RunSummary, SecurityFinding } from '../../../benchmark/models/benchmark.models';
import { BenchmarkApiService } from '../../../benchmark/services/benchmark-api.service';
import { BriefSummary } from '../../../briefing/models/briefing.models';
import { BriefingApiService } from '../../../briefing/services/briefing-api.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe, MsPipe, StatusTonePipe, TonePipe],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent {
  private readonly bench = inject(BenchmarkApiService);
  private readonly briefing = inject(BriefingApiService);

  readonly loading = signal(true);
  readonly offline = signal(false);
  readonly agents = signal<Agent[]>([]);
  readonly runs = signal<RunSummary[]>([]);
  readonly findings = signal<SecurityFinding[]>([]);
  readonly briefs = signal<BriefSummary[]>([]);

  readonly metrics = computed(() => {
    const runs = this.runs();
    const findings = this.findings();
    return [
      { label: 'Registered agents', value: this.agents().length, detail: 'Available for benchmarking' },
      { label: 'Benchmark runs', value: runs.length, detail: `${runs.filter(r => r.status === 'COMPLETED').length} completed · ${runs.filter(r => r.status === 'RUNNING' || r.status === 'QUEUED').length} active` },
      { label: 'Security findings', value: findings.length, detail: `${findings.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH').length} critical or high` },
      { label: 'Policy violations', value: findings.reduce((total, finding) => total + (finding.violations?.length ?? 0), 0), detail: 'Observed during simulated tool use' },
      { label: 'Generated briefs', value: this.briefs().length, detail: 'Every claim is sourced' }
    ];
  });

  constructor() {
    forkJoin({
      agents: this.bench.loadAgents().pipe(catchError(() => of(null))),
      runs: this.bench.getRuns().pipe(catchError(() => of(null))),
      findings: this.bench.getFindings().pipe(catchError(() => of(null))),
      briefs: this.briefing.getBriefHistory().pipe(catchError(() => of(null)))
    }).subscribe(r => {
      this.offline.set(!r.agents && !r.runs && !r.findings && !r.briefs);
      this.agents.set(r.agents ?? []);
      this.runs.set(r.runs ?? []);
      this.findings.set(r.findings ?? []);
      this.briefs.set(r.briefs ?? []);
      this.loading.set(false);
    });
  }
}
