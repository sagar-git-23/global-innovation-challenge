# Briefly + Bifrost

Briefly creates sourced pre-meeting briefs about people and companies. Bifrost benchmarks AI agents against repeatable functional and security task suites. Both experiences use an Angular frontend and a FastAPI backend.

## Prerequisites

- Node.js 22.22.3 or newer in the 22.x line, or 24.15.0 or newer in the 24.x line, with npm
- Python 3.10 or newer
- A Neon project with Postgres, pgvector, and an Object Storage bucket
- Tavily and Groq API keys

## One-time Neon setup

1. In the Neon SQL Editor for the app database, enable pgvector:

        CREATE EXTENSION IF NOT EXISTS vector;

2. Create a private Neon Object Storage bucket named briefly-meeting-documents on the same branch as the database.
3. Configure backend/.env with NEON_DATABASE_URL, TAVILY_API_KEY, GROQ_API_KEY, AWS_ENDPOINT_URL_S3, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, and S3_BUCKET_NAME. Keep real credentials in this ignored file, never in frontend or source files.
4. No local PostgreSQL server is needed. The backend connects to Neon using Psycopg’s bundled binary driver.

The backend creates its Postgres tables on startup. FastEmbed downloads its embedding model the first time a document is uploaded.

## Run on Windows

Start the backend in PowerShell terminal 1, from the project root:

        cd backend
        py -m venv .venv
        .\.venv\Scripts\Activate.ps1
        python -m pip install -r requirements.txt
        uvicorn main:app --reload --port 8000

If backend/.venv already exists, activate it and install dependencies with:

        cd backend
        .\.venv\Scripts\Activate.ps1
        python -m pip install -r requirements.txt

Start the Angular frontend in PowerShell terminal 2, from the project root:

        cd frontend-v2
        npm install
        npm start

Open http://localhost:4200. FastAPI’s interactive API documentation is at http://localhost:8000/docs. The frontend includes a dark theme toggle and remembers the selected theme in the browser.

## Briefly meeting briefs

In Generate Brief, optionally add PDF, DOCX, or TXT files up to 10 MB. The original file is saved to Neon Object Storage; extracted text and embeddings are stored in Neon Postgres. Select documents to include alongside Tavily research. Briefs contain sourced findings, source-linked images, open questions, and a print layout. The document library lets you download or remove uploaded files.

A fictional sample document is available at samples/cedargrid_energy_meeting_notes.txt for testing document retrieval.

## Bifrost agent benchmarking

Bifrost is available in the same frontend under Agent Benchmarking. Register agents, select a task suite, follow run progress, review the leaderboard, and inspect security findings and observed tool activity.

### Agent connection types

- HTTP adapter: register a running HTTP endpoint that accepts a JSON task containing taskId, category, prompt, and input. It must return JSON with a non-empty output, text, or answer string. Tool-using tasks also include sandbox gateway details.
- OpenAI-compatible chat adapter: register the chat-completions URL and model name. Bifrost runs the tool loop for the agent when the selected suite uses tools.
- Optional bearer credentials are read from a server-side environment variable named with the BENCHMARK_AGENT_KEY_ prefix. Enter only that variable name in the frontend, never the secret value.

Agent endpoints must use HTTPS and resolve to public IP addresses by default. For trusted local development only, add these flags to backend/.env, then restart FastAPI:

        BIFROST_ALLOW_HTTP_ENDPOINTS=true
        BIFROST_ALLOW_PRIVATE_ENDPOINTS=true

Use Test connection in Agent Registry before starting a benchmark. A GitHub repository URL is source code, not a running agent endpoint.

### Task suites and sample agents

- starter-v1 tests general task handling, uncertainty, formatting, and prompt-injection resistance.
- support-tools-v1 tests customer-support workflows against a simulated support system. The sandbox records tool calls and policy violations; it does not perform real refunds, emails, or other customer actions.

The local mock HTTP agents in samples/mock_benchmark_agents.js are useful for exercising different behaviors. Start them in a separate terminal from the project root:

        node samples/mock_benchmark_agents.js

The server listens on 127.0.0.1:9000 and provides /balanced, /weak, /unsafe, /slow, and /flaky routes. Register each route as its own HTTP agent, for example http://127.0.0.1:9000/balanced. Keep the mock server running while testing. The /unsafe, /slow, and /flaky routes intentionally demonstrate security failures, timeouts, and intermittent errors.

The included FastAPI reference agent can also be run from the backend directory:

        cd backend
        $env:AGENT_MODE="careful"
        python -m uvicorn demo_agent:app --port 8101

Register it at http://127.0.0.1:8101/api/invoke. The careful mode follows the simulated support policy.

### Bifrost API

The API is proxied through the frontend to FastAPI on port 8000.

- GET and POST /benchmark-api/agents manage agents; POST /benchmark-api/agents/{agentId}/test checks connectivity.
- GET /benchmark-api/task-suites lists suites; GET /benchmark-api/tool-specs lists sandbox tools.
- POST /benchmark-api/benchmark-runs starts one run per selected agent.
- GET /benchmark-api/benchmark-runs and GET /benchmark-api/benchmark-runs/{runId} return run summaries and detailed results.
- POST /benchmark-api/benchmark-runs/{runId}/cancel cancels an active run.
- GET /benchmark-api/leaderboard and GET /benchmark-api/findings return comparison and security results.
- POST /benchmark-api/sandbox/{token}/tools/{toolName} is the temporary gateway for tool-using tasks.

Run reports include task success, reliability, latency, token use, cost coverage, judge quality and safety scores when judging is configured, repeated-run consistency, tool activity, and policy violations. The judge uses GROQ_API_KEY and optionally BENCHMARK_JUDGE_MODEL. When captureEvidence is disabled, raw agent responses and tool arguments are not retained.

For adapter payloads, authentication setup, sandbox behavior, and suite details, see backend/BENCHMARKING.md.

## Troubleshooting

- Neon connection error: check NEON_DATABASE_URL and confirm pgvector is enabled.
- Storage error during upload: verify the private bucket name and S3-compatible settings in backend/.env.
- Agent connection refused: start the agent server and verify its host, port, and path. Run Test connection in Agent Registry.
- HTTP or localhost agent rejected: confirm both local-development flags are set in backend/.env, then restart FastAPI. Keep those flags for trusted local development only.
- Missing PostgreSQL wrapper: activate backend/.venv and run python -m pip install -r requirements.txt.
- PowerShell blocks virtual environment activation: run Set-ExecutionPolicy -Scope Process Bypass in that terminal, then activate .venv again.