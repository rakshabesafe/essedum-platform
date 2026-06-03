"""
Basic test script for Ollama LLM calls via OllamaConnector.

Usage:
    python test_ollama.py
    python test_ollama.py --model qwen3:27b
"""
import asyncio
import argparse
import sys
import time

# ---------------------------------------------------------------------------
# Config: edit these or pass --model / --url on the command line
# ---------------------------------------------------------------------------
DEFAULT_MODEL = "qwen3.6:27b"
DEFAULT_URL = "http://localhost:11434/v1"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def ok(msg: str) -> None:
    print(f"  [✓] {msg}")

def fail(msg: str) -> None:
    print(f"  [✗] {msg}")

def section(title: str) -> None:
    print(f"\n=== {title} ===")


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------
async def test_list_models(base_url: str) -> list[str]:
    section("Test 1: List available Ollama models")
    from openai import AsyncOpenAI
    client = AsyncOpenAI(base_url=base_url, api_key="ollama")
    try:
        models_resp = await client.models.list()
        models = [m.id for m in models_resp.data]
        if models:
            ok(f"Found {len(models)} model(s): {models}")
        else:
            fail("No models returned — is Ollama running?")
        return models
    except Exception as exc:
        fail(f"Could not connect to Ollama at {base_url}: {exc}")
        return []


async def test_simple_chat(base_url: str, model: str) -> bool:
    section(f"Test 2: Simple chat completion ({model})")
    from openai import AsyncOpenAI
    client = AsyncOpenAI(base_url=base_url, api_key="ollama")
    # /no_think disables extended thinking on qwen3 and similar models
    messages = [
        {"role": "system", "content": "You are a helpful assistant. Reply concisely. /no_think"},
        {"role": "user", "content": "Say 'Hello from Ollama!' and nothing else."},
    ]
    try:
        t0 = time.monotonic()
        response = await client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.0,
            max_tokens=200,
        )
        elapsed = time.monotonic() - t0
        msg = response.choices[0].message
        content = msg.content or ""
        # Some thinking models put output in reasoning_content / thinking
        thinking = getattr(msg, "reasoning_content", None) or getattr(msg, "thinking", None) or ""
        ok(f"Response received in {elapsed:.2f}s")
        ok(f"Content: {content.strip()!r}")
        if thinking:
            ok(f"Thinking (first 80 chars): {thinking.strip()[:80]!r}")
        ok(f"Finish reason: {response.choices[0].finish_reason}")
        ok(f"Usage: prompt={response.usage.prompt_tokens} completion={response.usage.completion_tokens} tokens")
        return True
    except Exception as exc:
        fail(f"Chat completion failed: {exc}")
        return False


async def test_connector_class(model: str) -> bool:
    section(f"Test 3: OllamaConnector.chat() ({model})")
    import os, sys
    sys.path.insert(0, os.path.dirname(__file__))
    # Override env so config picks up correct URL before import
    from app.engine.connectors.ollama import OllamaConnector
    connector = OllamaConnector()
    try:
        t0 = time.monotonic()
        reply = await connector.chat(
            model=model,
            messages=[
                {"role": "system", "content": "/no_think"},
                {"role": "user", "content": "What is 2 + 2? Reply with just the number."},
            ],
            temperature=0.0,
            max_tokens=200,
        )
        elapsed = time.monotonic() - t0
        ok(f"OllamaConnector.chat() returned in {elapsed:.2f}s")
        ok(f"Reply: {reply.strip()!r}")
        return True
    except Exception as exc:
        fail(f"OllamaConnector.chat() failed: {exc}")
        return False


async def test_streaming(base_url: str, model: str) -> bool:
    section(f"Test 4: Streaming chat ({model})")
    from openai import AsyncOpenAI
    client = AsyncOpenAI(base_url=base_url, api_key="ollama")
    messages = [
        {"role": "system", "content": "/no_think"},
        {"role": "user", "content": "Count from 1 to 5, one number per line."},
    ]
    chunks_received = 0
    full_text = ""
    try:
        t0 = time.monotonic()
        stream = await client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.0,
            max_tokens=200,
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                full_text += delta
                chunks_received += 1
        elapsed = time.monotonic() - t0
        ok(f"Streaming completed in {elapsed:.2f}s — {chunks_received} chunks")
        ok(f"Full response: {full_text.strip()!r}")
        return True
    except Exception as exc:
        fail(f"Streaming failed: {exc}")
        return False


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
async def main(model: str, url: str) -> int:
    print(f"\nOllama LLM Test  |  url={url}  model={model}")
    print("=" * 60)

    passed = 0
    total = 0

    available_models = await test_list_models(url)

    total += 1
    if await test_simple_chat(url, model):
        passed += 1

    total += 1
    if await test_connector_class(model):
        passed += 1

    total += 1
    if await test_streaming(url, model):
        passed += 1

    print(f"\n{'=' * 60}")
    print(f"Results: {passed}/{total} tests passed")
    if passed == total:
        print("All Ollama tests passed ✓")
    else:
        print("Some tests failed — check output above")
    print("=" * 60)
    return 0 if passed == total else 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test Ollama LLM integration")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Ollama model name")
    parser.add_argument("--url", default=DEFAULT_URL, help="Ollama base URL")
    args = parser.parse_args()
    sys.exit(asyncio.run(main(args.model, args.url)))
