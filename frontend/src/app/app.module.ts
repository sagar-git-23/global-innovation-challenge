import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { CreateBriefComponent } from './create-brief.component';
import { BriefHistoryComponent } from './brief-history.component';
import { BriefViewerComponent } from './brief-viewer.component';
import { DocumentLibraryComponent } from './document-library.component';
import { BenchmarkWorkspaceComponent } from './benchmark-workspace.component';
const routes: Routes = [{path:'',redirectTo:'briefing/create',pathMatch:'full'},{path:'benchmark',redirectTo:'benchmark/overview',pathMatch:'full'},{path:'benchmark/overview',component:BenchmarkWorkspaceComponent,data:{view:'overview'}},{path:'benchmark/agents',component:BenchmarkWorkspaceComponent,data:{view:'agents'}},{path:'benchmark/runs/new',component:BenchmarkWorkspaceComponent,data:{view:'new'}},{path:'benchmark/leaderboard',component:BenchmarkWorkspaceComponent,data:{view:'leaderboard'}},{path:'benchmark/findings',component:BenchmarkWorkspaceComponent,data:{view:'findings'}},{path:'briefing/create',component:CreateBriefComponent},{path:'briefing/history',component:BriefHistoryComponent},{path:'briefing/:briefId',component:BriefViewerComponent}];
@NgModule({declarations:[AppComponent,CreateBriefComponent,BriefHistoryComponent,BriefViewerComponent,DocumentLibraryComponent,BenchmarkWorkspaceComponent],imports:[BrowserModule,HttpClientModule,FormsModule,RouterModule.forRoot(routes,{scrollPositionRestoration:'enabled'})],bootstrap:[AppComponent]})
export class AppModule {}
