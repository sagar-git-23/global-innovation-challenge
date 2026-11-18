import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap, takeWhile, timer } from 'rxjs';
import { apiError, StatusTonePipe } from '../../../../core/utils/format';
import { BriefClaim, BriefStatusResponse, MeetingBrief } from '../../models/briefing.models';
import { BriefingApiService } from '../../services/briefing-api.service';

@Component({
  selector: 'app-brief-viewer',
  imports: [RouterLink, DatePipe, StatusTonePipe],
  templateUrl: './brief-viewer.component.html'
})
export class BriefViewerComponent {
  private readonly api = inject(BriefingApiService);

  readonly status = signal<BriefStatusResponse | null>(null);
  readonly brief = signal<MeetingBrief | null>(null);
  readonly error = signal('');

  readonly sections = computed<{ title: string; items: BriefClaim[] }[]>(() => {
    const b = this.brief();
    if (!b) return [];
    return [
      { title: 'Executive summary', items: b.executiveSummary ?? [] },
      { title: 'Recent news', items: b.recentNews ?? [] },
      { title: 'Hires and leadership', items: b.hires ?? [] },
      { title: 'Product launches', items: b.launches ?? [] },
      { title: 'Business signals', items: b.businessSignals ?? [] }
    ].filter(s => s.items.length > 0);
  });

  private readonly sourceNumbers = computed(() => {
    const map = new Map<string, number>();
    (this.brief()?.sources ?? []).forEach((s, i) => map.set(s.id, i + 1));
    return map;
  });

  constructor() {
    const briefId = inject(ActivatedRoute).snapshot.paramMap.get('briefId') ?? '';
    timer(0, 2000)
      .pipe(
        switchMap(() => this.api.getBriefStatus(briefId)),
        takeWhile(s => s.status !== 'COMPLETED' && s.status !== 'FAILED', true),
        takeUntilDestroyed()
      )
      .subscribe({
        next: s => {
          this.status.set(s);
          if (s.status === 'COMPLETED') this.loadBrief(briefId);
        },
        error: e => this.error.set(apiError(e))
      });
  }

  private loadBrief(id: string): void {
    this.api.getBrief(id).subscribe({
      next: b => this.brief.set(b),
      error: e => this.error.set(apiError(e))
    });
  }

  num(sourceId: string): number | string {
    return this.sourceNumbers().get(sourceId) ?? '?';
  }

  jump(sourceId: string): void {
    document.getElementById('src-' + sourceId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  isLink(url: string | null | undefined): boolean {
    return !!url && url !== '#' && /^https?:\/\//i.test(url);
  }

  print(): void {
    window.print();
  }
}
