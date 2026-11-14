import { Component, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  template: `<div class="shell" [attr.data-theme]="theme">
    <aside class="rail" [class.bifrost-rail]="isBifrost">
      <a class="brand" [routerLink]="isBifrost ? '/benchmark/overview' : '/briefing/create'">
        <span class="brand-icon">{{isBifrost ? 'B' : 'b.'}}</span>
        <span>{{isBifrost ? 'Bifrost Bench' : 'briefly'}}<small>{{isBifrost ? 'AGENT EVALUATION' : 'TAVILY MEETING BRIEFS'}}</small></span>
      </a>

      <div class="switch-label">WORKSPACE</div>
      <div class="workspace-switch" role="group" aria-label="Select workspace">
        <button type="button" [class.selected]="!isBifrost" (click)="openBriefly()" aria-label="Open Briefly meeting intelligence workspace"><span class="switch-icon">✳</span><span>Briefly</span></button>
        <button type="button" [class.selected]="isBifrost" (click)="openBifrost()" aria-label="Open Bifrost agent benchmarking workspace"><span class="switch-icon">◫</span><span>Bifrost</span></button>
      </div>

      <ng-container *ngIf="!isBifrost; else bifrostNav">
        <div class="rail-label">TAVILY · MEETING INTELLIGENCE</div>
        <a routerLink="/briefing/create" routerLinkActive="active"><i>✳</i> New brief</a>
        <a routerLink="/briefing/history" routerLinkActive="active"><i>◷</i> Brief history</a>
        <div class="rail-bottom"><span class="live-dot"></span> Tavily research <b>LIVE</b><small>Fresh sources for every brief</small></div>
      </ng-container>
      <ng-template #bifrostNav>
        <div class="rail-label">BIFROST · AGENT BENCHMARKING</div>
        <a routerLink="/benchmark/overview" routerLinkActive="active"><i>◫</i> Overview</a>
        <a routerLink="/benchmark/agents" routerLinkActive="active"><i>♙</i> Agent registry</a>
        <a routerLink="/benchmark/runs/new" routerLinkActive="active"><i>＋</i> New benchmark</a>
        <a routerLink="/benchmark/leaderboard" routerLinkActive="active"><i>↗</i> Leaderboard</a>
        <a routerLink="/benchmark/findings" routerLinkActive="active"><i>⌁</i> Findings & evidence</a>
        <div class="rail-bottom"><span class="bifrost-dot"></span> Agent evaluation <b>READY</b><small>Comparable runs across agent frameworks</small></div>
      </ng-template>
    </aside>

    <main class="main"><header class="topbar"><div><span class="crumb">{{workspaceName}}</span><span class="slash">/</span><strong>{{title}}</strong></div><div class="top-actions"><div class="avatar">GR</div><button type="button" class="theme-toggle" (click)="toggleTheme()" [attr.aria-label]="theme==='dark'?'Switch to light theme':'Switch to dark theme'"><span>{{theme==='dark'?'☼':'☾'}}</span>{{theme==='dark'?'Light':'Dark'}}</button></div></header><router-outlet></router-outlet></main>
  </div>`,
  styles: [`.shell{min-height:100vh;display:flex}.rail{position:fixed;inset:0 auto 0 0;width:252px;padding:25px 18px;background:#0b0f19;border-right:1px solid #202532;color:#a6afc0;display:flex;flex-direction:column;overflow:auto;z-index:5}.rail.bifrost-rail{background:#0a1119;border-right-color:#1e3340}.brand{display:flex;gap:11px;align-items:center;color:#fff;text-decoration:none;font-size:17px;font-weight:750;margin:2px 10px 27px}.brand-icon{display:grid;place-items:center;width:38px;height:38px;border-radius:11px;background:linear-gradient(135deg,#a78bfa,#ec4899);color:#fff;font-size:22px}.bifrost-rail .brand-icon{background:linear-gradient(135deg,#44d5d1,#70a9ff);color:#07151c}.brand small{display:block;color:#778093;font-size:7px;letter-spacing:1px;margin-top:4px}.switch-label{font-size:8px;letter-spacing:1.3px;color:#687386;margin:0 10px 8px;font-weight:700}.workspace-switch{display:grid;grid-template-columns:1fr 1fr;gap:5px;padding:4px;border:1px solid #2a3040;background:#0a0e16;border-radius:9px;margin-bottom:25px}.workspace-switch button{display:flex;align-items:center;justify-content:center;gap:7px;padding:9px 5px;color:#858fa0;background:transparent;border:1px solid transparent;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer}.workspace-switch button.selected{background:#211a35;border-color:#43365d;color:#e3d6ff}.bifrost-rail .workspace-switch button.selected{background:#142d35;border-color:#28555a;color:#aaf2ed}.switch-icon{font-size:13px}.rail-label{font-size:8px;line-height:1.5;letter-spacing:1px;color:#596273;margin:0 11px 9px;font-weight:750}.rail>a:not(.brand){text-decoration:none;color:#a2adbd;padding:10px 12px;border-radius:8px;font-size:12px;margin:2px 0;white-space:nowrap}.rail>a.active,.rail>a:not(.brand):hover{background:#191f2b;color:white}.rail i{font-style:normal;display:inline-block;width:25px;color:#a78bfa;font-size:15px}.bifrost-rail i{color:#59d8ce}.rail-bottom{margin-top:auto;border:1px solid #262d3a;border-radius:11px;padding:12px;font-size:10px;color:#c3ccda;line-height:1.4}.rail-bottom small{display:block;color:#778093;margin:8px 0 0 14px;font-size:9px}.rail-bottom b{float:right;color:#4ade80;font-size:8px;letter-spacing:1px}.live-dot,.bifrost-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#4ade80;margin-right:7px}.bifrost-dot{background:#4dd6cc}.rail-bottom b{color:#8ce8df}.main{margin-left:252px;min-width:0;flex:1}.topbar{height:66px;border-bottom:1px solid #202532;display:flex;align-items:center;justify-content:space-between;padding:0 38px;color:#9ba5b5;font-size:12px}.topbar strong{color:#eff2f8;font-weight:550}.crumb{font-size:9px;letter-spacing:1.1px;color:#687284}.slash{margin:0 11px;color:#434c5b}.avatar{background:#25243a;border:1px solid #393451;color:#cab8ff;font-size:10px;border-radius:50%;width:30px;height:30px;display:grid;place-items:center}@media(max-width:720px){.rail{width:72px;padding:18px 7px}.brand{margin:0 auto 22px}.brand>span:last-child,.switch-label,.workspace-switch button>span:last-child,.rail-label,.rail>a:not(.brand){font-size:0}.workspace-switch{grid-template-columns:1fr;padding:3px;margin-bottom:18px}.workspace-switch button{min-height:34px}.switch-icon{font-size:15px!important}.rail>a:not(.brand){text-align:center;padding:13px 0}.rail i{font-size:18px}.rail-bottom{display:none}.main{margin-left:72px}.topbar{padding:0 18px}}`]
})
export class AppComponent implements OnDestroy {
  title = 'New brief';
  isBifrost = false;
  theme: 'dark' | 'light' = 'dark';
  private routeSub: Subscription;

