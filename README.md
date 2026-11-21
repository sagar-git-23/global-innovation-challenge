# Briefly — Tavily meeting briefing agent

Briefly creates sourced pre-meeting briefs with an Angular frontend and a FastAPI backend. The LangChain agent uses Groq GPT OSS 20B, calls Tavily for current web research, and can retrieve selected meeting documents from Neon pgvector. Original uploads are stored in Neon Object Storage; brief data, extracted text, and embeddings are stored in Neon Postgres.

## Prerequisites

- Node.js 22.22.3 or newer in the 22.x line, or Node.js 24.15.0 or newer in the 24.x line, and npm
- Python 3.10 or newer
- A Neon project with Postgres, pgvector, and an Object Storage bucket
- Tavily and Groq API keys

## One-time Neon setup

1. In the Neon SQL Editor for the app database, enable pgvector:

   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

2. Create a **private** Neon Object Storage bucket named `briefly-meeting-documents` on the same branch as the database.
3. Configure `backend/.env` with `NEON_DATABASE_URL`, `TAVILY_API_KEY`, `GROQ_API_KEY`, `AWS_ENDPOINT_URL_S3`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, and `S3_BUCKET_NAME`. The project `.env` is git-ignored; keep these credentials there, never in Angular or source files.
4. No local PostgreSQL server is needed. The backend connects to Neon using Psycopg's bundled binary driver.

The backend creates its Postgres tables when it starts. FastEmbed downloads its embedding model the first time a document is uploaded.

## Run on Windows

Start the backend in **PowerShell terminal 1**, from the project root:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

If you already created `.venv`, activate it and install the updated dependencies:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Leave this terminal running. Python 3.10 or newer is supported; Python 3.12 is a good default if you are creating a new environment.

Start the frontend in **PowerShell terminal 2**, from the project root. The Angular app is now in `frontend-v2`:

```powershell
cd frontend-v2
npm install
npm start
```

Open **http://localhost:4200**. FastAPI's interactive API documentation is at **http://localhost:8000/docs**.

## Using meeting documents

In **New brief**, optionally add PDF, DOCX, or TXT files up to 10 MB. The original file is saved to the Neon bucket, while extracted chunks and local embeddings go to Neon Postgres. Select the documents to include in the brief; the agent combines their relevant passages with expanded Tavily research. Its Tavily call also runs up to two focused searches on likely open-question gaps, so answers use web evidence or clearly state what remains unknown. Image results are enabled by default and can be turned off under research controls. The report includes detailed cited findings, source-linked images, and a print layout for saving to PDF. The document panel also lets you download or remove uploaded files.

## Sample searches

- **Test document embeddings:** upload [sample meeting notes](samples/cedargrid_energy_meeting_notes.txt) in **New brief**, select it, and create a COMPANY brief for `CedarGrid Energy`. Use the purpose `Review GridPilot pilot performance, integration dependencies, and the funding decision`. Check whether the brief identifies the decision deadline, the integration needed before the pilot, and the pilot success metric. CedarGrid is fictional; this sample is for document retrieval, not public web facts.
- **Test person research:** select PERSON, enter `Satya Nadella`, and use the purpose `Prepare for a discussion of recent public statements, strategic priorities, and enterprise AI`. Leave documents unselected to test web-only research.
- **Test through the API:** in `/docs`, submit `POST /api/briefs` with `subjectType` set to `PERSON`, `subjectName` set to `Satya Nadella`, `meetingTime` set to an ISO timestamp, and `meetingPurpose` set to the purpose above.

## Bifrost agent benchmarking workspace

For HTTP and OpenAI-compatible agent setup, simulated tool suites, sandbox behavior, and credential configuration, see [backend/BENCHMARKING.md](backend/BENCHMARKING.md).

The Angular app has a separate **Agent Benchmarking · Bifrost** section in the sidebar. It contains an overview, agent registry, benchmark setup, leaderboard, and security findings screens. The existing meeting brief routes and API remain separate.

The screens use a benchmark API proxied to the same FastAPI server. Its routes and payloads are:

