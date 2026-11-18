import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { apiError, StatusTonePipe } from '../../../../core/utils/format';
import { BriefSummary } from '../../models/briefing.models';
import { BriefingApiService } from '../../services/briefing-api.service';

@Component({
  selector: 'app-brief-history',
  imports: [RouterLink, DatePipe, StatusTonePipe],
  templateUrl: './brief-history.component.html'
})
export class BriefHistoryComponent {
  private readonly api = inject(BriefingApiService);

  readonly briefs = signal<BriefSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  constructor() {
    this.api.getBriefHistory().subscribe({
      next: list => { this.briefs.set(list); this.loading.set(false); },
      error: e => { this.error.set(apiError(e)); this.loading.set(false); }
    });
  }
}
