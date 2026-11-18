import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { catchError, of, switchMap, timer } from 'rxjs';
import { HealthApiService, HealthStatus } from '../../core/services/health-api.service';

interface NavItem { label: string; route: string; icon: string; exact?: boolean; }
interface NavGroup { title: string; items: NavItem[]; }

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  private readonly health = inject(HealthApiService);

  readonly status = signal<HealthStatus | null>(null);
  readonly offline = signal(false);

  readonly groups: NavGroup[] = [
    { title: 'Overview', items: [{ label: 'Dashboard', route: '/dashboard', icon: '▦', exact: true }] },
    {
      title: 'Agent Benchmarking',
      items: [
        { label: 'Agent Registry', route: '/benchmark/agents', icon: '◎' },
        { label: 'New Benchmark', route: '/benchmark/runs/new', icon: '▶' },
        { label: 'Leaderboard', route: '/benchmark/leaderboard', icon: '☰' },
        { label: 'Security Findings', route: '/benchmark/findings', icon: '⚑' }
      ]
    },
    {
      title: 'Meeting Intelligence',
      items: [
        { label: 'Generate Brief', route: '/briefing/create', icon: '✎' },
        { label: 'Brief History', route: '/briefing/history', icon: '⟲' }
      ]
    }
  ];

  constructor() {
    timer(0, 30000)
      .pipe(
        switchMap(() => this.health.check().pipe(catchError(() => of(null)))),
        takeUntilDestroyed()
      )
      .subscribe(s => {
        this.status.set(s);
        this.offline.set(!s);
      });
  }
}
