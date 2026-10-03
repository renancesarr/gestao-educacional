"""Inventário local verificável. Não substitui histórico ou auditoria imutável."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import stat
import sys

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "docs/markdown-baseline.json"
IGNORED = {".git", ".agents", ".codex", "node_modules", ".venv"}


def inventory():
    result = {}
    for directory, dirs, files in os.walk(ROOT, followlinks=False):
        dirs[:] = sorted(d for d in dirs if d not in IGNORED)
        for name in sorted(files):
            if not name.lower().endswith(".md"):
                continue
            path = Path(directory) / name
            info = path.lstat()
            if not stat.S_ISREG(info.st_mode):
                raise ValueError(f"Markdown não regular: {path.relative_to(ROOT)}")
            result[path.relative_to(ROOT).as_posix()] = {
                "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
                "mode": oct(stat.S_IMODE(info.st_mode)),
                "uid": info.st_uid,
                "gid": info.st_gid,
            }
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=["inventory", "init", "check"])
    args = parser.parse_args()
    current = inventory()
    if args.action == "inventory":
        print(json.dumps(current, indent=2, ensure_ascii=False))
        return 0
    if args.action == "init":
        # Exclusive creation prevents accidentally blessing changed documents.
        with BASE.open("x", encoding="utf-8") as output:
            json.dump(current, output, indent=2, ensure_ascii=False)
            output.write("\n")
        print(f"Referência criada: {len(current)} Markdown.")
        return 0
    expected = json.loads(BASE.read_text(encoding="utf-8"))
    changes = []
    for name in sorted(expected.keys() | current.keys()):
        if name not in expected:
            changes.append(f"NOVO: {name}")
        elif name not in current:
            changes.append(f"REMOVIDO: {name}")
        elif expected[name] != current[name]:
            fields = sorted(k for k in current[name] if current[name][k] != expected[name].get(k))
            changes.append(f"ALTERADO ({', '.join(fields)}): {name}")
    print("\n".join(changes) if changes else f"OK: {len(current)} Markdown conferem com a referência.")
    return 1 if changes else 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (OSError, ValueError, TypeError, AttributeError) as error:
        print(f"Não foi possível concluir: {error}", file=sys.stderr)
        sys.exit(2)
