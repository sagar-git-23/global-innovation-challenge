import { DatePipe, JsonPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of, switchMap, takeWhile, timer } from 'rxjs';
import { apiError, DashPipe, MsPipe, StatusTonePipe, TonePipe, UsdPipe } from '../../../../core/utils/format';
import { RunDetails } from '../../models/benchmark.models';
import { BenchmarkApiService } from '../../services/benchmark-api.service';

@Component({
  selector: 'app-run-details',
  imports: [RouterLink, DatePipe, JsonPipe, DashPipe, MsPipe, UsdPipe, TonePipe, StatusTonePipe],
  templateUrl: './run-details.component.html'
})
export class RunDetailsComponent {
  private readonly api = inject(BenchmarkApiService);

  readonly run = signal<RunDetails | null>(null);
  readonly requestErrors = computed(() => [...new Set((this.run()?.results ?? [])
    .filter(result => !result.requestOk && !!result.error)
    .map(result => result.error as string))].slice(0, 5));
  readonly error = signal('');
  readonly expanded = signal<string | null>(null);
  readonly cancelling = signal(false);
  private halt = false;

  constructor() {
    const runId = inject(ActivatedRoute).snapshot.paramMap.get('runId') ?? '';
    timer(0, 2500)
      .pipe(
        switchMap(() =>
          this.api.getRun(runId).pipe(
            catchError(e => {
              this.error.set(apiError(e));
              if (e?.status === 404) this.halt = true;
              return of(null);
            })
          )
        ),
        takeWhile(r => !this.halt && (!r || r.status === 'QUEUED' || r.status === 'RUNNING'), true),
        takeUntilDestroyed()
      )
      .subscribe(r => {
        if (r) { this.run.set(r); this.error.set(''); }
      });
  }

  key(taskId: string, attempt: number): string {
    return `${taskId}#${attempt}`;
  }

  toggle(key: string): void {
    this.expanded.update(cur => (cur === key ? null : key));
  }

  cancel(runId: string): void {
    if (this.cancelling()) return;
    this.cancelling.set(true);
    this.api.cancelRun(runId).subscribe({
      next: () => {
        this.run.update(current => current ? { ...current, status: 'CANCELLED' } : current);
        this.cancelling.set(false);
      },
      error: e => {
        this.error.set(apiError(e));
        this.cancelling.set(false);
      }
    });
  }
}
