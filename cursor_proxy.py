"""
cursor-proxy: Wraps the Cursor CLI agent binary into an OpenAI-compatible
/v1/chat/completions endpoint so any OpenAI-SDK app can use a Cursor API key.

The Cursor agent runs in full autonomous agent mode (gpt-5.5, --force).
A short preamble prepended to every prompt tells the agent to skip parallel-cli
and use its built-in WebSearch/WebFetch instead.

Usage:
  CURSOR_API_KEY=crsr_xxx python cursor_proxy.py
  # Then set OPENAI_BASE_URL=http://localhost:8990/v1 in your app
"""

import asyncio
import json
import os
import shutil
import tempfile
import time
import uuid
from typing import Optional

import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel

# ── Config ────────────────────────────────────────────────────────────────────

PORT           = int(os.getenv("CURSOR_PROXY_PORT", 8990))
CURSOR_API_KEY = os.getenv("CURSOR_API_KEY", "")
DEFAULT_MODEL  = os.getenv("CURSOR_MODEL", "gpt-5.5")
AGENT_TIMEOUT  = int(os.getenv("CURSOR_AGENT_TIMEOUT", 600))  # cursor agent runs for several minutes

AGENT_BIN = (
    shutil.which("agent")
    or os.path.expanduser("~/.local/bin/agent")
)

# Prepended to every prompt so the agent skips parallel-cli
_NO_PARALLEL = (
    "[IMPORTANT] Do NOT use parallel-cli, /parallel-setup, /parallel-search, "
    "or any parallel.ai commands — they are not installed. "
    "Use your built-in WebSearch and WebFetch tools for any web research.\n\n"
)

app = FastAPI(title="Cursor OpenAI Proxy", version="3.0.0")

# ── Schemas ───────────────────────────────────────────────────────────────────

class Message(BaseModel):
    role: str
    content: Optional[str] = None
    tool_calls: Optional[list] = None
    tool_call_id: Optional[str] = None

class ChatRequest(BaseModel):
    model: Optional[str] = DEFAULT_MODEL
    messages: list[Message]
    tools: Optional[list] = None
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = None
    stream: Optional[bool] = False

# ── Core: call Cursor CLI in full agent mode ──────────────────────────────────

def messages_to_prompt(messages: list[Message]) -> str:
    """Flatten message history into a single prompt string."""
    parts = []
    for m in messages:
        content = m.content or ""
        if m.role == "system":
            parts.append(f"[System]\n{content}")
        elif m.role == "user":
            parts.append(content)
        elif m.role == "assistant":
            if content:
                parts.append(f"[Assistant]\n{content}")
        elif m.role == "tool":
            parts.append(f"[Tool result]\n{content}")
    return "\n\n".join(parts)


async def call_cursor(prompt: str, model: str, api_key: str) -> str:
    """Spawn the Cursor agent binary and return the text response."""
    if not AGENT_BIN or not os.path.exists(AGENT_BIN):
        raise RuntimeError(
            f"Cursor agent binary not found at: {AGENT_BIN}\n"
            "Install: curl https://cursor.com/install -fsS | bash"
        )

    workspace = tempfile.mkdtemp(prefix="cursor-proxy-")
    try:
        env = {**os.environ, "CURSOR_API_KEY": api_key}
        proc = await asyncio.create_subprocess_exec(
            AGENT_BIN, "-p",
            "--output-format", "json",
            "--force",
            "--workspace", workspace,
            "--model", model,
            _NO_PARALLEL + prompt,
            env=env,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=AGENT_TIMEOUT)
        except asyncio.TimeoutError:
            proc.kill()
            raise RuntimeError(f"Cursor agent timed out after {AGENT_TIMEOUT}s — increase CURSOR_AGENT_TIMEOUT env var")

        if proc.returncode != 0:
            raise RuntimeError(f"Cursor agent exited {proc.returncode}: {stderr.decode()[:400]}")

        raw = stdout.decode().strip()
        try:
            wrapper = json.loads(raw)
            text = (
                wrapper.get("result")
                or wrapper.get("message", {}).get("content", [{}])[0].get("text")
                or raw
            )
        except (json.JSONDecodeError, IndexError):
            text = raw

        return text if isinstance(text, str) else json.dumps(text)
    finally:
        shutil.rmtree(workspace, ignore_errors=True)

# ── OpenAI-compatible endpoints ───────────────────────────────────────────────

def make_response(content: str, model: str) -> dict:
    tokens = len(content.split())
    return {
        "id": f"chatcmpl-{uuid.uuid4().hex[:12]}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": model,
        "choices": [{
            "index": 0,
            "message": {"role": "assistant", "content": content},
            "finish_reason": "stop",
        }],
        "usage": {"prompt_tokens": 0, "completion_tokens": tokens, "total_tokens": tokens},
    }


@app.post("/v1/chat/completions")
async def chat_completions(request: Request):
    body = await request.json()
    req = ChatRequest(**body)

    auth = request.headers.get("Authorization", "")
    api_key = auth.replace("Bearer ", "").strip() or CURSOR_API_KEY
    if not api_key:
        raise HTTPException(status_code=401, detail="No Cursor API key. Set CURSOR_API_KEY env or pass Authorization header.")

    model = req.model or DEFAULT_MODEL
    prompt = messages_to_prompt(req.messages)

    try:
        content = await call_cursor(prompt, model, api_key)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if req.stream:
        def gen():
            chunk = {
                "id": f"chatcmpl-{uuid.uuid4().hex[:12]}",
                "object": "chat.completion.chunk",
                "created": int(time.time()),
                "model": model,
                "choices": [{"index": 0, "delta": {"content": content}, "finish_reason": None}],
            }
            yield f"data: {json.dumps(chunk)}\n\n"
            done = {**chunk, "choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}]}
            yield f"data: {json.dumps(done)}\n\n"
            yield "data: [DONE]\n\n"
        return StreamingResponse(gen(), media_type="text/event-stream")

    return JSONResponse(make_response(content, model))


@app.get("/v1/models")
async def list_models():
    return {
        "object": "list",
        "data": [
            {"id": "gpt-5.5",        "object": "model", "created": 0, "owned_by": "cursor"},
            {"id": "auto",           "object": "model", "created": 0, "owned_by": "cursor"},
            {"id": "gpt-5.3-codex",  "object": "model", "created": 0, "owned_by": "cursor"},
        ],
    }


@app.get("/health")
async def health():
    return {"status": "ok", "agent_bin": AGENT_BIN, "model": DEFAULT_MODEL}


if __name__ == "__main__":
    print(f"🔁 Cursor Proxy v3 → http://localhost:{PORT}/v1")
    print(f"   agent: {AGENT_BIN}  model: {DEFAULT_MODEL}")
    print(f"   key:   {'set' if CURSOR_API_KEY else 'NOT SET'}")
    uvicorn.run(app, host="127.0.0.1", port=PORT)
