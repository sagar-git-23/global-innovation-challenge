"""Agent adapters: how the platform talks to an agent. Standard library only.

adapter "http"        - POST the task to the agent endpoint; the agent returns {"output": ...}. If the task offers tools,
                        the payload carries a sandbox gateway the agent can call; calls are recorded server-side.
adapter "openai-chat" - the platform runs the tool loop itself against any OpenAI-compatible chat-completions URL.
"""
from __future__ import annotations

import ipaddress
import json
import os
import socket
import time
from typing import Any
from urllib.error import HTTPError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

from benchmark_sandbox import POLICY, TOOL_SPECS, SandboxSession, scan_call, build_scenario

MAX_RESPONSE_BYTES = 1_000_000
MAX_HARNESS_STEPS = 8
SIDE_EFFECT_STEP_TYPES = {"tool", "tool_call", "action"}


def safe_endpoint(value: str) -> str:
    parsed = urlsplit(value)
    if parsed.scheme != "https" and not (parsed.scheme == "http" and os.getenv("BIFROST_ALLOW_HTTP_ENDPOINTS", "false").lower() == "true"):
        raise ValueError("Agent endpoints must use HTTPS. HTTP is allowed only when BIFROST_ALLOW_HTTP_ENDPOINTS=true for local development.")
    if not parsed.hostname or parsed.username or parsed.password:
        raise ValueError("Endpoint must have a hostname and cannot contain embedded credentials.")
    try:
        addresses = {ipaddress.ip_address(item[4][0]) for item in socket.getaddrinfo(
            parsed.hostname, parsed.port or (443 if parsed.scheme == "https" else 80), type=socket.SOCK_STREAM)}
    except OSError as exc:
        raise ValueError("Endpoint hostname did not resolve.") from exc
    allow_private = os.getenv("BIFROST_ALLOW_PRIVATE_ENDPOINTS", "false").lower() == "true"
    if not addresses or (not allow_private and any(not address.is_global for address in addresses)):
        raise ValueError("Agent endpoints must resolve only to public IP addresses.")
    return value


class _NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):  # noqa: D401
        raise HTTPError(req.full_url, code, "Redirects are not followed for agent endpoints", headers, None)


def public_base_url() -> str:
    return os.getenv("BENCHMARK_PUBLIC_BASE_URL", "http://localhost:8000").rstrip("/")


def auth_headers(env_name: str | None) -> dict[str, str]:
    """Bearer token read from a server-side env var; names are restricted to BENCHMARK_AGENT_KEY_* at registration."""
    value = os.getenv(env_name) if env_name else None
    return {"Authorization": f"Bearer {value}"} if value else {}


def post_json(endpoint: str, payload: dict, timeout: float, headers: dict[str, str] | None = None) -> tuple[Any, int]:
    endpoint = safe_endpoint(endpoint)
    request = Request(endpoint, data=json.dumps(payload).encode(), method="POST",
                      headers={"Content-Type": "application/json", "Accept": "application/json", **(headers or {})})
    started = time.monotonic()
    with build_opener(_NoRedirect()).open(request, timeout=timeout) as response:
        raw = response.read(MAX_RESPONSE_BYTES + 1)
    latency = int((time.monotonic() - started) * 1000)
    if len(raw) > MAX_RESPONSE_BYTES:
        raise ValueError("Agent response exceeded the 1 MB limit.")
    return json.loads(raw.decode("utf-8")), latency


def extract_output(body: dict) -> str:
    output = body.get("output", body.get("text", body.get("answer")))
    if not isinstance(output, str) or not output.strip():
        raise ValueError("Agent response must include a non-empty string in output, text, or answer.")
    return output


def invoke_http(agent: dict, task: dict, session: SandboxSession | None, attempt: int, timeout: float) -> tuple[dict, int]:
    payload: dict[str, Any] = {"taskId": task["id"], "category": task["category"], "prompt": task["prompt"],
                               "input": task.get("input", {}), "attempt": attempt}
    if session:
        base = f"{public_base_url()}/benchmark-api/sandbox/{session.token}"
        payload["context"] = {"policy": POLICY, "customerId": session.scenario["customerId"]}
        payload["sandbox"] = {"baseUrl": base, "toolUrlTemplate": base + "/tools/{tool}", "tools": TOOL_SPECS}
    parsed, latency = post_json(agent["endpoint"], payload, timeout, auth_headers(agent.get("auth_env_var")))
    if not isinstance(parsed, dict):
        raise ValueError("Agent response must be a JSON object with an output field.")
    extract_output(parsed)
    return parsed, latency


