import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { BriefingApiService } from './briefing-api.service';

@Component({selector:'app-document-library',template:`<section class="library"><div class="lib-head"><div><b>Meeting documents</b><small>OPTIONAL · PRIVATE CONTEXT FOR RAG</small></div><label class="upload">＋ Add file<input type="file" accept=".pdf,.docx,.txt" (change)="upload($event)"></label></div><p class="hint">Upload an agenda, proposal, or previous notes. Text is chunked and embedded locally; only extracted text and vectors are saved to Neon.</p><p class="status" *ngIf="status">{{status}}</p><div class="upload-progress" *ngIf="uploading" role="status" aria-live="polite"><div class="progress-heading"><span>{{uploadPhase}}</span><b *ngIf="uploadProgress < 100">{{uploadProgress}}%</b><b *ngIf="uploadProgress >= 100">Processing</b></div><div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="uploadProgress < 100 ? uploadProgress : null" [class.processing]="uploadProgress >= 100"><span *ngIf="uploadProgress < 100" [style.width.%]="uploadProgress"></span></div><small>{{uploadProgress >= 100 ? "Extracting text and creating searchable embeddings…" : "Sending file to the server…"}}</small></div><p class="error" *ngIf="error">{{error}}</p><label class="doc" *ngFor="let item of items"><input type="checkbox" [checked]="selected.has(item.documentId)" (change)="toggle(item.documentId,$event)"><span><b>{{item.filename}}</b><small>{{item.chunkCount}} searchable chunks <ng-container *ngIf="item.pageCount">· {{item.pageCount}} pages</ng-container></small></span><button type="button" title="Download original" (click)="download(item.documentId,item.filename,$event)">↓</button><button type="button" title="Remove document" (click)="remove(item.documentId,$event)">×</button></label><div class="empty" *ngIf="!items.length">No meeting documents uploaded. You can still generate a web-only brief.</div></section>`,styles:[`.library{border:1px solid #292f3d;background:#0d121a;border-radius:9px;padding:13px;margin:2px 0 16px}.lib-head{display:flex;align-items:center;justify-content:space-between}.lib-head b,.lib-head small{display:block}.lib-head b{font-size:11px;color:#e5e9ef}.lib-head small{font-size:8px;letter-spacing:.8px;color:#82769f;margin-top:4px}.upload{position:relative;overflow:hidden;border:1px solid #41385a;color:#e4dbff;background:#211a35;padding:8px 11px;border-radius:7px;font-size:12px;font-weight:650;cursor:pointer}.upload input{position:absolute;inset:0;opacity:0;cursor:pointer}.hint{font-size:10px;line-height:1.5;color:#828c9c;margin:10px 0}.doc{display:flex;align-items:center;gap:9px;padding:8px 0;border-top:1px solid #232a36;cursor:pointer}.doc>input{accent-color:#a78bfa}.doc span{min-width:0;flex:1}.doc b,.doc small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.doc b{font-size:10px;color:#d2d7e0}.doc small{font-size:8px;color:#7f8999;margin-top:3px}.doc button{background:none;border:0;color:#8993a3;font-size:16px;cursor:pointer}.empty,.status,.error{font-size:11px;line-height:1.55;color:#a8b1c0;margin:10px 0}.status{font-weight:600;color:#c4b5fd}.error{color:#fda4af}.upload-progress{margin:13px 0;padding:13px 14px;border:1px solid #43385f;border-radius:9px;background:#171526}.progress-heading{display:flex;justify-content:space-between;gap:12px;align-items:center;font-size:12px;line-height:1.4;color:#ede9fb}.progress-heading b{font-size:14px;color:#d4c5ff;white-space:nowrap}.progress-track{height:10px;margin:9px 0 7px;border-radius:99px;background:#29243b;overflow:hidden}.progress-track>span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#8b5cf6,#e879f9);transition:width .2s ease}.progress-track.processing:before{content:"";display:block;width:38%;height:100%;border-radius:inherit;background:linear-gradient(90deg,#8b5cf6,#e879f9);animation:upload-sweep 1.2s ease-in-out infinite}@keyframes upload-sweep{0%{transform:translateX(-110%)}100%{transform:translateX(275%)}}.upload-progress>small{font-size:10px;line-height:1.5;color:#aaa4bc}`]})
export class DocumentLibraryComponent implements OnInit {
  @Output() selectionChange = new EventEmitter<string[]>();
  items:any[]=[]; selected=new Set<string>(); status=''; error=''; uploading=false; uploadProgress=0; uploadPhase='';
  constructor(private api:BriefingApiService){}
  ngOnInit(){this.load()}
  load(){this.api.documents().subscribe({next:items=>this.items=items,error:()=>this.error='Could not load documents from Neon.'})}
  upload(event:Event){
    const input=event.target as HTMLInputElement;
    const file=input.files?.[0];
    if(!file||this.uploading)return;
    this.uploading=true;this.uploadProgress=0;this.uploadPhase=`Uploading ${file.name}`;this.status='';this.error='';
    this.api.upload(file).subscribe({
      next:event=>{
        if(event.type===HttpEventType.UploadProgress){
          const total=event.total||file.size;
          this.uploadProgress=total?Math.min(100,Math.round(event.loaded*100/total)):0;
          this.uploadPhase=this.uploadProgress>=100?`File received · indexing ${file.name}`:`Uploading ${file.name}`;
        }
        if(event.type===HttpEventType.Response){
          const result=event.body;
          this.uploading=false;this.uploadProgress=100;
          this.status=`Ready · indexed ${result.chunkCount} searchable sections from ${result.filename}.`;
          this.selected.add(result.documentId);this.selectionChange.emit([...this.selected]);this.load();input.value='';
        }
      },
      error:error=>{this.uploading=false;this.uploadProgress=0;this.uploadPhase='';this.status='';this.error=error.error?.detail||'Upload failed.';input.value=''}
    });
  }
  download(id:string,filename:string,event:Event){event.preventDefault();event.stopPropagation();this.error='';this.api.downloadDocument(id).subscribe({next:r=>{if(!r.body){this.error='The download response was empty.';return}const url=URL.createObjectURL(r.body);const link=document.createElement('a');link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)},error:(error:HttpErrorResponse)=>{if(error.error instanceof Blob){error.error.text().then(text=>{try{const body=JSON.parse(text);this.error=body.detail||'Could not download the original file.'}catch{this.error='Could not download the original file.'}})}else this.error=error.error?.detail||'Could not download the original file.'}})}
  toggle(id:string,event:Event){const checked=(event.target as HTMLInputElement).checked;if(checked)this.selected.add(id);else this.selected.delete(id);this.selectionChange.emit([...this.selected])}
  remove(id:string,event:Event){event.preventDefault();event.stopPropagation();this.api.removeDocument(id).subscribe({next:()=>{this.selected.delete(id);this.selectionChange.emit([...this.selected]);this.load()},error:()=>this.error='Could not remove this document.'})}
}
