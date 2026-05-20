# Fresh-Eyes Review and Simplification Mandate

Approach this task as if you are implementing the system for the first time in a new codebase. **Do not assume the current implementation is correct, well-designed, extensible, readable, or appropriately organized.** Treat the existing code as potentially misleading or unnecessarily complex, and re-derive what the code *should* be doing from first principles: the intended features, responsibilities, contracts, and the architecture rules in `app/AGENTS.md`.

Your goals are:

* **Clarity first:** A new developer (including a junior) should be able to open any relevant file and quickly understand what it does, why it exists, and how it connects to adjacent layers (router/validator/controller/service/repository/assembler).
* **Simplicity over speculation:** Remove or avoid logic that handles implausible scenarios, redundant validations, unreachable branches, and defensive code that does not reflect real invariants. Prefer explicit, minimal control flow over sprawling conditional logic.
* **Eliminate confusion and clutter:** Identify and remove dead code, duplicated patterns, over-generalized abstractions, premature extensibility, and “framework-like” machinery that provides little value.
* **Willingness to re-structure:** If file names, file locations, module boundaries, or folder structure are confusing or inconsistent, **change them** to align with `app/AGENTS.md` and to improve navigability. Prefer feature-local cohesion and predictable placement over ad-hoc organization.
* **Make complexity earn its keep:** If something is complex, it must be justified by a real requirement (correctness, security, idempotency, performance, clear domain boundaries). Otherwise, simplify.
* **Refactor decisively but responsibly:** You may replace or rework existing implementations when doing so meaningfully improves correctness, readability, maintainability, and alignment with the canonical rules. Avoid churn that does not deliver clear benefit.

Throughout, keep the implementation pragmatic: improve fundamentals, reduce cognitive load, and ensure the final structure is easy to trace end-to-end.