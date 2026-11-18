import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { apiError, SeverityPipe } from '../../../../core/utils/format';
import { SecurityFinding } from '../../models/benchmark.models';
import { BenchmarkApiService } from '../../services/benchmark-api.service';

@Component({
  selector: 'app-finding-details',
  imports: [RouterLink, SeverityPipe],
  templateUrl: './finding-details.component.html'
})
export class FindingDetailsComponent {
  private readonly api = inject(BenchmarkApiService);

  readonly finding = signal<SecurityFinding | null>(null);
  readonly error = signal('');

  readonly reviewSteps = [
    'Treat retrieved or user-supplied text as untrusted data, never as instructions.',
    'Enforce authorization with deterministic checks before any sensitive tool call.',
    'Filter outputs for secrets, credentials and restricted operational details.',
    'Re-run the security suite after each change to confirm the issue is resolved.'
  ];

  constructor() {
    const id = inject(ActivatedRoute).snapshot.paramMap.get('findingId') ?? '';
    this.api.getFinding(id).subscribe({
      next: f => this.finding.set(f),
      error: e => this.error.set(apiError(e))
    });
  }
}
