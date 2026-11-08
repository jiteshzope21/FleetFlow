"""
FleetFlow AI Support Dataset Validator & Splitter
Validates schema compliance, quality, detects duplicates, and generates 80/10/10 splits.
"""

import os
import json
import random
from collections import Counter
from typing import Dict, Any, List

DATASET_DIR = os.path.dirname(__file__)
DATASET_PATH = os.path.join(DATASET_DIR, "fleetflow_support_dataset.jsonl")
TRAIN_PATH = os.path.join(DATASET_DIR, "train.jsonl")
VAL_PATH = os.path.join(DATASET_DIR, "val.jsonl")
TEST_PATH = os.path.join(DATASET_DIR, "test.jsonl")
STATS_PATH = os.path.join(DATASET_DIR, "dataset_stats.json")

REQUIRED_FIELDS = [
    "example_id", "category", "subcategory", "difficulty", "user_role",
    "language", "conversation_id", "messages", "source_type",
    "source_reference", "expected_behavior", "safety_category"
]

FORBIDDEN_PATTERNS = [
    "sk-", "password123", "secret_key", "mongodb+srv://admin:admin", "api_secret",
    "private_key", "-----BEGIN RSA PRIVATE KEY-----"
]

def validate_and_split(random_seed: int = 42):
    random.seed(random_seed)

    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}")

    examples: List[Dict[str, Any]] = []
    seen_queries = set()
    duplicates = 0
    validation_errors = []

    with open(DATASET_PATH, "r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                ex = json.loads(line)
            except json.JSONDecodeError as e:
                validation_errors.append(f"Line {line_num}: Invalid JSON - {e}")
                continue

            # Validate schema
            for rf in REQUIRED_FIELDS:
                if rf not in ex:
                    validation_errors.append(f"Line {line_num}: Missing required field '{rf}'")

            # Check messages structure
            msgs = ex.get("messages", [])
            if not isinstance(msgs, list) or len(msgs) < 3:
                validation_errors.append(f"Line {line_num}: Messages must contain at least system, user, assistant.")
            else:
                roles = [m.get("role") for m in msgs]
                if roles[0] != "system" or roles[1] != "user" or roles[2] != "assistant":
                    validation_errors.append(f"Line {line_num}: Invalid message role sequence: {roles}")

            # Check for secret leakage
            full_text = json.dumps(ex).lower()
            for p in FORBIDDEN_PATTERNS:
                if p in full_text:
                    validation_errors.append(f"Line {line_num}: Potential sensitive credential pattern '{p}' detected!")

            # Duplicate check on user prompt
            user_msg = msgs[1].get("content", "").strip() if len(msgs) > 1 else ""
            if user_msg in seen_queries:
                duplicates += 1
            else:
                seen_queries.add(user_msg)

            examples.append(ex)

    total_count = len(examples)
    if validation_errors:
        print(f"[Validator] FAILED: {len(validation_errors)} validation errors found:")
        for err in validation_errors[:10]:
            print(f"  - {err}")
        raise ValueError(f"Dataset validation failed with {len(validation_errors)} errors.")

    print(f"[Validator] SUCCESS: All {total_count} examples passed validation cleanly (0 errors).")
    print(f"[Validator] Unique user queries: {len(seen_queries)}, Duplicates detected: {duplicates}")

    # Stratified split: group by category
    categories = Counter(e["category"] for e in examples)
    difficulties = Counter(e["difficulty"] for e in examples)
    user_roles = Counter(e["user_role"] for e in examples)
    safety_categories = Counter(e["safety_category"] for e in examples)

    train_set, val_set, test_set = [], [], []

    # Stratified split by category
    cat_grouped = {}
    for ex in examples:
        cat_grouped.setdefault(ex["category"], []).append(ex)

    for cat, items in cat_grouped.items():
        random.shuffle(items)
        n = len(items)
        n_train = max(1, int(round(n * 0.80)))
        n_val = max(1, int(round(n * 0.10))) if n >= 5 else 0
        
        train_items = items[:n_train]
        remaining = items[n_train:]
        val_items = remaining[:n_val]
        test_items = remaining[n_val:] if len(remaining) > n_val else items[-1:]

        train_set.extend(train_items)
        val_set.extend(val_items)
        test_set.extend(test_items)

    # Save splits
    def write_split(path, data):
        with open(path, "w", encoding="utf-8") as f:
            for d in data:
                f.write(json.dumps(d, ensure_ascii=False) + "\n")

    write_split(TRAIN_PATH, train_set)
    write_split(VAL_PATH, val_set)
    write_split(TEST_PATH, test_set)

    stats = {
        "total_examples": total_count,
        "splits": {
            "train": len(train_set),
            "val": len(val_set),
            "test": len(test_set)
        },
        "category_distribution": dict(categories),
        "difficulty_distribution": dict(difficulties),
        "user_role_distribution": dict(user_roles),
        "safety_category_distribution": dict(safety_categories),
        "unique_queries": len(seen_queries),
        "duplicate_queries": duplicates,
        "validation_status": "PASSED"
    }

    with open(STATS_PATH, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)

    print("\n================ DATASET SPLIT & STATISTICS ================")
    print(f"Total Examples: {total_count}")
    print(f"Train Set:      {len(train_set)} ({len(train_set)/total_count*100:.1f}%)")
    print(f"Validation Set: {len(val_set)} ({len(val_set)/total_count*100:.1f}%)")
    print(f"Test Set:       {len(test_set)} ({len(test_set)/total_count*100:.1f}%)")
    print("\nCategories:")
    for cat, count in categories.items():
        print(f"  - {cat:25s}: {count:3d}")
    print("\nDifficulties:")
    for diff, count in difficulties.items():
        print(f"  - {diff:15s}: {count:3d}")
    print("============================================================\n")

    return stats

if __name__ == "__main__":
    validate_and_split()

