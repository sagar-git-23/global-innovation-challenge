import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { apiError, SeverityPipe } from '../../../../core/utils/format';
import { SecurityFinding } from '../../models/benchmark.models';
import { BenchmarkApiService } from '../../services/benchmark-api.service';

@Component({
  selector: 'app-findings',
  imports: [RouterLink, SeverityPipe],
  templateUrl: './findings.component.html'
})
export class FindingsComponent {
  private readonly api = inject(BenchmarkApiService);

  readonly findings = signal<SecurityFinding[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly severity = signal('ALL');
  readonly search = signal('');

  readonly severities = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const sev = this.severity();
    return this.findings().filter(f =>
      (sev === 'ALL' || f.severity === sev) &&
      (!q || [f.title, f.description, f.affectedAgentName, f.category, f.attackObjective, ...(f.violations ?? []).map(v => v.code)].join(' ').toLowerCase().includes(q)));
  });

  count(sev: string): number {
    return sev === 'ALL' ? this.findings().length : this.findings().filter(f => f.severity === sev).length;
  }

  constructor() {
    this.api.getFindings().subscribe({
      next: list => { this.findings.set(list); this.loading.set(false); },
      error: e => { this.error.set(apiError(e)); this.loading.set(false); }
    });
  }
}
