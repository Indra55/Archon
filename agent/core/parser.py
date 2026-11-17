import os
import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from tree_sitter import Language, Parser
import tree_sitter_python as tspython
import tree_sitter_typescript as tstypescript

logger = logging.getLogger("archon.core.parser")

@dataclass
class CodeChunk:
    name: str
    type: str  # function, class, method, etc.
    content: str
    start_line: int
    end_line: int
    signature: str
    breadcrumbs: str

class CoreParser:
    def __init__(self):
        self.languages = {
            "python": Language(tspython.language()),
            "typescript": Language(tstypescript.language_typescript()),
            "javascript": Language(tstypescript.language_typescript()), # Close enough for many cases or use language_javascript()
        }
        self.parser = Parser()

    def get_language(self, file_path: str) -> Optional[str]:
        ext = os.path.splitext(file_path)[1].lower()
        if ext == ".py":
            return "python"
        elif ext in [".ts", ".tsx"]:
            return "typescript"
        elif ext in [".js", ".jsx"]:
            return "javascript"
        return None

    def parse_file(self, file_path: str, content: str) -> List[CodeChunk]:
        lang_name = self.get_language(file_path)
        if not lang_name:
            logger.warning(f"Unsupported language for file: {file_path}")
            return []

        lang = self.languages.get(lang_name)
        self.parser.language = lang
        tree = self.parser.parse(bytes(content, "utf8"))
        
        chunks = []
        self._traverse(tree.root_node, content, [], chunks, lang_name)
        return chunks

    def _traverse(self, node, content: str, breadcrumbs: List[str], chunks: List[CodeChunk], lang: str):
        node_type = node.type
        current_breadcrumbs = breadcrumbs[:]

        is_chunk = False
        chunk_type = ""
        name = "anonymous"

        if lang == "python":
            if node_type == "function_definition":
                is_chunk = True
                chunk_type = "function"
                # Find the name child
                for child in node.children:
                    if child.type == "identifier":
                        name = content[child.start_byte:child.end_byte]
                        break
            elif node_type == "class_definition":
                is_chunk = True
                chunk_type = "class"
                for child in node.children:
                    if child.type == "identifier":
                        name = content[child.start_byte:child.end_byte]
                        break
        
        elif lang in ["typescript", "javascript"]:
            if node_type in ["function_declaration", "method_definition", "function_expression"]:
                is_chunk = True
                chunk_type = "function"
                for child in node.children:
                    if child.type == "identifier" or child.type == "property_identifier":
                        name = content[child.start_byte:child.end_byte]
                        break
            elif node_type in ["class_declaration", "interface_declaration"]:
                is_chunk = True
                chunk_type = "class"
                for child in node.children:
                    if child.type == "identifier":
                        name = content[child.start_byte:child.end_byte]
                        break

        if is_chunk:
            chunk_content = content[node.start_byte:node.end_byte]
            # Signature: usually the first line of the definition
            lines = chunk_content.splitlines()
            signature = lines[0] if lines else ""
            
            chunks.append(CodeChunk(
                name=name,
                type=chunk_type,
                content=chunk_content,
                start_line=node.start_point[0] + 1,
                end_line=node.end_point[0] + 1,
                signature=signature,
                breadcrumbs=" > ".join(current_breadcrumbs)
            ))
            
            if chunk_type == "class":
                current_breadcrumbs.append(name)

        for child in node.children:
            self._traverse(child, content, current_breadcrumbs, chunks, lang)

if __name__ == "__main__":
    # Quick test
    parser = CoreParser()
    test_code = """
class MyClass:
    def my_method(self, x):
        return x + 1

def top_level_func():
    print("hello")
    """
    results = parser.parse_file("test.py", test_code)
    for c in results:
        print(f"[{c.type}] {c.name} ({c.start_line}-{c.end_line}) | Breadcrumbs: {c.breadcrumbs}")
        print(f"Signature: {c.signature}")
        print("-" * 20)
