import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { BriefingApiService, BriefRequest } from './briefing-api.service';
@Component({selector:'app-create-brief',template:`<section class="page"><div class="intro"><div><div class="eyebrow"><span></span> TAVILY · PRE-MEETING BRIEFING AGENT</div><h1>Walk into the room <em>ready.</em></h1><p>Turn the latest public signals into a sharp, sourced meeting brief.</p></div><div class="date-chip">◷ &nbsp; Past 30 days</div></div><div class="layout"><form class="card form" (ngSubmit)="generate()"><div class="card-head"><div class="step">01</div><div><h2>Meeting details</h2><p>Tell us who you’re meeting and what matters.</p></div></div><div class="type-row"><button type="button" [class.selected]="form.subjectType==='COMPANY'" (click)="form.subjectType='COMPANY'">▦ &nbsp; Company</button><button type="button" [class.selected]="form.subjectType==='PERSON'" (click)="form.subjectType='PERSON'">♙ &nbsp; Person</button></div><label class="field"><span>{{form.subjectType==='COMPANY'?'COMPANY NAME':'PERSON NAME'}}</span><input name="subjectName" [(ngModel)]="form.subjectName" placeholder="e.g. Acme AI" required minlength="2"></label><div class="two"><label class="field"><span>MEETING DATE</span><input type="date" name="meetingDate" [(ngModel)]="meetingDate" [min]="today" required></label><label class="field"><span>MEETING TIME</span><select name="meetingTimeSelection" [(ngModel)]="meetingTimeSelection" required><option value="" disabled>Select a time</option><option *ngFor="let slot of timeSlots" [value]="slot.value">{{slot.label}}</option></select></label></div><label class="field"><span>REGION</span><select name="region" [(ngModel)]="form.region"><option>Global</option><option>North America</option><option>Europe</option><option>Asia Pacific</option><option>India</option></select></label><label class="field"><span>MEETING PURPOSE</span><textarea name="meetingPurpose" [(ngModel)]="form.meetingPurpose" placeholder="What are you hoping to discuss or decide?" rows="3" required minlength="3"></textarea></label><app-document-library (selectionChange)="form.documentIds=$event"></app-document-library><div class="advanced-toggle" (click)="advanced=!advanced">⌄ &nbsp; Research controls <small>{{advanced?'Hide':'Optional · search depth, sources, language'}}</small></div><div class="advanced" *ngIf="advanced"><div class="two"><label class="field"><span>LOOKBACK WINDOW</span><select name="lookbackDays" [(ngModel)]="form.lookbackDays"><option [ngValue]="30">30 days</option><option [ngValue]="14">14 days</option><option [ngValue]="60">60 days</option><option [ngValue]="90">90 days</option></select></label><label class="field"><span>SEARCH DEPTH</span><select name="searchDepth" [(ngModel)]="form.searchDepth"><option value="advanced">Advanced · deeper</option><option value="basic">Basic · faster</option></select></label></div><div class="two"><label class="field"><span>COUNTRY CODE</span><input name="country" [(ngModel)]="form.country" placeholder="US, IN, GB"></label><label class="field"><span>LANGUAGE CODE</span><input name="language" [(ngModel)]="form.language" placeholder="en"></label></div><label class="field"><span>INCLUDE DOMAINS · comma separated</span><input name="includeDomains" [(ngModel)]="includeDomains" placeholder="company.com, reuters.com"></label><label class="field"><span>EXCLUDE DOMAINS</span><input name="excludeDomains" [(ngModel)]="excludeDomains" placeholder="reddit.com"></label><label class="check"><input type="checkbox" name="rawContent" [(ngModel)]="form.includeRawContent"> Keep expanded source text for evidence review</label><label class="check"><input type="checkbox" name="includeImages" [(ngModel)]="form.includeImages"> Include relevant source images in the report</label></div><div class="error" *ngIf="error">{{error}}</div><button class="submit" [disabled]="loading">{{loading?'Starting research…':'✦  Generate meeting brief'}} <span>→</span></button><div class="privacy">⌑ &nbsp; Every finding links back to its original source.</div></form><aside class="side"><div class="card preview"><div class="preview-title"><span class="spark">✳</span><div><b>What you’ll get</b><small>DEEP DIVE · FULLY SOURCED</small></div></div><div class="preview-line"><span>01</span><div><b>Executive snapshot</b><small>Signals worth knowing before you walk in.</small></div></div><div class="preview-line"><span>02</span><div><b>News, hires & launches</b><small>Recent moves with context and why they matter.</small></div></div><div class="preview-line"><span>03</span><div><b>Business signals</b><small>Partnerships, strategy and momentum.</small></div></div><div class="preview-line"><span>04</span><div><b>Open questions and answers</b><small>Follow-up searches, cited answers, and remaining gaps.</small></div></div><div class="powered">✳ &nbsp; Researched with <b>Tavily</b><span>LIVE WEB</span></div></div><div class="note"><div>✦</div><p><b>Built for the last 30 days.</b><br>Fresh reporting, company announcements and leadership changes, cited claim by claim.</p></div></aside></div></section>`,styles:[`.page{max-width:1120px;margin:auto;padding:38px 40px 60px;color:#f2f3f7}.intro{display:flex;align-items:flex-end;justify-content:space-between;margin:5px 0 28px}.eyebrow{font-size:9px;letter-spacing:1.5px;color:#c5b3ff;font-weight:700}.eyebrow span{display:inline-block;width:7px;height:7px;background:#f472b6;border-radius:50%;margin-right:7px}h1{font-size:34px;letter-spacing:-1.4px;margin:13px 0 7px}h1 em{font-style:normal;background:linear-gradient(90deg,#c4b5fd,#f472b6);background-clip:text;color:transparent}.intro p{color:#9099aa;font-size:13px;margin:0}.date-chip{border:1px solid #272d3b;background:#111722;padding:9px 12px;color:#afb7c5;border-radius:8px;font-size:11px}.layout{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(270px,.8fr);gap:17px;align-items:start}.card{border:1px solid #292f3d;border-radius:13px;background:#10151f}.form{padding:23px}.card-head{display:flex;gap:12px;align-items:center;margin-bottom:18px}.step{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;background:#211c37;color:#c4b5fd;font-size:12px;font-weight:700}.card-head h2{font-size:16px;margin:0 0 4px}.card-head p{font-size:11px;color:#8791a2;margin:0}.type-row{display:flex;gap:8px;margin-bottom:17px}.type-row button{background:#0c111a;border:1px solid #2b3240;border-radius:8px;color:#929bac;padding:10px 14px;font-size:11px;cursor:pointer}.type-row button.selected{border-color:#9c78f2;background:#211a35;color:#ded1ff}.field{display:flex;flex-direction:column;gap:7px;margin:0 0 15px}.field>span{font-size:9px;letter-spacing:1.1px;color:#8993a5;font-weight:700}.field input,.field select,.field textarea{width:100%;background:#0b1018;border:1px solid #2a303d;color:#edf0f5;border-radius:8px;padding:11px 12px;outline:0;font-size:12px}.field input:focus,.field textarea:focus,.field select:focus{border-color:#9c78f2;box-shadow:0 0 0 3px #9c78f21c}.field input::placeholder,.field textarea::placeholder{color:#555f70}.field input[type=date]{color-scheme:dark}.field input[type=date]::-webkit-calendar-picker-indicator{opacity:1;cursor:pointer}.field textarea{resize:vertical}.two{display:grid;grid-template-columns:1fr 1fr;gap:12px}.advanced-toggle{color:#bbb0da;font-size:11px;cursor:pointer;margin:1px 0 16px}.advanced-toggle small{color:#778192;margin-left:5px}.advanced{padding:13px 12px 1px;background:#0c1119;border-radius:9px;margin:0 0 14px}.check{display:flex;align-items:center;gap:8px;font-size:10px;color:#9ca5b4;margin:0 0 13px}.check input{accent-color:#a78bfa}.submit{width:100%;background:linear-gradient(100deg,#8b5cf6,#cc5ca8);border:0;border-radius:9px;padding:14px;color:white;font-weight:700;font-size:12px;cursor:pointer}.submit span{float:right}.submit:disabled{opacity:.55;cursor:wait}.privacy{text-align:center;font-size:9px;color:#727c8c;margin-top:13px}.error{color:#fda4af;font-size:11px;margin-bottom:12px}.side{display:grid;gap:13px}.preview{padding:20px}.preview-title{display:flex;gap:10px;align-items:center;padding-bottom:18px;border-bottom:1px solid #292f3b;margin-bottom:5px}.spark{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#221b37;color:#c4b5fd}.preview-title b{font-size:12px;display:block}.preview-title small{font-size:8px;color:#788294;letter-spacing:1px;display:block;margin-top:4px}.preview-line{display:flex;gap:11px;padding:12px 0;border-bottom:1px solid #202632}.preview-line>span{font-size:10px;color:#b29af8;font-weight:700}.preview-line b{font-size:10px;display:block;margin-bottom:4px}.preview-line small{font-size:9px;color:#858f9f;line-height:1.4}.powered{font-size:10px;color:#939cac;padding-top:16px}.powered>b{color:#e6e9ef}.powered span{float:right;font-size:8px;letter-spacing:.8px;color:#4ade80;border:1px solid #28513d;padding:4px 6px;border-radius:5px}.note{display:flex;gap:11px;padding:14px;border-radius:11px;background:#17162a;border:1px solid #302849;color:#bcb3d3}.note>div{color:#c4b5fd}.note p{font-size:10px;line-height:1.7;color:#a09ab2;margin:0}.note b{color:#e3d9ff}@media(max-width:900px){.page{padding:28px 20px}.layout{grid-template-columns:1fr}.side{grid-template-columns:1fr 1fr}}@media(max-width:600px){.intro{display:block}.date-chip{display:inline-block;margin-top:15px}.side{grid-template-columns:1fr}.two{grid-template-columns:1fr}}`]
})
export class CreateBriefComponent {
  advanced = false;
  loading = false;
  error = '';
  includeDomains = '';
  excludeDomains = '';
  meetingDate = '';
  meetingTimeSelection = '';
  today = this.localDateValue(new Date());
  timeSlots = Array.from({ length: 48 }, (_, index) => {
    const hour = Math.floor(index / 2);
    const minute = index % 2 === 0 ? '00' : '30';
    const value = `${String(hour).padStart(2, '0')}:${minute}`;
    const label = new Date(`2000-01-01T${value}:00`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return { value, label };
  });
  form: BriefRequest = {
    subjectType: 'COMPANY', subjectName: '', meetingTime: '', meetingPurpose: '',
    lookbackDays: 30, region: 'Global', country: '', language: 'en',
    includeDomains: [], excludeDomains: [], searchDepth: 'advanced',
    includeRawContent: true, includeImages: true, documentIds: []
  };

  constructor(private api: BriefingApiService, private router: Router) {}

  private localDateValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  generate(): void {
    if (this.loading) return;
    this.error = '';

    const subjectName = this.form.subjectName.trim();
    const meetingPurpose = this.form.meetingPurpose.trim();
    const selectedDateTime = this.meetingDate && this.meetingTimeSelection
      ? `${this.meetingDate}T${this.meetingTimeSelection}`
      : '';
    const meetingDate = selectedDateTime ? new Date(selectedDateTime) : null;
    const includeDomains = this.includeDomains.split(',').map(value => value.trim()).filter(Boolean);
    const excludeDomains = this.excludeDomains.split(',').map(value => value.trim()).filter(Boolean);
    const country = this.form.country?.trim().toUpperCase() || null;
    const language = this.form.language.trim();

    if (subjectName.length < 2 || subjectName.length > 160) {
      this.error = 'Enter a name between 2 and 160 characters.';
      return;
    }
    if (!meetingDate || Number.isNaN(meetingDate.getTime())) {
      this.error = 'Choose both a valid meeting date and a time.';
      return;
    }
    if (meetingPurpose.length < 3 || meetingPurpose.length > 500) {
      this.error = 'Enter a meeting purpose between 3 and 500 characters.';
      return;
    }
    if (country && country.length !== 2) {
      this.error = 'Country must be a two-letter code, such as IN or US.';
      return;
    }
    if (language.length < 2 || language.length > 5) {
      this.error = 'Language code must be between 2 and 5 characters, such as en.';
      return;
    }
    if (includeDomains.length > 20 || excludeDomains.length > 20) {
      this.error = 'You can enter up to 20 domains in each domain field.';
      return;
    }
    if (this.form.documentIds.length > 20) {
      this.error = 'Select no more than 20 documents for one brief.';
      return;
    }

    this.loading = true;
    const body: BriefRequest = {
      ...this.form,
      subjectName,
      meetingPurpose,
      meetingTime: meetingDate.toISOString(),
      country,
      language,
      includeDomains,
      excludeDomains
    };
    this.api.create(body).subscribe({
      next: response => this.router.navigate(['/briefing', response.briefId]),
      error: error => {
        const detail = error?.error?.detail;
        if (Array.isArray(detail)) {
          this.error = detail.map((issue: any) => {
            const field = (issue.loc || []).filter((part: string) => part !== 'body').join('.');
            return `${field || 'Request'}: ${issue.msg || 'Invalid value'}`;
          }).join(' ');
        } else if (typeof detail === 'string') {
          this.error = detail;
        } else {
          this.error = 'Could not start research. Check the backend and try again.';
        }
        this.loading = false;
      }
    });
  }
}
