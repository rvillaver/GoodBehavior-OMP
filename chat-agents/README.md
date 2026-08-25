# chat-agents — GoodBehavior for chat & non-agentic assistants

The rest of GoodBehavior is an OMP bundle: skills, a done-gate extension, profiles, a filesystem to verify against.
This folder is the **agentless** deployment — the same operating principles carried as prompt alone, for plain Claude.ai
chat, a Project, or another assistant (Copilot, etc.).

It's a companion, not part of the core method. Nothing installs it.

## Two ways to deploy it

**1. As standing instructions.** Paste [`goodbehavior.md`](goodbehavior.md) into your Claude.ai personalization, a
Project's custom instructions, or the top of a chat. Then invoke it in any message with **"follow the GoodBehavior
approach"** (or "GoodBehavior this"). Works wherever the tool actually honors custom instructions.

**2. Attach + inline (robust — use when instructions get ignored).** Some assistants drop custom instructions —
**Copilot has been observed to ignore them entirely.** For those, don't rely on standing instructions: **attach
`goodbehavior.md` to the conversation** *and* write your task with [`PROMPT-TEMPLATE.md`](PROMPT-TEMPLATE.md), which
re-states the load-bearing rules (the understanding gate, ✔/⚠ evidence, no unsupported recommendations) *inside the
prompt itself* — where they can't be silently dropped. Belt and suspenders.

## Files

| File | What it is |
|---|---|
| [`goodbehavior.md`](goodbehavior.md) | **The method.** Attach it, or paste it as instructions. Single source of truth. |
| [`PROMPT-TEMPLATE.md`](PROMPT-TEMPLATE.md) | Blank, domain-neutral per-task scaffold that front-loads the gate + evidence rules inline. |
| [`EXAMPLE.md`](EXAMPLE.md) | The template filled in for one concrete task — illustrative; keeps domain nouns isolated here. |

## The honest caveat

In the agentic bundle a done-gate extension adds teeth. Here there is none — the instructions are a request, not an
enforcer, and a model can still drift (which is exactly why mode 2 exists). That makes **you the done-gate**: this
doesn't remove your hand from the wheel.
