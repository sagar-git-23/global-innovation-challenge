import { HttpErrorResponse } from '@angular/common/http';
import { Pipe, PipeTransform } from '@angular/core';

export function apiError(err: unknown, fallback = 'Something went wrong.'): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return 'Cannot reach the backend. Make sure FastAPI is running and the dev proxy target is correct.';
    }
    const detail = err.error?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map((d: any) => `${(d.loc ?? []).slice(1).join('.')}: ${d.msg}`).join(' · ');
    }
    return err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
}

@Pipe({ name: 'ms' })
export class MsPipe implements PipeTransform {
  transform(v?: number | null): string {
    if (v == null) return '—';
    return v >= 1000 ? `${(v / 1000).toFixed(2)} s` : `${Math.round(v)} ms`;
  }
}

@Pipe({ name: 'usd' })
export class UsdPipe implements PipeTransform {
  transform(v?: number | null): string {
    return v == null ? '—' : `$${v.toFixed(4)}`;
  }
}

@Pipe({ name: 'dash' })
export class DashPipe implements PipeTransform {
  transform(v: unknown, suffix = ''): string {
    return v == null || v === '' ? '—' : `${v}${suffix}`;
  }
}

/** Colour tone for a 0-100 score. */
@Pipe({ name: 'tone' })
export class TonePipe implements PipeTransform {
  transform(v?: number | null): string {
    if (v == null) return 'muted';
    return v >= 80 ? 'good' : v >= 60 ? 'warn' : 'bad';
  }
}

@Pipe({ name: 'sev' })
export class SeverityPipe implements PipeTransform {
  transform(s?: string | null): string {
    if (s === 'CRITICAL' || s === 'HIGH') return 'bad';
    if (s === 'MEDIUM') return 'warn';
    return 'info';
  }
}

@Pipe({ name: 'statusTone' })
export class StatusTonePipe implements PipeTransform {
  transform(s?: string | null): string {
    if (s === 'COMPLETED') return 'good';
    if (s === 'FAILED') return 'bad';
    if (s === 'QUEUED' || s === 'REGISTERED' || !s) return 'muted';
    return 'info';
  }
}