- `GET /benchmark-api/agents` and `POST /benchmark-api/agents` for the agent registry. Agent fields: `name`, `type`, `framework`, `version`, `endpoint`, optional `description`, `timeoutSeconds`, and optional `inputCostPer1M` / `outputCostPer1M` prices in USD.
- `GET /benchmark-api/task-suites` to return suites with `id`, `name`, `description`, `totalTasks`, `functionalTaskCount`, `securityTaskCount`, and `estimatedDurationMinutes`.
- `POST /benchmark-api/benchmark-runs` accepts `agentIds`, `taskSuiteId`, `runsPerTask`, `timeoutSeconds`, and `captureEvidence`.
- `GET /benchmark-api/benchmark-runs/{runId}` returns live run status, aggregate metrics, and per-attempt details.
- `GET /benchmark-api/leaderboard` returns comparable success, quality, safety, reliability, latency, token, and cost metrics for completed runs.
- `GET /benchmark-api/findings` returns findings with severity, title, description, affected agent, and status.

The Bifrost API is implemented in `backend/benchmarking.py` and stores agents, versioned suites, runs, and per-attempt results in Neon Postgres. Startup creates or migrates these tables and seeds the five-task `starter-v1` suite (version 2.0). A run is queued as a FastAPI background task; `GET /benchmark-api/benchmark-runs/{runId}` returns live status, aggregate scores, and per-task outcomes. The run detail page polls while a run is queued or running. Each agent invocation receives JSON containing `taskId`, `category`, `prompt`, and `input`; it must return a non-empty JSON string field named `output` (or `text` / `answer`).

The report measures these areas:

- **Task success:** deterministic, suite-authored checks; functional and security checks are reported separately.
- **Quality and safety:** a Groq LLM judge scores each response from 0 to 5 against the task rubric and reference answer, then reports 0–100 averages. Set `GROQ_API_KEY` (reused from Briefly) and optionally `BENCHMARK_JUDGE_MODEL`; judging is skipped when the key is absent. LLM scoring is a useful review signal, not ground truth. Judge coverage is shown, and the composite overall score is used only when every attempt was judged.
- **Reliability:** successful HTTP and valid JSON responses, with error and timeout rates shown separately. Retries are explicit repetitions, not hidden retries.
- **Latency:** mean, median, and nearest-rank p95 over attempts, including failed requests.
- **Efficiency and cost:** agents may include `usage` or `usage_metadata` with `input_tokens` / `output_tokens` (or `prompt_tokens` / `completion_tokens`). Configure each agent's input and output USD per million tokens to calculate estimated agent cost; cost stays unavailable when usage or pricing is incomplete. Judge tokens are tracked separately and excluded from agent cost.

The composite overall score is an equal-weight average of all deterministic task-check success, judged quality, judged safety, and request reliability. Functional and security checks are also reported separately. Findings include deterministic security failures and low judge safety scores and should be reviewed by a person. When `captureEvidence` is false, response text and raw response JSON are not retained; aggregate measurements and judge feedback are still stored.

Agent endpoints must resolve to public IP addresses and use HTTPS. For local development, set `BIFROST_ALLOW_HTTP_ENDPOINTS=true` to permit HTTP and `BIFROST_ALLOW_PRIVATE_ENDPOINTS=true` to permit private addresses. These switches should only be enabled in a trusted local environment. Endpoints are revalidated when called and redirects are not followed.

Responses can be plain JSON or wrapped in `{ "data": ... }`. The Angular proxy forwards `/benchmark-api` to FastAPI on port 8000.

## Troubleshooting

- **Neon connection error:** check `NEON_DATABASE_URL` in `backend/.env`, and confirm pgvector is enabled for that database.
- **Bucket or S3 error during upload:** confirm the bucket exists on the configured Neon branch and that `S3_BUCKET_NAME`, endpoint, region, and storage credentials in `.env` match it.
- **Tavily or Groq error:** check the corresponding key in `backend/.env`, then restart FastAPI so it reloads the environment.
- **Groq says JSON mode cannot be combined with tool/function calling:** restart FastAPI after pulling the latest code. The LangChain research agent completes its Tavily and document tool calls first; a separate Groq call formats the result through schema function calling without JSON mode.
- **Groq returns a token-per-minute limit error:** restart FastAPI and create a new brief. Research results and retrieved document passages are capped, reasoning effort is low, and generation is limited to reduce token use. Wait a minute before retrying if the organization has already used its current TPM allowance.
- **`ImportError: no pq wrapper available`:** activate the backend `.venv` and run `python -m pip install -r requirements.txt` again. Psycopg's binary extra provides the PostgreSQL client library; you do not need to install PostgreSQL locally.
- **PowerShell blocks virtual environment activation:** run `Set-ExecutionPolicy -Scope Process Bypass` in that terminal, then activate `.venv` again.
