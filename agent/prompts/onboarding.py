"""
Prompts for Contextual Onboarding & Learning Path Engine.
"""

LEARNING_PATH_PROMPT = """
You are an expert engineering onboarding architect. Given a knowledge graph context about a codebase, 
generate a structured learning path for a new team member in the "{role}" role.

The learning path should teach the engineer about the system in a logical sequence.

REFERENCE LIBRARY OF PRE-MADE MODULES:
We have a curated library of foundational modules with verified tutorial videos. 
Whenever a module in the learning path matches one of these topics, YOU MUST prefer using these high-quality resources.

LIBRARY MODULES:
{video_library}

KNOWLEDGE GRAPH CONTEXT:
{graph_context}

RELEVANT CODE AREAS:
{code_context}

Generate a JSON response with this EXACT structure:
{{
  "title": "Learning Path: <Role Name> Onboarding",
  "description": "A brief 1-2 sentence description of what this path covers",
  "estimated_total_minutes": <number>,
  "modules": [
    {{
      "id": "<unique_slug>",
      "library_id": "<id_from_library_if_applicable>",
      "title": "Module title",
      "description": "What the engineer will learn in this module",
      "type": "architecture|service|code|decision|operations",
      "estimated_minutes": <number>,
      "content": "Detailed markdown content explaining this topic using the knowledge graph data. Include specific file paths, function names, and code references where relevant.",
      "linked_graph_nodes": ["<node_uuid1>", "<node_uuid2>"],
      "key_takeaways": ["takeaway 1", "takeaway 2"],
      "recommended_videos": [
        {{
          "title": "Descriptive title",
          "youtube_id": "Actual 11-char ID"
        }}
      ]
    }}
  ]
}}

INSTRUCTIONS:
1. Generate 5-8 modules that form a coherent, progressive learning sequence.
2. If a library module topic (e.g., "System Design Basics") is relevant, include it and use its verified data.
3. Supplement the library modules with codebase-specific modules (type: service, code, decision) based on the graph context.
4. For codebase-specific modules, leave "library_id" as null and provide descriptive content referencing real files.
5. NEVER hallucinate YouTube IDs. If you don't have a verified ID from the library, leave it null.
"""

STARTER_TASK_PROMPT = """
You are an expert engineering mentor. You are onboarding a new "{role}" team member to a SPECIFIC project.

PROJECT / REPOSITORY INFORMATION:
Repository: {repo_name}
{repo_description}

LEARNING PATH:
{learning_path}

KNOWLEDGE GRAPH CONTEXT (from this repository):
{graph_context}

ACTUAL CODE FILES AND STRUCTURE FROM THIS REPO:
{repo_code_context}

Generate a JSON array of 3-5 starter tasks that are SPECIFIC to the "{repo_name}" repository.
Each task MUST reference actual files, functions, or modules that exist in THIS specific project.

Use this EXACT structure:
[
  {{
    "title": "Short task title - specific to {repo_name}",
    "description": "Clear description referencing SPECIFIC files and functions from the repo. Example: 'In server/routes/auth.js, add input validation for the /login endpoint that checks email format before querying the database.'",
    "difficulty": "easy|medium|hard",
    "linked_nodes": ["<node_uuid1>", "<node_uuid2>"],
    "hints": [
      "Hint 1: Start by looking at <specific_file_path>",
      "Hint 2: Follow the pattern used in <similar_function>",
      "Hint 3: Test by running <specific_command>"
    ],
    "learning_objectives": ["What the engineer will learn by completing this task"],
    "relevant_files": ["path/to/file1.js", "path/to/file2.py"]
  }}
]

CRITICAL RULES:
- Every task MUST reference real files and code from the knowledge graph context above
- Tasks must be specific to THIS repository - not generic programming exercises
- Include exact file paths (e.g., "server/routes/auth.js") in the description and hints
- Tasks should help the developer understand how THIS specific codebase works
- Start with an easy task like exploring a specific service or adding a log/comment to a real file
- Progressive difficulty: easy -> medium -> hard
"""