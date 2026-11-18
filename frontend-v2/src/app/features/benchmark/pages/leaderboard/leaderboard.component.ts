import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { apiError, DashPipe, MsPipe, TonePipe, UsdPipe } from '../../../../core/utils/format';
import { LeaderboardEntry } from '../../models/benchmark.models';
import { BenchmarkApiService } from '../../services/benchmark-api.service';

type SortKey = 'overallScore' | 'functionalScore' | 'securityScore' | 'qualityScore' | 'safetyScore'
  | 'requestSuccessRate' | 'averageLatencyMs' | 'costUsd';

@Component({
  selector: 'app-leaderboard',
  imports: [RouterLink, DashPipe, MsPipe, TonePipe, UsdPipe],
  templateUrl: './leaderboard.component.html'
})
export class LeaderboardComponent {
  private readonly api = inject(BenchmarkApiService);

  readonly entries = signal<LeaderboardEntry[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly suiteKey = signal('');
  readonly sortKey = signal<SortKey>('overallScore');

  readonly sortOptions: { value: SortKey; label: string }[] = [
    { value: 'overallScore', label: 'Overall score' },
    { value: 'functionalScore', label: 'Functional' },
    { value: 'securityScore', label: 'Security' },
    { value: 'qualityScore', label: 'Quality' },
    { value: 'safetyScore', label: 'Safety' },
    { value: 'requestSuccessRate', label: 'Reliability' },
    { value: 'averageLatencyMs', label: 'Latency (lowest first)' },
    { value: 'costUsd', label: 'Cost (lowest first)' }
  ];

  readonly suites = computed(() => {
    const map = new Map<string, string>();
    for (const e of this.entries()) map.set(`${e.suiteId}|${e.suiteVersion}`, `${e.suiteName} v${e.suiteVersion}`);
    return [...map].map(([key, label]) => ({ key, label }));
  });

  readonly rows = computed(() => {
    const key = this.suiteKey() || this.suites()[0]?.key;
    const sort = this.sortKey();
    const ascending = sort === 'averageLatencyMs' || sort === 'costUsd';
    const missing = ascending ? Infinity : -Infinity;
    return this.entries()
      .filter(e => `${e.suiteId}|${e.suiteVersion}` === key)
      .sort((a, b) => {
        const av = (a[sort] as number | null) ?? missing;
        const bv = (b[sort] as number | null) ?? missing;
        return ascending ? av - bv : bv - av;
      });
  });

  readonly activeKey = computed(() => this.suiteKey() || this.suites()[0]?.key || '');

  constructor() {
    this.api.getLeaderboard().subscribe({
      next: list => { this.entries.set(list); this.loading.set(false); },
      error: e => { this.error.set(apiError(e)); this.loading.set(false); }
    });
  }
}
