#!/usr/bin/env python3
from spellchecker import SpellChecker
from pathlib import Path
import sys


def check_spelling(file_path: str) -> int:
    """
    Read a text file and print spelling issues with suggestions.

    Returns non-zero if file missing, zero otherwise.
    """
    input_path = Path(file_path)
    if not input_path.exists():
        print(f"Error: file not found: {file_path}", file=sys.stderr)
        return 2

    text = input_path.read_text(encoding="utf-8", errors="ignore")
    spell = SpellChecker(distance=2)

    # Basic tokenization: split on non-alpha characters
    import re
    words = [w.lower() for w in re.findall(r"[A-Za-zآ-ی]+", text)]

    unknown = spell.unknown([w for w in words if w.isascii()])

    if not unknown:
        print("No spelling issues detected.")
        return 0

    print("Potential misspellings and suggestions:\n")
    for word in sorted(unknown):
        candidates = list(spell.candidates(word))
        suggestion = spell.correction(word)
        print(f"- {word} -> suggestion: {suggestion}; candidates: {', '.join(sorted(candidates))}")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: spell_checker.py <path-to-text-file>", file=sys.stderr)
        sys.exit(2)
    sys.exit(check_spelling(sys.argv[1]))
