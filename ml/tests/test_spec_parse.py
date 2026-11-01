#!/usr/bin/env python3
"""
Test Windows-safe external spec parsing with drive letters containing colons.
"""

import sys
from pathlib import Path

# Add ml folder to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from evaluate import parse_external_spec


def test_spec_parse():
    spec_windows = r"RiceLeafBD5=D:\datasets\bd5:ml\external_maps\riceleafdisease_bd5.json"
    name, root, map_file = parse_external_spec(spec_windows)

    assert name == "RiceLeafBD5", f"Unexpected name: {name}"
    assert str(root) == r"D:\datasets\bd5", f"Unexpected root: {root}"
    assert str(map_file) == r"ml\external_maps\riceleafdisease_bd5.json", f"Unexpected map_file: {map_file}"

    # Also test Linux / standard style path
    spec_unix = "RiceLeafBD=/kaggle/input/dataset:ml/external_maps/map.json"
    name_u, root_u, map_u = parse_external_spec(spec_unix)
    assert name_u == "RiceLeafBD"
    assert str(root_u) == str(Path("/kaggle/input/dataset"))
    assert str(map_u) == str(Path("ml/external_maps/map.json"))

    print("PASS: test_spec_parse (Windows drive-letter safe)")


if __name__ == "__main__":
    test_spec_parse()

