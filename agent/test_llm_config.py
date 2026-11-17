import os
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from agent.core import llm


class ModelConfigTests(unittest.IsolatedAsyncioTestCase):
    def test_defaults_keep_routing_free(self):
        with patch.dict(os.environ, {}, clear=True):
            config = llm.get_model_config()
        self.assertTrue(config["model"].endswith(":free"))
        self.assertIn("openrouter/free", config["models"])
        self.assertEqual(config["provider"]["max_price"], {"prompt": 0, "completion": 0})

    def test_custom_fallbacks_are_trimmed_and_deduplicated(self):
        with patch.dict(os.environ, {
            "OPENROUTER_MODEL": " example/primary:free ",
            "OPENROUTER_FALLBACK_MODELS": " example/primary:free, , example/backup:free, example/backup:free ",
        }):
            config = llm.get_model_config()
        self.assertEqual(config["model"], "example/primary:free")
        self.assertEqual(config["models"], ["example/backup:free"])

    async def test_request_forwards_routing_and_returns_fallback_content(self):
        response = SimpleNamespace(
            model="example/backup:free",
            choices=[SimpleNamespace(message=SimpleNamespace(content='{"ok": true}'))],
        )
        create = AsyncMock(return_value=response)
        client = SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=create)))
        with patch.object(llm, "_get_client", return_value=client):
            result = await llm.invoke_llm_json("Return JSON with ok=true")
        self.assertEqual(result, {"ok": True})
        extra = create.call_args.kwargs["extra_body"]
        self.assertIn("openrouter/free", extra["models"])
        self.assertEqual(extra["provider"]["max_price"]["completion"], 0)


if __name__ == "__main__":
    unittest.main()
