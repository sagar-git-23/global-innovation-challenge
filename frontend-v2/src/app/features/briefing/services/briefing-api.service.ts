import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  BriefStatusResponse, BriefSummary, CreateBriefRequest, CreateBriefResponse, MeetingBrief, UploadedDocument
} from '../models/briefing.models';

@Injectable({ providedIn: 'root' })
export class BriefingApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';

  createBrief(request: CreateBriefRequest): Observable<CreateBriefResponse> {
    return this.http.post<CreateBriefResponse>(`${this.base}/briefs`, request);
  }

  getBriefStatus(briefId: string): Observable<BriefStatusResponse> {
    return this.http.get<BriefStatusResponse>(`${this.base}/briefs/${encodeURIComponent(briefId)}/status`);
  }

  getBrief(briefId: string): Observable<MeetingBrief> {
    return this.http.get<MeetingBrief>(`${this.base}/briefs/${encodeURIComponent(briefId)}`);
  }

  getBriefHistory(): Observable<BriefSummary[]> {
    return this.http.get<BriefSummary[]>(`${this.base}/briefs`);
  }

  listDocuments(): Observable<UploadedDocument[]> {
    return this.http.get<UploadedDocument[]>(`${this.base}/documents`);
  }

  uploadDocument(file: File): Observable<UploadedDocument> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<UploadedDocument>(`${this.base}/documents`, form);
  }

  deleteDocument(documentId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/documents/${encodeURIComponent(documentId)}`);
  }

  documentDownloadUrl(documentId: string): string {
    return `${this.base}/documents/${encodeURIComponent(documentId)}/download`;
  }
}
