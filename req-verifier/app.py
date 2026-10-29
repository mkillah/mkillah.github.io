"""Business Requirements Verification Assistant: Flask entry point.

Run:  .venv/Scripts/python app.py   (Windows)   or   .venv/bin/python app.py
Then open http://127.0.0.1:5077
"""
from __future__ import annotations

from dataclasses import asdict

from flask import Flask, jsonify, render_template, request

from parser import SUPPORTED_EXAMPLES, parse
from verifier import apply_lean_result, build_checks, find_lean, generate_lean, run_lean

app = Flask(__name__)
MAX_INPUT_CHARS = 5000

EXAMPLES = {
    "Loan eligibility (contradiction)": (
        "Customers must be at least 18 to receive a loan.\n"
        "Premium customers are automatically eligible for a loan.\n"
        "Premium customers can be under 18."
    ),
    "Loan eligibility (fixed)": (
        "Customers must be at least 18 to receive a loan.\n"
        "Premium customers over 17 are automatically eligible for a loan.\n"
        "Premium customers can be under 18."
    ),
    "Credit cards (dead rule)": (
        "Customers under 21 cannot receive a credit card.\n"
        "Customers must be at least 25 to receive a mortgage.\n"
        "Student customers under 20 are automatically eligible for a credit card.\n"
        "Customers must have a credit score of at least 650 to receive a mortgage.\n"
        "Student customers can receive a mortgage."
    ),
}


@app.get("/")
def index():
    return render_template("index.html", examples=EXAMPLES, supported=SUPPORTED_EXAMPLES,
                           lean_found=find_lean() is not None)


@app.post("/api/analyze")
def analyze():
    text = (request.get_json(silent=True) or {}).get("text", "")
    if not isinstance(text, str) or not text.strip():
        return jsonify(error="Enter at least one requirement."), 400
    if len(text) > MAX_INPUT_CHARS:
        return jsonify(error=f"Input is limited to {MAX_INPUT_CHARS} characters."), 400

    model = parse(text)
    if not model.requirements:
        return jsonify(model=model.model_dump(), formal={}, checks=[], lean="", lean_run={"available": False})

    checks = build_checks(model)
    lean_src, spans = generate_lean(model, checks)
    lean_run = run_lean(lean_src)
    apply_lean_result(checks, spans, lean_run)

    def check_json(c):
        d = asdict(c)
        d["scenario"] = [a.model_dump() for a in c.scenario]
        return d

    return jsonify(
        model=model.model_dump(),
        formal={r.id: r.formal() for r in model.requirements},
        checks=[check_json(c) for c in checks],
        lean=lean_src,
        lean_run=lean_run,
    )


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5077, debug=False)
