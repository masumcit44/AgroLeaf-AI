#!/usr/bin/env python3
"""Validate a metrics-v1.json file against model/metrics.schema.json.

Standard library only. Implements the small JSON Schema (draft 2020-12) subset
used by our schema: type, required, properties, additionalProperties, items,
enum, const, minimum, maximum, exclusiveMinimum, exclusiveMaximum, minItems,
maxItems, minLength, maxLength, anyOf, and local $ref pointers.

Usage:
    python ml/tools/check_metrics_schema.py path/to/metrics-v1.json
    python ml/tools/check_metrics_schema.py --schema other.json metrics.json

Exits 0 when valid, 1 when there are errors (one line per error).
"""

import argparse
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SCHEMA = REPO_ROOT / "model" / "metrics.schema.json"


def json_type(value):
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "boolean"
    if isinstance(value, int):
        return "integer"
    if isinstance(value, float):
        return "number"
    if isinstance(value, str):
        return "string"
    if isinstance(value, list):
        return "array"
    if isinstance(value, dict):
        return "object"
    return type(value).__name__


def matches_type(value, expected):
    actual = json_type(value)
    if expected == actual:
        return True
    if expected == "number" and actual == "integer":
        return True
    return False


def resolve_pointer(root, ref):
    if ref == "#":
        return root
    if not ref.startswith("#/"):
        return None
    node = root
    for raw in ref[2:].split("/"):
        token = raw.replace("~1", "/").replace("~0", "~")
        if isinstance(node, dict) and token in node:
            node = node[token]
        elif isinstance(node, list) and token.isdigit() and int(token) < len(node):
            node = node[int(token)]
        else:
            return None
    return node


def _validate(instance, schema, root, path, errors):
    if not isinstance(schema, dict):
        errors.append(f"{path}: schema node is not an object")
        return

    if "$ref" in schema:
        target = resolve_pointer(root, schema["$ref"])
        if target is None:
            errors.append(f"{path}: unresolved $ref {schema['$ref']!r}")
            return
        _validate(instance, target, root, path, errors)
        return

    if "anyOf" in schema:
        branch_errors = []
        for branch in schema["anyOf"]:
            trial = []
            _validate(instance, branch, root, path, trial)
            if not trial:
                break
            branch_errors.append(trial)
        else:
            errors.append(f"{path}: value does not match any allowed form (anyOf)")
            return

    if "enum" in schema and instance not in schema["enum"]:
        errors.append(f"{path}: expected one of {schema['enum']!r}, got {instance!r}")

    if "const" in schema and instance != schema["const"]:
        errors.append(f"{path}: expected constant {schema['const']!r}, got {instance!r}")

    expected_types = schema.get("type")
    if expected_types is not None:
        if isinstance(expected_types, str):
            expected_types = [expected_types]
        if not any(matches_type(instance, t) for t in expected_types):
            errors.append(
                f"{path}: expected type {'/'.join(expected_types)}, got {json_type(instance)}"
            )
            return

    if json_type(instance) in ("integer", "number"):
        number = instance
        if "minimum" in schema and number < schema["minimum"]:
            errors.append(f"{path}: {number!r} is less than minimum {schema['minimum']!r}")
        if "maximum" in schema and number > schema["maximum"]:
            errors.append(f"{path}: {number!r} is greater than maximum {schema['maximum']!r}")
        if "exclusiveMinimum" in schema and number <= schema["exclusiveMinimum"]:
            errors.append(
                f"{path}: {number!r} must be greater than {schema['exclusiveMinimum']!r}"
            )
        if "exclusiveMaximum" in schema and number >= schema["exclusiveMaximum"]:
            errors.append(
                f"{path}: {number!r} must be less than {schema['exclusiveMaximum']!r}"
            )

    if isinstance(instance, str):
        if "minLength" in schema and len(instance) < schema["minLength"]:
            errors.append(f"{path}: string is shorter than {schema['minLength']} characters")
        if "maxLength" in schema and len(instance) > schema["maxLength"]:
            errors.append(f"{path}: string is longer than {schema['maxLength']} characters")

    if isinstance(instance, list):
        if "minItems" in schema and len(instance) < schema["minItems"]:
            errors.append(f"{path}: expected at least {schema['minItems']} item(s)")
        if "maxItems" in schema and len(instance) > schema["maxItems"]:
            errors.append(f"{path}: expected at most {schema['maxItems']} item(s)")
        item_schema = schema.get("items")
        if isinstance(item_schema, dict):
            for index, item in enumerate(instance):
                _validate(item, item_schema, root, f"{path}[{index}]", errors)

    if isinstance(instance, dict):
        for key in schema.get("required", []):
            if key not in instance:
                errors.append(f"{path}: missing required property {key!r}")

        properties = schema.get("properties", {})
        for key, subschema in properties.items():
            if key in instance:
                _validate(instance[key], subschema, root, f"{path}.{key}", errors)

        additional = schema.get("additionalProperties", True)
        for key, value in instance.items():
            if key in properties:
                continue
            if additional is False:
                errors.append(f"{path}: unexpected property {key!r}")
            elif isinstance(additional, dict):
                _validate(value, additional, root, f"{path}.{key}", errors)


def validate(instance, schema, root_schema=None):
    """Return a list of human-readable validation error strings."""
    root = root_schema if root_schema is not None else schema
    errors = []
    _validate(instance, schema, root, "$", errors)
    return errors


def validate_file(metrics_path, schema_path=None):
    """Load both files and return (errors, schema_used)."""
    schema_path = Path(schema_path) if schema_path else DEFAULT_SCHEMA
    with open(schema_path, "r", encoding="utf-8") as f:
        schema = json.load(f)
    with open(metrics_path, "r", encoding="utf-8") as f:
        instance = json.load(f)
    return validate(instance, schema), schema_path


def main(argv=None):
    parser = argparse.ArgumentParser(description="Validate metrics-v1.json against the AgroLeaf metrics schema")
    parser.add_argument("metrics", type=Path, help="Path to metrics-v1.json")
    parser.add_argument(
        "--schema",
        type=Path,
        default=DEFAULT_SCHEMA,
        help=f"Path to the JSON Schema (default: {DEFAULT_SCHEMA})",
    )
    args = parser.parse_args(argv)

    try:
        errors, schema_path = validate_file(args.metrics, args.schema)
    except FileNotFoundError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    except json.JSONDecodeError as exc:
        print(f"ERROR: invalid JSON: {exc}", file=sys.stderr)
        return 1

    if errors:
        print(f"INVALID: {args.metrics} does not match {schema_path} ({len(errors)} error(s))")
        for error in errors:
            print(f"  - {error}")
        return 1

    print(f"OK: {args.metrics} matches {schema_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
