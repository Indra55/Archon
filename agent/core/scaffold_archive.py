import io
import zipfile
from pathlib import PurePosixPath


def build_scaffold_archive(files: list, blueprint: str = "") -> bytes:
    output = io.BytesIO()
    seen = set()
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
        for item in files:
            raw_path = item.get("path", "").replace("\\", "/")
            path = PurePosixPath(raw_path)
            if not raw_path or path.is_absolute() or ".." in path.parts or ":" in raw_path or str(path) == ".":
                raise ValueError("Generated file has an invalid relative path")
            name = str(path)
            if name in seen:
                raise ValueError(f"Duplicate generated path: {name}")
            seen.add(name)
            archive.writestr(name, item.get("content", ""))
        if blueprint and "BLUEPRINT.md" not in seen:
            archive.writestr("BLUEPRINT.md", blueprint)
    return output.getvalue()
