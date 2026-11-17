"""
Archon Core — LLM Client

Shared OpenRouter LLM instance used by ALL agents across ALL pipelines.
Uses OpenAI-compatible API via OpenRouter.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import re
from dotenv import load_dotenv
from openai import AsyncOpenAI

env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(env_path)

logger = logging.getLogger("archon.core.llm")

# Module-level async client (reused across calls)
_client: AsyncOpenAI | None = None

MAX_RETRIES = 3
RETRY_BACKOFF = 2  # seconds, doubles each retry
DEFAULT_MODEL = "nvidia/nemotron-3.5-super-vl:free"
DEFAULT_FALLBACKS = (
    "inclusionai/ling-3.2-flash:free",
    "google/gemma-4-31b-it:free",
    "openrouter/free",
)


def get_model_config() -> dict:
    model = os.getenv("OPENROUTER_MODEL", "").strip() or DEFAULT_MODEL
    fallbacks = os.getenv("OPENROUTER_FALLBACK_MODELS", ",".join(DEFAULT_FALLBACKS))
    models = list(dict.fromkeys([model, *(m.strip() for m in fallbacks.split(",") if m.strip())]))
    return {
        "model": model,
        "models": models[1:],
        "provider": {"max_price": {"prompt": 0, "completion": 0}},
        "reasoning": {"enabled": False},
        "max_tokens": int(os.getenv("OPENROUTER_MAX_TOKENS", "16384")),
    }

JSON_SYSTEM_MESSAGE = (
    "You are a precise code generation assistant. You MUST respond with ONLY valid JSON. "
    "No markdown fences, no explanatory text before or after the JSON, no code blocks. "
    "Your entire response must be parseable by JSON.parse(). "
    "If the prompt asks for a JSON array, respond with a JSON array starting with [ and ending with ]. "
    "If the prompt asks for a JSON object, respond with a JSON object starting with { and ending with }."
)


def _get_client() -> AsyncOpenAI:
    """Return (and cache) an AsyncOpenAI client pointed at OpenRouter."""
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENROUTER_API"),
            max_retries=0,
        )
    return _client


def clean_json_response(text: str) -> str:
    """Strip markdown code fences and noise from LLM JSON responses."""
    text = re.sub(r"```(?:json)?\s*", "", text)
    text = re.sub(r"```\s*$", "", text)
    return text.strip()


def parse_json_response(text: str) -> dict | list:
    """Parse JSON from LLM response, handling common formatting issues."""
    cleaned = clean_json_response(text)

    # Try direct parse first
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Try to extract JSON array or object from surrounding text
    # Try array first (more specific), then object
    for pattern in [r"(\[[\s\S]*\])", r"(\{[\s\S]*\})"]:
        json_match = re.search(pattern, cleaned)
        if json_match:
            try:
                return json.loads(json_match.group(1))
            except json.JSONDecodeError:
                continue

    logger.error(
        "❌ Failed to parse JSON from LLM response. "
        f"First 800 chars:\n{text[:800]}"
    )
    raise ValueError(f"Could not parse JSON from LLM response:\n{text[:500]}")


async def invoke_llm(
    prompt: str,
    temperature: float = 0.2,
    system_message: str | None = None,
) -> str:
    """Invoke OpenRouter LLM with a prompt, with retry logic."""
    client = _get_client()
    config = get_model_config()
    model = config.pop("model")

    messages = []
    if system_message:
        messages.append({"role": "system", "content": system_message})
    messages.append({"role": "user", "content": prompt})

    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            logger.info(f"🤖 LLM call (attempt {attempt}/{MAX_RETRIES}, model={model})")
            response = await client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                extra_body=config,
                timeout=600.0,
            )
            content = response.choices[0].message.content
            if not content or not content.strip():
                raise ValueError("LLM returned empty response")
            logger.info("LLM response served by %s", response.model)
            return content
        except Exception as e:
            last_error = e
            logger.warning(
                f"⚠️  LLM call attempt {attempt} failed: {e}"
            )
            if attempt < MAX_RETRIES:
                wait = RETRY_BACKOFF * attempt
                logger.info(f"⏳ Retrying in {wait}s...")
                await asyncio.sleep(wait)

    raise RuntimeError(
        f"LLM call failed after {MAX_RETRIES} attempts. Last error: {last_error}"
    )


async def invoke_llm_json(
    prompt: str,
    temperature: float = 0.2,
) -> dict | list:
    """
    Invoke LLM with JSON-enforcement system prompt, parse and return the result.
    Retries up to MAX_RETRIES times if JSON parsing fails.
    """
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            raw = await invoke_llm(
                prompt,
                temperature=temperature,
                system_message=JSON_SYSTEM_MESSAGE,
            )
            return parse_json_response(raw)
        except (ValueError, json.JSONDecodeError) as e:
            last_error = e
            logger.warning(
                f"⚠️  JSON parse failed on attempt {attempt}: {e}"
            )
            if attempt < MAX_RETRIES:
                wait = RETRY_BACKOFF * attempt
                logger.info(f"⏳ Retrying LLM JSON call in {wait}s...")
                await asyncio.sleep(wait)

    raise RuntimeError(
        f"LLM JSON call failed after {MAX_RETRIES} attempts. Last error: {last_error}"
    )
