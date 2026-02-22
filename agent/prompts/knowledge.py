"""
Prompts for Living Knowledge Graph feature.
"""

CHUNK_SUMMARY_PROMPT = """
You are an expert software architect. Analyze the following code chunk and its context to extract key information.

File: {file_path}
Context: {breadcrumbs}
Code:
```
{code}
```

Provide the output strictly as a JSON object (no markdown, no backticks) with the following structure:
{{
  "summary": "Concise one-sentence natural language summary",
  "relationships": [
    {{
      "type": "DEPENDS_ON|EXPOSES|USES_SCHEMA|MODIFIES|PART_OF|DOCUMENTED_BY|DEPLOYED_AS|SUPERSEDES|RELATED_TO|TRIGGERED_BY",
      "target": "name of the target component/concept/schema",
      "description": "brief reason for this relationship"
    }}
  ]
}}
"""
