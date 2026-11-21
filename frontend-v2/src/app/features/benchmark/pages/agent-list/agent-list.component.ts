import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { apiError, StatusTonePipe } from '../../../../core/utils/format';
import { Agent, AgentAdapter } from '../../models/benchmark.models';
import { AgentTestResult, BenchmarkApiService } from '../../services/benchmark-api.service';

@Component({
  selector: 'app-agent-list',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, StatusTonePipe],
  templateUrl: './agent-list.component.html'
})
export class AgentListComponent {
  private readonly api = inject(BenchmarkApiService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly agents = signal<Agent[]>([]);
  readonly loading = signal(true);
  readonly loadError = signal('');
  readonly search = signal('');
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly formError = signal('');
  readonly notice = signal('');
  readonly testingId = signal('');

  readonly types = [
    { value: 'CUSTOMER_SUPPORT', label: 'Customer support' },
    { value: 'RESEARCH', label: 'Research' },
    { value: 'CODING', label: 'Coding' },
    { value: 'OTHER', label: 'Other' }
  ];
  readonly frameworks = ['LangGraph', 'LangChain', 'CrewAI', 'AutoGen', 'Custom FastAPI', 'Other'];

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.agents();
    return this.agents().filter(a =>
      [a.name, a.type, a.framework, a.description, a.endpoint].join(' ').toLowerCase().includes(q));
  });

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    type: ['CUSTOMER_SUPPORT'],
    framework: ['LangGraph', [Validators.required, Validators.maxLength(80)]],
    version: ['1.0.0', [Validators.required, Validators.maxLength(40)]],
    endpoint: ['', [Validators.required, Validators.pattern(/^https?:\/\/\S+$/i)]],
    description: ['', Validators.maxLength(1000)],
    timeoutSeconds: [60, [Validators.required, Validators.min(5), Validators.max(600)]],
    inputCostPer1M: this.fb.control<number | null>(null, [Validators.min(0), Validators.max(100000)]),
    outputCostPer1M: this.fb.control<number | null>(null, [Validators.min(0), Validators.max(100000)]),
    adapter: ['http' as AgentAdapter],
    model: [''],
    authEnvVar: ['']
  });

  constructor() {
    this.fetch();
  }

  fetch(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.api.loadAgents().subscribe({
      next: list => { this.agents.set(list); this.loading.set(false); },
      error: e => { this.loadError.set(apiError(e)); this.loading.set(false); }
    });
  }

  openForm(): void {
    this.formError.set('');
    this.showForm.set(true);
  }

  closeForm(): void {
    if (!this.saving()) this.showForm.set(false);
  }

  register(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    if (v.adapter === 'openai-chat' && !v.model.trim()) {
      this.formError.set('Enter a model name for the OpenAI-compatible adapter.');
      return;
    }
    if (v.authEnvVar.trim() && !/^BENCHMARK_AGENT_KEY_[A-Z0-9_]{1,50}$/.test(v.authEnvVar.trim())) {
      this.formError.set('Credential variable names must start with BENCHMARK_AGENT_KEY_ and use uppercase letters, numbers or underscores.');
      return;
    }
    this.saving.set(true);
    this.formError.set('');
    this.api.createAgent({
      name: v.name.trim(), type: v.type, framework: v.framework.trim(), version: v.version.trim(),
      endpoint: v.endpoint.trim(), description: v.description.trim(), timeoutSeconds: v.timeoutSeconds,
      inputCostPer1M: v.inputCostPer1M, outputCostPer1M: v.outputCostPer1M,
      adapter: v.adapter, model: v.model.trim() || null, authEnvVar: v.authEnvVar.trim() || null
    }).subscribe({
      next: agent => {
        this.agents.update(list => [agent, ...list]);
        this.saving.set(false);
        this.showForm.set(false);
        this.form.reset();
        this.notice.set(`${agent.name} was registered.`);
        setTimeout(() => this.notice.set(''), 4000);
      },
      error: e => { this.formError.set(apiError(e)); this.saving.set(false); }
    });
  }

  testAgent(agent: Agent): void {
    if (this.testingId()) return;
    this.testingId.set(agent.id);
    this.notice.set('');
    this.api.testAgent(agent.id).subscribe({
      next: result => {
        this.agents.update(list => list.map(item => item.id === agent.id ? { ...item, status: result.reachable ? 'READY' : 'OFFLINE' } : item));
        this.notice.set(`${agent.name}: ${result.message}${result.reachable ? ` (${result.latencyMs} ms)` : ''}`);
        this.testingId.set('');
      },
      error: e => {
        this.notice.set(`${agent.name}: ${apiError(e)}`);
        this.testingId.set('');
      }
    });
  }
}