def invoke_openai_chat(agent: dict, task: dict, session: SandboxSession | None, timeout: float) -> tuple[dict, int]:
    if not agent.get("model"):
        raise ValueError("The openai-chat adapter requires a model name.")
    started = time.monotonic()
    deadline = started + timeout
    messages: list[dict] = ([{"role": "system", "content": POLICY}] if session else []) + [{"role": "user", "content": task["prompt"]}]
    tools = [{"type": "function", "function": spec} for spec in TOOL_SPECS] if session else None
    tokens_in = tokens_out = steps = 0
    have_usage, output, finished = False, "", False
    for _ in range(MAX_HARNESS_STEPS):
        remaining = deadline - time.monotonic()
        if remaining <= 0:
            raise TimeoutError("Agent exceeded the time limit.")
        request_body: dict[str, Any] = {"model": agent["model"], "messages": messages, "temperature": 0}
        if tools:
            request_body.update(tools=tools, tool_choice="auto")
        reply, _ = post_json(agent["endpoint"], request_body, max(1.0, remaining), auth_headers(agent.get("auth_env_var")))
        try:
            message = reply["choices"][0]["message"]
        except (KeyError, IndexError, TypeError) as exc:
            raise ValueError("Unexpected chat-completions response shape.") from exc
        usage = reply.get("usage") or {}
        if usage:
            have_usage = True
            tokens_in += int(usage.get("prompt_tokens") or 0)
            tokens_out += int(usage.get("completion_tokens") or 0)
        steps += 1
        calls = message.get("tool_calls") or []
        if not calls or session is None:
            output, finished = message.get("content") or "", True
            break
        messages.append({"role": "assistant", "content": message.get("content") or "", "tool_calls": calls})
        for call in calls:
            function = call.get("function") or {}
            name = function.get("name", "")
            try:
                args = json.loads(function.get("arguments") or "{}")
            except ValueError:
                args = {}
            try:
                result = session.call(name, args if isinstance(args, dict) else {})
            except KeyError:
                result = {"error": f"UNKNOWN_TOOL:{name}"}
            messages.append({"role": "tool", "tool_call_id": call.get("id", ""), "content": json.dumps(result)})
    if not finished:
        output = "(The agent stopped at the step limit without giving a final answer.)"
    if not output.strip():
        raise ValueError("Agent response must include a non-empty answer.")
    body = {"output": output, "stepCount": steps}
    if have_usage:
        body["usage"] = {"input_tokens": tokens_in, "output_tokens": tokens_out}
    return body, int((time.monotonic() - started) * 1000)


def invoke_agent(agent: dict, task: dict, session: SandboxSession | None, attempt: int, timeout: float) -> tuple[dict, int]:
    if agent.get("adapter") == "openai-chat":
        return invoke_openai_chat(agent, task, session, timeout)
    return invoke_http(agent, task, session, attempt, timeout)


def ping_agent(agent: dict, timeout: float) -> tuple[dict, int]:
    task = {"id": "connection-test", "category": "FUNCTIONAL", "prompt": "Reply with the single word: ready", "input": {}}
    return invoke_agent(agent, task, None, 1, timeout)


def _normalise_reported(item: Any) -> dict | None:
    if not isinstance(item, dict):
        return None
    function = item.get("function") if isinstance(item.get("function"), dict) else {}
    name = item.get("tool") or item.get("name") or item.get("toolName") or function.get("name")
    if not isinstance(name, str) or not name:
        return None
    args = item.get("arguments", item.get("args", item.get("input", function.get("arguments", {}))))
    if isinstance(args, str):
        try:
            args = json.loads(args)
        except ValueError:
            args = {}
    return {"tool": name, "arguments": args if isinstance(args, dict) else {}, "result": item.get("result", item.get("output"))}


def resolve_trajectory(task: dict, session: SandboxSession | None, body: dict) -> tuple[list[dict], list[dict], str]:
    """Return (tool calls, violations, source). Gateway-observed calls are trusted over self-reported ones."""
    if session and session.calls:
        return list(session.calls), list(session.violations), "gateway"
    reported = body.get("toolCalls") or body.get("tool_calls") or [
        s for s in (body.get("steps") or []) if isinstance(s, dict) and s.get("type") in SIDE_EFFECT_STEP_TYPES]
    calls: list[dict] = []
    for item in reported if isinstance(reported, list) else []:
        normal = _normalise_reported(item)
        if normal:
            calls.append({"seq": len(calls) + 1, **normal, "source": "self-reported"})
    if not calls:
        return [], [], "none"
    canary = session.canary if session else ""
    scenario = session.scenario if session else build_scenario(task, canary)
    violations = []
    for call in calls:
        violations.extend({**found, "seq": call["seq"]} for found in scan_call(scenario, task.get("checks", {}), call["tool"], call["arguments"]))
    return calls, violations, "self-reported"
