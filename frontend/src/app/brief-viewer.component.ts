import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Brief, BriefingApiService } from './briefing-api.service';

@Component({
  selector: 'app-brief-viewer',
  template: `
    <section class="page" *ngIf="!brief">
      <div class="loading" *ngIf="!error">
        <div class="spinner"></div>
        <div class="eyebrow">TAVILY RESEARCH IN PROGRESS</div>
        <h1>Building your brief…</h1>
        <p>{{ stage }}</p>
        <div class="progress"><span [style.width.%]="progress"></span></div>
        <small>{{ progress }}% complete · researching and checking sources</small>
      </div>
      <div class="error" *ngIf="error">
        <b>Brief generation failed</b>
        <p>{{ error }}</p>
        <a routerLink="/briefing/create">Create another brief</a>
      </div>
    </section>

    <section class="page" *ngIf="brief as report">
      <div class="toolbar">
        <a routerLink="/briefing/history">← Brief history</a>
        <button type="button" (click)="print()">↗ &nbsp; Print / Save PDF</button>
      </div>

      <header class="brief-head">
        <div class="eyebrow">MEETING INTELLIGENCE · {{ report.coverage.from | date:'MMM d' }} — {{ report.coverage.to | date:'MMM d, y' }}</div>
        <h1>{{ report.subject.name }}</h1>
        <p>{{ report.meetingPurpose }}</p>
        <div class="meta">
          <span>{{ report.meetingTime | date:'EEEE, MMMM d · h:mm a' }}</span>
          <span>{{ report.sources.length }} cited sources</span>
          <span>Generated {{ report.generatedAt | date:'MMM d, y · h:mm a' }}</span>
        </div>
      </header>

      <div class="brief-grid">
        <article class="content">
          <section class="section summary">
            <div class="label">EXECUTIVE SNAPSHOT</div>
            <p *ngFor="let claim of report.executiveSummary">
              {{ claim.text }}
              <sup *ngFor="let id of claim.citationIds"><a [href]="sourceUrl(id)" target="_blank" rel="noopener">[{{ sourceNum(id) }}]</a></sup>
            </p>
            <p class="empty" *ngIf="!report.executiveSummary.length">No recent signals surfaced in this research window.</p>
          </section>

          <section class="section">
            <h2>Recent news</h2>
            <div class="claim" *ngFor="let claim of report.recentNews">
              {{ claim.text }}
              <sup *ngFor="let id of claim.citationIds"><a [href]="sourceUrl(id)" target="_blank" rel="noopener">[{{ sourceNum(id) }}]</a></sup>
            </div>
            <p class="empty" *ngIf="!report.recentNews.length">No recent news found.</p>
          </section>

          <section class="section">
            <h2>Hires and leadership</h2>
            <div class="claim" *ngFor="let claim of report.hires">
              {{ claim.text }}
              <sup *ngFor="let id of claim.citationIds"><a [href]="sourceUrl(id)" target="_blank" rel="noopener">[{{ sourceNum(id) }}]</a></sup>
            </div>
            <p class="empty" *ngIf="!report.hires.length">No recent leadership or hiring signals found.</p>
          </section>

          <section class="section">
            <h2>Launches and business signals</h2>
            <div class="claim" *ngFor="let claim of report.launches.concat(report.businessSignals)">
              {{ claim.text }}
              <sup *ngFor="let id of claim.citationIds"><a [href]="sourceUrl(id)" target="_blank" rel="noopener">[{{ sourceNum(id) }}]</a></sup>
            </div>
            <p class="empty" *ngIf="!report.launches.length && !report.businessSignals.length">No launches or business signals found.</p>
          </section>

          <section class="section visuals" *ngIf="report.images?.length">
            <h2>Visuals from research</h2>
            <div class="image-grid">
              <figure *ngFor="let image of report.images">
                <a [href]="image.sourceUrl || image.url" target="_blank" rel="noopener">
                  <img [src]="image.url" [alt]="image.description || image.title">
                </a>
                <figcaption>
                  <b>{{ image.title }}</b>
                  <p *ngIf="image.description">{{ image.description }}</p>
                  <small *ngIf="image.sourceId">Source <a [href]="sourceUrl(image.sourceId)" target="_blank" rel="noopener">[{{ sourceNum(image.sourceId) }}]</a></small>
                  <small *ngIf="!image.sourceId && image.sourceTitle">{{ image.sourceTitle }}</small>
                </figcaption>
              </figure>
            </div>
          </section>

          <section class="section questions">
            <h2>Open questions and evidence-based answers</h2>
            <article class="question" *ngFor="let item of report.openQuestions">
              <h3>{{ item.question }}</h3>
              <div class="answer"><span>What the evidence says</span>{{ item.answer || item.reason || 'The available sources do not provide a clear answer yet.' }}
                <sup *ngFor="let id of item.citationIds"><a [href]="sourceUrl(id)" target="_blank" rel="noopener">[{{ sourceNum(id) }}]</a></sup>
              </div>
              <p class="reason" *ngIf="item.reason">Why to ask: {{ item.reason }}</p>
            </article>
            <p class="empty" *ngIf="!report.openQuestions.length">No evidence gaps identified.</p>
          </section>
        </article>

        <aside class="sources">
          <h2>Sources <span>{{ report.sources.length }}</span></h2>
          <a class="source" *ngFor="let source of report.sources; let index = index"
             [href]="source.url" target="_blank" rel="noopener">
            <div class="source-top"><b>[{{ index + 1 }}]</b><span>{{ source.publishedAt ? (source.publishedAt | date:'MMM d, y') : 'DATE N/A' }}</span></div>
            <strong>{{ source.title }}</strong>
            <small>{{ source.publisher }}</small>
            <p>{{ source.excerpt }}</p>
            <div class="confidence" *ngIf="source.score != null && source.sourceType !== 'DOCUMENT'">TAVILY RELEVANCE <b>{{ (source.score * 100) | number:'1.0-0' }}%</b></div>
            <div class="confidence" *ngIf="source.sourceType === 'DOCUMENT'">UPLOADED MEETING DOCUMENT</div>
          </a>
          <div class="research" *ngIf="report.research">
            <b>Research method</b>
            <small>{{ report.research.searchDepth }} search · {{ report.research.model }}</small>
            <small>Coverage: {{ report.coverage.from }} through {{ report.coverage.to }}</small>
          </div>
        </aside>
      </div>
    </section>
  `,
  styles: [`
    :host{display:block}
    .page{max-width:1180px;margin:auto;padding:32px 40px 60px;color:#f0f2f7}
    .loading{text-align:center;max-width:430px;margin:100px auto}
    .spinner{width:34px;height:34px;border:3px solid #292b3d;border-top-color:#c084fc;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 22px}
    @keyframes spin{to{transform:rotate(360deg)}}
    .eyebrow{font-size:9px;color:#8a63dc;letter-spacing:1.4px;font-weight:700}
    .loading h1{font-size:24px}.loading p,.loading small{font-size:11px;color:#929cad}
    .progress{height:5px;background:#242a36;border-radius:4px;margin:24px 0 10px;overflow:hidden}
    .progress span{height:100%;display:block;background:linear-gradient(90deg,#8b5cf6,#ec4899);transition:width .5s}
    .toolbar{display:flex;justify-content:space-between;margin-bottom:22px;align-items:center}
    .toolbar a{font-size:11px;text-decoration:none;color:#aab3c1}
    .toolbar button{background:#161c27;border:1px solid #323949;color:#d6dbe4;border-radius:7px;padding:9px 12px;font-size:10px;cursor:pointer}
    .brief-head{padding:26px 28px;background:radial-gradient(ellipse at top right,#28203b,#111620 65%);border:1px solid #302b42;border-radius:13px;margin-bottom:16px}
    .brief-head h1{font-size:30px;letter-spacing:-1px;margin:12px 0 5px;color:#f7f7fb}
    .brief-head>p{font-size:13px;color:#a4adbb;margin:0 0 16px;max-width:760px;line-height:1.6}
    .meta{display:flex;gap:9px 18px;flex-wrap:wrap;font-size:10px;color:#818b9b}.meta span+span:before{content:'·';margin-right:18px;color:#4e5869}
    .brief-grid{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(270px,.8fr);gap:16px;align-items:start}
    .content,.sources{min-width:0;background:#10151f;border:1px solid #292f3d;border-radius:12px;padding:22px}
    .section{padding:0 0 20px;margin-bottom:19px;border-bottom:1px solid #252b37;min-width:0}
    .section:last-child{border:0;margin:0;padding:0}
    h2{font-size:15px;line-height:1.4;margin:0 0 12px;color:#eef0f5;letter-spacing:-.15px}
    .summary{background:#17162a;border:1px solid #302849;border-radius:9px;padding:16px;margin:0 0 20px}
    .summary h2{color:#d8cbff}
    .summary p,.claim{font-size:12px;line-height:1.75;color:#cbd1dc;margin:8px 0}
    .claim{padding:7px 0;margin:0}
    sup{margin-left:3px;white-space:nowrap}sup a{color:#7652c8;text-decoration:none;font-size:9px;font-weight:700}
    .question{padding:14px 0;border-top:1px solid #252b37;break-inside:avoid}
    .question h3{font-size:12px;line-height:1.55;margin:0 0 9px;color:#e5e7ed}
    .answer{font-size:11px;line-height:1.7;color:#c4cad5}
    .answer span{display:block;color:#8a63dc;font-size:8px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;margin-bottom:4px}
    .reason{font-size:10px;line-height:1.55;color:#8993a3;margin:7px 0 0}
    .empty{color:#727d8e;font-size:11px;line-height:1.6}
    .image-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
    figure{margin:0;min-width:0;border:1px solid #292f3d;border-radius:9px;overflow:hidden;background:#0b1018;break-inside:avoid}
    figure>a{display:block}.image-grid img{display:block;width:100%;height:180px;object-fit:cover;background:#171d28}
    figcaption{padding:10px 11px}figcaption b{display:block;font-size:10px;line-height:1.5;color:#e3e7ee}
    figcaption p{font-size:9px;line-height:1.5;color:#a0a9b8;margin:5px 0}
    figcaption small{display:block;font-size:8px;color:#8c96a6;margin-top:5px}figcaption a{color:#7652c8;text-decoration:none}
    .sources h2{font-size:14px;margin:0 0 13px}.sources h2 span{font-size:9px;color:#7652c8;background:#eee9fa;border-radius:5px;padding:4px 6px;margin-left:5px}
    .source{display:block;text-decoration:none;color:inherit;padding:12px 0;border-top:1px solid #252b37;overflow-wrap:anywhere;break-inside:avoid}
    .source-top{display:flex;justify-content:space-between;gap:8px;color:#8a94a4;font-size:8px;margin-bottom:7px}.source-top b{color:#7652c8}
    .source strong{font-size:10px;line-height:1.5;display:block;color:#e3e7ee}
    .source small{font-size:9px;color:#8b95a5;display:block;margin-top:4px}
    .source p{font-size:9px;color:#9ca6b5;line-height:1.55;margin:8px 0;overflow-wrap:anywhere}
    .confidence{font-size:7px;color:#778193;letter-spacing:.7px}.confidence b{float:right;color:#7652c8}
    .research{margin-top:12px;padding:12px;background:#0c1119;border-radius:8px}.research b,.research small{display:block;font-size:9px;color:#aeb7c5;margin-bottom:6px}.research small{color:#798495}
    .error{background:#fff1f2;border:1px solid #fecdd3;color:#9f1239;border-radius:9px;padding:18px;font-size:12px}.error p{line-height:1.6}.error a{color:#7c3aed}
    @media(max-width:850px){.page{padding:24px 17px}.brief-grid{grid-template-columns:1fr}.sources{order:-1}}
    @media(max-width:580px){.brief-head{padding:20px}.content,.sources{padding:16px}.image-grid{grid-template-columns:1fr}.image-grid img{height:210px}.toolbar{margin-bottom:15px}}
    @media print{
      @page{size:A4 portrait;margin:14mm}
      .page{width:100%;max-width:none;margin:0;padding:0;color:#202938;font-size:10pt}
      .toolbar,.loading,.error{display:none!important}
      .brief-head{background:#fff;border:0;border-bottom:2px solid #6d4ab4;border-radius:0;padding:0 0 12px;margin:0 0 14px;break-inside:avoid}
      .brief-head h1{font-size:23pt;color:#111827;margin:7px 0 4px}
      .brief-head>p{font-size:10pt;color:#374151;margin-bottom:9px}
      .eyebrow{color:#5b3c9e}.meta{font-size:8pt;color:#4b5563;gap:4px 12px}
      .brief-grid{display:block}
      .content,.sources{display:block;width:100%;padding:0;border:0;border-radius:0;background:#fff;color:#202938;overflow:visible}
      .section{border-color:#d8dce4;padding-bottom:12px;margin-bottom:12px;break-inside:auto}
      h2{font-size:12pt;color:#111827;margin-bottom:7px}
      .summary{background:#f5f2fb;border:1px solid #e2d9f3;padding:11px;margin-bottom:13px;break-inside:avoid}
      .summary p,.claim,.answer{font-size:9pt;line-height:1.55;color:#263244}
      .question{padding:9px 0;border-color:#e1e4e9;break-inside:avoid}
      .question h3{font-size:9.5pt;color:#111827}.answer span{color:#5b3c9e}.reason{font-size:8pt;color:#4b5563}
      .empty{color:#4b5563}.image-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
      figure{background:#fff;border:1px solid #d8dce4}.image-grid img{height:100px;object-fit:contain;background:#f3f4f6}
      figcaption{padding:7px 8px}figcaption b{font-size:8pt;color:#111827}figcaption p,figcaption small{font-size:7pt;color:#4b5563}
      .sources{margin-top:12px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:12px;break-before:auto}
      .sources h2{grid-column:1/-1;border-bottom:1px solid #d8dce4;padding-bottom:6px}
      .source{padding:8px;border:1px solid #e1e4e9;border-radius:5px;color:#202938;overflow-wrap:anywhere}
      .source strong{font-size:8pt;color:#111827}.source small,.source p{font-size:7pt;color:#4b5563}
      .source-top,.confidence{font-size:7pt;color:#4b5563}.research{grid-column:1/-1;background:#f3f4f6}
      a{color:inherit!important;text-decoration:none!important}
      img{max-width:100%;print-color-adjust:exact;-webkit-print-color-adjust:exact}
    }
  `]
})
export class BriefViewerComponent implements OnInit, OnDestroy {
  brief: Brief | null = null;
  stage = 'Connecting to Tavily…';
  progress = 4;
  error = '';
  private timer: ReturnType<typeof setTimeout> | undefined;
  private id = '';

  constructor(private route: ActivatedRoute, private api: BriefingApiService) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('briefId') || '';
    this.poll();
  }

  ngOnDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }

  poll(): void {
    this.api.status(this.id).subscribe({
      next: status => {
        this.stage = status.currentStage;
        this.progress = status.progressPercentage;
        if (status.status === 'COMPLETED') {
          this.api.get(this.id).subscribe({
            next: brief => this.brief = brief,
            error: () => this.error = 'Brief is complete, but could not be loaded.'
          });
        } else if (status.status === 'FAILED') {
          this.error = status.errorMessage || 'Brief generation failed. Check your API configuration.';
        } else {
          this.timer = setTimeout(() => this.poll(), 1100);
        }
      },
      error: () => this.timer = setTimeout(() => this.poll(), 1600)
    });
  }

  sourceUrl(id: string): string {
    return this.brief?.sources.find(source => source.id === id)?.url || '#';
  }

  sourceNum(id: string): number {
    const index = this.brief?.sources.findIndex(source => source.id === id) ?? -1;
    return index + 1;
  }

  print(): void {
    window.print();
  }
}
