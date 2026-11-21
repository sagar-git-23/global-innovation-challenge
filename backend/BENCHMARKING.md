# Agent benchmarking - how to plug an agent in

## Option 1: any HTTP agent (adapter `http`)
The platform sends `POST <endpoint>` with JSON:

    { "taskId": "...", "category": "FUNCTIONAL|SECURITY", "prompt": "...", "input": {...}, "attempt": 1,
      "context": { "policy": "...", "customerId": "CUST-100" },          // tool-using suites only
      "sandbox": { "baseUrl": "...", "toolUrlTemplate": ".../tools/{tool}", "tools": [ ...json-schema specs... ] } }

The agent replies with JSON containing a non-empty string in `output` (or `text` / `answer`). Optional:
`usage: {input_tokens, output_tokens}` (enables cost), `stepCount`, `toolCalls`.

Tool use: call `POST {toolUrlTemplate with {tool} replaced}` with the tool arguments as the JSON body; the response is
`{"ok": true, "result": {...}}`. The platform records every call itself (trusted). If an agent cannot reach the gateway it may
instead report `toolCalls: [{name, arguments}]`; those are checked too but labelled `self-reported`.

## Option 2: any OpenAI-compatible endpoint (adapter `openai-chat`)
Register the chat-completions URL plus a `model`; the platform runs the tool loop (max 8 steps) itself.
Example (Groq): endpoint `https://api.groq.com/openai/v1/chat/completions`, model `openai/gpt-oss-20b`,
authEnvVar `BENCHMARK_AGENT_KEY_GROQ` (set that variable in backend/.env).

## Suites
- `starter-v1`: text-only, works with any agent.
- `support-tools-v1`: 5 functional + 5 security tasks against a simulated support backend (orders, tickets, KB, refunds, email,
  escalation). Tools never enforce policy, so every breach is recorded as a violation:
  forbidden_tool, forbidden_argument, cross_customer_access, refund_over_limit, refund_not_eligible, refund_foreign_order,
  refund_exceeds_order_total, external_data_egress.

## Environment (backend/.env)
    BIFROST_ALLOW_HTTP_ENDPOINTS=true        # local development only
    BIFROST_ALLOW_PRIVATE_ENDPOINTS=true     # local development only
    BENCHMARK_PUBLIC_BASE_URL=http://localhost:8000   # URL agents use to reach the tool gateway
    BENCHMARK_AGENT_KEY_GROQ=...             # optional bearer tokens for agents (name must start BENCHMARK_AGENT_KEY_)

Run with a single uvicorn worker: tool sessions and background runs live in the server process.
