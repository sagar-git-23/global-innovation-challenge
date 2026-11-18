import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { apiError } from '../../../../core/utils/format';
import { UploadedDocument } from '../../models/briefing.models';
import { BriefingApiService } from '../../services/briefing-api.service';

function defaultMeetingTime(): string {
  const d = new Date(Date.now() + 24 * 3600 * 1000);
  d.setHours(10, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const splitList = (value: string): string[] =>
  value.split(/[,\n]/).map(v => v.trim()).filter(Boolean).slice(0, 20);

@Component({
  selector: 'app-create-brief',
  imports: [ReactiveFormsModule],
  templateUrl: './create-brief.component.html'
})
export class CreateBriefComponent {
  private readonly api = inject(BriefingApiService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly submitting = signal(false);
  readonly error = signal('');
  readonly documents = signal<UploadedDocument[]>([]);
  readonly selectedDocs = signal<Set<string>>(new Set());
  readonly uploading = signal(false);
  readonly docError = signal('');
  readonly showAdvanced = signal(false);

  readonly depths = ['advanced', 'basic', 'fast', 'ultra-fast'];

  readonly form = this.fb.group({
    subjectType: ['COMPANY' as 'COMPANY' | 'PERSON'],
    subjectName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    meetingTime: [defaultMeetingTime(), Validators.required],
    meetingPurpose: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]],
    lookbackDays: [30, [Validators.required, Validators.min(7), Validators.max(90)]],
    region: ['Global', Validators.maxLength(80)],
    country: ['', Validators.pattern(/^([A-Za-z]{2})?$/)],
    language: ['en', [Validators.required, Validators.minLength(2), Validators.maxLength(5)]],
    searchDepth: ['advanced'],
    includeImages: [false],
    includeDomains: [''],
    excludeDomains: ['']
  });

  constructor() {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.api.listDocuments().subscribe({
      next: docs => this.documents.set(docs),
      error: e => this.docError.set(apiError(e))
    });
  }

  toggleDoc(id: string): void {
    const next = new Set(this.selectedDocs());
    next.has(id) ? next.delete(id) : next.add(id);
    this.selectedDocs.set(next);
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.docError.set('');
    this.api.uploadDocument(file).subscribe({
      next: doc => {
        this.documents.update(list => [doc, ...list]);
        this.toggleDoc(doc.documentId);
        this.uploading.set(false);
        input.value = '';
      },
      error: e => { this.docError.set(apiError(e)); this.uploading.set(false); input.value = ''; }
    });
  }

  removeDoc(id: string): void {
    this.api.deleteDocument(id).subscribe({
      next: () => {
        this.documents.update(list => list.filter(d => d.documentId !== id));
        const next = new Set(this.selectedDocs());
        next.delete(id);
        this.selectedDocs.set(next);
      },
      error: e => this.docError.set(apiError(e))
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    this.submitting.set(true);
    this.error.set('');
    this.api.createBrief({
      subjectType: v.subjectType,
      subjectName: v.subjectName.trim(),
      meetingTime: new Date(v.meetingTime).toISOString(),
      meetingPurpose: v.meetingPurpose.trim(),
      lookbackDays: v.lookbackDays,
      region: v.region.trim() || 'Global',
      country: v.country ? v.country.toUpperCase() : null,
      language: v.language.trim(),
      includeDomains: splitList(v.includeDomains),
      excludeDomains: splitList(v.excludeDomains),
      searchDepth: v.searchDepth as any,
      includeImages: v.includeImages,
      documentIds: [...this.selectedDocs()]
    }).subscribe({
      next: res => this.router.navigate(['/briefing', res.briefId]),
      error: e => { this.error.set(apiError(e)); this.submitting.set(false); }
    });
  }
}
