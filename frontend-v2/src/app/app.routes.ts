import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/app-shell/app-shell.component').then(m => m.AppShellComponent),
    children: [
      { path: 'dashboard', data: { title: 'Dashboard', subtitle: 'Monitor agent quality, security and meeting intelligence.' },
        loadComponent: () => import('./features/dashboard/pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'benchmark/agents', data: { title: 'Agent Registry', subtitle: 'Register agent endpoints and evaluate them with the same task suites.' },
        loadComponent: () => import('./features/benchmark/pages/agent-list/agent-list.component').then(m => m.AgentListComponent) },
      { path: 'benchmark/runs/new', data: { title: 'New Benchmark', subtitle: 'Choose agents and a task suite, then start the evaluation.' },
        loadComponent: () => import('./features/benchmark/pages/new-run/new-run.component').then(m => m.NewRunComponent) },
      { path: 'benchmark/runs/:runId', data: { title: 'Benchmark Results', subtitle: 'Scores, latency, cost and per-task evidence.' },
        loadComponent: () => import('./features/benchmark/pages/run-details/run-details.component').then(m => m.RunDetailsComponent) },
      { path: 'benchmark/leaderboard', data: { title: 'Leaderboard', subtitle: 'Latest completed run per agent and suite version.' },
        loadComponent: () => import('./features/benchmark/pages/leaderboard/leaderboard.component').then(m => m.LeaderboardComponent) },
      { path: 'benchmark/findings', data: { title: 'Security Findings', subtitle: 'Failed security checks and low safety scores.' },
        loadComponent: () => import('./features/benchmark/pages/findings/findings.component').then(m => m.FindingsComponent) },
      { path: 'benchmark/findings/:findingId', data: { title: 'Finding Details', subtitle: 'Evidence and rule outcomes for a single finding.' },
        loadComponent: () => import('./features/benchmark/pages/finding-details/finding-details.component').then(m => m.FindingDetailsComponent) },
      { path: 'briefing/create', data: { title: 'Generate Brief', subtitle: 'Research a company or person before a meeting.' },
        loadComponent: () => import('./features/briefing/pages/create-brief/create-brief.component').then(m => m.CreateBriefComponent) },
      { path: 'briefing/history', data: { title: 'Brief History', subtitle: 'Previously generated meeting briefs.' },
        loadComponent: () => import('./features/briefing/pages/brief-history/brief-history.component').then(m => m.BriefHistoryComponent) },
      { path: 'briefing/:briefId', data: { title: 'Meeting Brief', subtitle: 'Every claim is linked to a source.' },
        loadComponent: () => import('./features/briefing/pages/brief-viewer/brief-viewer.component').then(m => m.BriefViewerComponent) },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
