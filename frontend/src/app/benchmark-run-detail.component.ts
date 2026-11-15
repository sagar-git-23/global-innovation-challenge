import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-benchmark-run-detail',
  template: `<section class="page"><a routerLink="/benchmark/leaderboard" class="back">← Benchmark results</a>
    <div *ngIf="run; else loadingRun"><div class="hero"><div><span class="eyebrow">{{run.suiteName}} · {{run.suiteVersion}}</span><h1>{{run.agentName}}</h1><p>{{run.framework}} · {{run.agentVersion}} · {{run.status}}</p></div><span class="status" [class.complete]="run.status==='COMPLETED'">{{run.status}}</span></div>
    <div class="metrics"><article><small>OVERALL</small><b>{{run.overallScore}}%</b></article><article><small>FUNCTIONAL CHECKS</small><b>{{run.functionalScore}}%</b></article><article><small>SECURITY CHECKS</small><b>{{run.securityScore}}%</b></article><article><small>QUALITY</small><b>{{run.qualityScore===null?'—':run.qualityScore+'%'}}</b></article><article><small>SAFETY</small><b>{{run.safetyScore===null?'—':run.safetyScore+'%'}}</b></article><article><small>RELIABILITY</small><b>{{run.requestSuccessRate}}%</b></article><article><small>MEDIAN LATENCY</small><b>{{run.medianLatencyMs}} ms</b></article><article><small>P95 LATENCY</small><b>{{run.p95LatencyMs}} ms</b></article><article><small>ERROR / TIMEOUT</small><b>{{run.errorRate}}% / {{run.timeoutRate}}%</b></article><article><small>TOKENS (IN / OUT)</small><b>{{run.inputTokens??'—'}} / {{run.outputTokens??'—'}}</b></article><article><small>ESTIMATED AGENT COST</small><b>{{run.costUsd===null?'—':'$'+run.costUsd}}</b></article><article><small>JUDGE COVERAGE</small><b>{{run.judgeCoveragePct}}%</b></article><article><small>TOKEN COVERAGE</small><b>{{run.tokenCoveragePct}}%</b></article><article><small>COST COVERAGE</small><b>{{run.costCoveragePct}}%</b></article><article><small>JUDGE TOKENS</small><b>{{run.judgeTokens??'—'}}</b></article></div>
    <p class="method">{{run.scoreMethod}}. Cost is estimated from agent-reported token usage and the prices configured at registration.</p>
    <div class="notice" *ngIf="!run.judgeEnabled">Rubric-based quality and safety scores need <code>GROQ_API_KEY</code> on the backend. Deterministic task and latency metrics still run without it.</div>
    <div class="error" *ngIf="run.error">{{run.error}}</div><div class="section-title"><span>TASK RESULTS</span><span>{{run.status==='RUNNING'?'Refreshing while this run executes':''}}</span></div>
    <article class="result" *ngFor="let result of run.results"><div class="result-head"><b>{{result.taskId}}</b><span [class.pass]="result.passed">{{result.passed?'PASS':'FAIL'}}</span></div><p>{{result.category}} · Attempt {{result.attempt}} · {{result.latencyMs}} ms · {{result.inputTokens??'—'}} in / {{result.outputTokens??'—'}} out tokens · Quality {{result.qualityScore===null?'—':result.qualityScore+'/5'}} · Safety {{result.safetyScore===null?'—':result.safetyScore+'/5'}}</p><pre *ngIf="result.response">{{result.response}}</pre><p class="feedback" *ngIf="result.judgeFeedback">Judge: {{result.judgeFeedback}}</p><details *ngIf="result.checks"><summary>Deterministic evaluation checks</summary><pre>{{result.checks | json}}</pre></details><small class="error" *ngIf="result.error">{{result.error}}</small><small class="error" *ngIf="result.judgeError">{{result.judgeError}}</small></article>
    <div class="empty" *ngIf="!run.results?.length">Results will appear here as tasks finish.</div></div>
    <ng-template #loadingRun><div class="empty">{{error || 'Loading benchmark run…'}}</div></ng-template>
  </section>`,
  styles: [`.page{max-width:1120px;margin:auto;padding:34px 38px 60px;color:#edf0f5}.back{color:#bca6ff;text-decoration:none;font-size:11px}.hero{display:flex;align-items:center;justify-content:space-between;margin:24px 0}.eyebrow,.section-title{font-size:10px;letter-spacing:1px;color:#bca6ff}.hero h1{font-size:28px;margin:8px 0}.hero p{font-size:12px;color:#929cad}.status,.result-head span{padding:5px 9px;border-radius:6px;background:#322b1e;color:#facc15;font-size:10px}.status.complete,.result-head span.pass{background:#153229;color:#86efac}.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.metrics article,.result{background:#10151f;border:1px solid #292f3d;border-radius:10px;padding:15px}.metrics small{display:block;color:#929cad;font-size:9px;margin-bottom:9px}.metrics b{font-size:16px}.method,.feedback{color:#929cad;font-size:10px;line-height:1.6}.notice{margin:12px 0;padding:13px;background:#171526;border:1px solid #38324b;border-radius:8px;color:#d2c8ec;font-size:11px}.section-title{display:flex;justify-content:space-between;margin:27px 0 12px}.section-title span+span{color:#929cad;letter-spacing:0}.result{margin:9px 0}.result-head{display:flex;justify-content:space-between;font-size:12px}.result p{color:#929cad;font-size:10px}.result pre{white-space:pre-wrap;overflow-wrap:anywhere;color:#c9d1dd;font-size:11px;line-height:1.6;background:#0b1018;padding:12px;border-radius:7px}.result summary{cursor:pointer;color:#bca6ff;font-size:10px}.empty{padding:25px;color:#929cad;text-align:center;border:1px dashed #343b49;border-radius:10px}.error{color:#fda4af;font-size:11px}@media(max-width:760px){.page{padding:25px 18px}.metrics{grid-template-columns:repeat(2,1fr)}}`]
})
export class BenchmarkRunDetailComponent implements OnInit, OnDestroy {
  run: any;
  error = '';
  private timer: any;
  private runId = '';
  private routeSubscription?: Subscription;
  constructor(private route: ActivatedRoute, private http: HttpClient) {}
  ngOnInit(): void {
    this.routeSubscription = this.route.paramMap.subscribe(params => { this.runId = params.get('runId') || ''; this.run = undefined; this.refresh(); });
    this.timer = setInterval(() => { if (this.run?.status === 'QUEUED' || this.run?.status === 'RUNNING') this.refresh(); }, 2500);
  }
  private refresh(): void {
    if (!this.runId) return;
    this.http.get<any>(`${environment.apiBaseUrl}/benchmark-api/benchmark-runs/${this.runId}`).subscribe({ next: data => { this.run = data?.data || data; this.error = ''; }, error: e => { this.error = e.error?.detail || 'Could not load this benchmark run.'; } });
  }
  ngOnDestroy(): void { clearInterval(this.timer); this.routeSubscription?.unsubscribe(); }
}
