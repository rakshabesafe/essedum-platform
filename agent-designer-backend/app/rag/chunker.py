"""
Text chunking - native Python implementation.
Supports recursive character splitting (no external dependencies).
"""

from dataclasses import dataclass, field


@dataclass
class Chunk:
    content: str
    chunk_index: int
    metadata: dict = field(default_factory=dict)


def _recursive_split(text: str, chunk_size: int, chunk_overlap: int) -> list[str]:
    """Split text on paragraph/sentence/word/char boundaries recursively."""
    separators = ["\n\n", "\n", ". ", " ", ""]
    for sep in separators:
        if sep and sep in text:
            parts = text.split(sep)
            chunks: list[str] = []
            current = ""
            for part in parts:
                candidate = (current + sep + part).lstrip(sep) if current else part
                if len(candidate) <= chunk_size:
                    current = candidate
                else:
                    if current:
                        chunks.append(current)
                    # Part itself might be too long — recurse with next separator
                    if len(part) > chunk_size:
                        chunks.extend(_recursive_split(part, chunk_size, chunk_overlap))
                        current = ""
                    else:
                        current = part
            if current:
                chunks.append(current)
            # Apply overlap
            if chunk_overlap <= 0 or len(chunks) <= 1:
                return chunks
            overlapped: list[str] = [chunks[0]]
            for i in range(1, len(chunks)):
                prev_tail = chunks[i - 1][-chunk_overlap:]
                overlapped.append(prev_tail + chunks[i])
            return overlapped
    # No separator found — hard split
    result = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        result.append(text[start:end])
        start += chunk_size - chunk_overlap
    return result


def chunk_text(
    text: str,
    chunk_size: int = 512,
    chunk_overlap: int = 50,
    strategy: str = "recursive",
) -> list[Chunk]:
    """
    Split text into overlapping chunks.

    Args:
        text:          Full document text.
        chunk_size:    Target size in characters.
        chunk_overlap: Overlap between successive chunks.
        strategy:      "recursive" (default) | "token" (falls back to character split)
    """
    parts = _recursive_split(text, chunk_size, chunk_overlap)
    return [
        Chunk(content=part, chunk_index=i)
        for i, part in enumerate(parts)
        if part.strip()
    ]
