"""Manual evaluation script for spot-checking RAG retrieval quality."""

import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import ARTIFACTS_DIR
from generate import generate_answer_with_sources

EVAL_QUESTIONS: list[dict] = [
    {
        "category": "setup/installation",
        "question": "How do I mount and install the robot arm on a work surface?",
        "expect_safety": False,
    },
    {
        "category": "setup/installation",
        "question": "What are the electrical power requirements for the robot controller?",
        "expect_safety": False,
    },
    {
        "category": "safety",
        "question": "What is the emergency stop procedure for the robot?",
        "expect_safety": True,
    },
    {
        "category": "safety",
        "question": "What safety distance must be maintained during robot operation?",
        "expect_safety": True,
    },
    {
        "category": "safety",
        "question": "What are the hazard warnings for collaborative robot operation?",
        "expect_safety": True,
    },
    {
        "category": "maintenance",
        "question": "What is the recommended maintenance schedule for the robot?",
        "expect_safety": False,
    },
    {
        "category": "maintenance",
        "question": "How do I lubricate or service the robot joints?",
        "expect_safety": False,
    },
    {
        "category": "troubleshooting",
        "question": "What should I do if the robot displays a protective stop error?",
        "expect_safety": False,
    },
    {
        "category": "troubleshooting",
        "question": "How do I diagnose communication errors between the controller and robot arm?",
        "expect_safety": False,
    },
    {
        "category": "troubleshooting",
        "question": "What causes joint limit violations and how are they resolved?",
        "expect_safety": False,
    },
]


def run_evaluation() -> str:
    """Run all eval questions and return formatted results text."""
    lines: list[str] = [
        "Robotics Manual RAG — Evaluation Results",
        f"Run at: {datetime.now(timezone.utc).isoformat()}",
        "=" * 60,
        "",
    ]

    for i, item in enumerate(EVAL_QUESTIONS, start=1):
        question = item["question"]
        category = item["category"]
        expect_safety = item["expect_safety"]

        lines.append(f"Question {i} [{category}]")
        lines.append(f"Q: {question}")
        lines.append("")

        try:
            result = generate_answer_with_sources(question)
            answer = result["answer"]
            sources = result["sources"]
            is_safety = result["is_safety_related"]
            safety_ok = is_safety == expect_safety

            lines.append(f"A: {answer}")
            lines.append("")
            lines.append("Sources:")
            if sources:
                for src in sources:
                    lines.append(
                        f"  - {src['source_filename']}, page {src['page_number']} "
                        f"({src.get('section_type', 'general')})"
                    )
            else:
                lines.append("  (none retrieved)")
            lines.append("")
            lines.append(
                f"Safety flag: {is_safety} (expected: {expect_safety}) "
                f"{'✓' if safety_ok else '✗ MISMATCH'}"
            )
        except Exception as exc:
            lines.append(f"ERROR: {exc}")

        lines.append("")
        lines.append("-" * 60)
        lines.append("")

    return "\n".join(lines)


def main() -> None:
    """Run evaluation and save results to artifacts/eval_results.txt."""
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    output_path = ARTIFACTS_DIR / "eval_results.txt"

    print("Running evaluation on 10 test questions...")
    results_text = run_evaluation()
    print(results_text)

    output_path.write_text(results_text)
    print(f"\nResults saved to {output_path}")


if __name__ == "__main__":
    main()