  constructor(private router: Router) {
    try { this.theme = localStorage.getItem('briefly-theme') === 'light' ? 'light' : 'dark'; } catch { this.theme = 'dark'; }
    this.updateRoute(router.url);
    this.routeSub = router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => this.updateRoute(event.urlAfterRedirects));
  }

  get workspaceName(): string { return this.isBifrost ? 'Bifrost Bench' : 'Briefly · Tavily'; }

  openBriefly(): void { if (this.isBifrost) this.router.navigateByUrl('/briefing/create'); }
  openBifrost(): void { if (!this.isBifrost) this.router.navigateByUrl('/benchmark/overview'); }
  toggleTheme(): void {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('briefly-theme', this.theme); } catch { /* Theme still applies for this session. */ }
  }

  private updateRoute(path: string): void {
    this.isBifrost = path.startsWith('/benchmark');
    this.title = path.includes('/benchmark/agents') ? 'Agent registry'
      : path.includes('/benchmark/runs') ? 'New benchmark'
      : path.includes('/benchmark/leaderboard') ? 'Leaderboard'
      : path.includes('/benchmark/findings') ? 'Findings & evidence'
      : path.includes('/benchmark') ? 'Overview'
      : path.includes('/briefing/history') ? 'Brief history'
      : path.includes('/briefing/') && !path.includes('/create') ? 'Meeting brief'
      : 'New brief';
  }

  ngOnDestroy(): void { this.routeSub.unsubscribe(); }
}
