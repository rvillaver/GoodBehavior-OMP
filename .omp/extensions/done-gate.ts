/**
 * GoodBehavior done-gate for OMP — a session_stop extension that pushes back on
 * self-declared "done".
 *
 * When the last assistant message makes an explicit completion claim without support, it blocks
 * the stop once and feeds back a short self-check. It is a heuristic nudge, not a lie detector:
 * conservative claim-matching to limit false positives, and per-turn + runtime caps prevent loops.
 *
 * Two layers:
 *   LEXICAL    — what the message says. An honest hedge ("not done yet", "unverified") always lets the
 *                stop through. Verification vocabulary ("verified", "I ran", "tests pass") is only a
 *                *claim* of proof.
 *   BEHAVIORAL — what the turn actually did. Verification vocabulary is honored only if something was
 *                actually run/observed AFTER the last file change this turn (a command, a browser drive).
 *                "Edited files, ran nothing, said 'verified'" blocks: the final state of the work was
 *                never observed, so the proof-claim is hollow.
 *
 * False-positive controls, in the order they short-circuit:
 *   (3) Activity gate  — only arm when THIS turn actually touched code/build (edit/write/bash/...).
 *                        Pure discussion turns never trip the gate.
 *   (1) Meta escape    — talking ABOUT the gate/framework ("done-gate", "the hook") isn't a claim.
 *   (2) Assertive only — the completion word must head a short declarative clause, not just appear
 *                        somewhere in a long paragraph.
 *   (0a) Hedge         — an honest downgrade in the message always lets the stop through.
 *   (0b) Proof+observed — verification vocabulary + an observation after the last change lets it through.
 *        Doc-only turns (every mutation touched .md/.txt/...) are exempt from the behavioral check:
 *        there is often nothing to "run" for prose, so proof vocabulary suffices there.
 *
 * Wire-in: none needed — OMP auto-discovers `.omp/extensions/*.ts`. The session_stop runtime caps
 * consecutive continuations at 8; this module additionally allows at most MAX_FIRES_PER_TURN per turn.
 */
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

// Tools whose use means the turn did real build work (lowercased) — arms the gate.
export const BUILD_TOOLS: Record<string, true> = {
	edit: true,
	write: true,
	bash: true,
	ast_edit: true,
	apply_patch: true,
	notebookedit: true,
};

// Tools that MUTATE files (for the behavioral check: what was the last change?).
export const MUTATION_TOOLS: Record<string, true> = { edit: true, write: true };

// Tools whose use counts as OBSERVING real behavior (running/fetching/driving something).
// Sub-agent results (task/hub) are relayed claims, not firsthand observation — excluded on purpose.
export const OBSERVE_TOOLS: Record<string, true> = { bash: true, webfetch: true, web_fetch: true };
const OBSERVE_NAME_HINTS = ["browser", "puppeteer", "playwright", "chrome"];

// File extensions where "run it" usually doesn't apply — prose/docs. Doc-only turns skip the
// behavioral check (lexical proof suffices).
export const DOC_EXTENSIONS = [".md", ".markdown", ".txt", ".rst", ".adoc"];

// Explicit completion claims (kept narrow on purpose).
const CLAIM =
	/(✅|\bit'?s (now )?(done|complete|working)\b|\b(all )?(done|complete|completed|finished|shipped)\b|\bworks now\b|\bfully (working|functional)\b|\bgood to go\b|\ball set\b)/;

// (0a) Honest hedge / downgrade — always let the stop through; honesty must never be punished.
const HEDGE =
	/(not (yet|done)|isn't done|unverified|partial|in progress|pending|blocked|deferred|backlog|to verify|still to|left to do|remaining|please (check|review|confirm)|you (can )?(check|confirm))/;

// (0b) Verification vocabulary — a *claim* of proof; honored only when backed by behavior.
const PROOF = /(verif|screenshot|i ran|ran the|test(s)? pass|passing|confirm|evidence|rendered|observed)/;

// (1) Meta-discussion about the gate/framework itself — not a real completion claim.
const META = /(done-gate|good ?behavior|the (gate|hook)|this hook|stop hook|the regex|false (positive|trigger))/;

export const MSG_NO_EVIDENCE =
	"GoodBehavior done-gate — you claimed completion. Before ending, self-check:\n" +
	"  1) Did you exercise the REAL thing the way its consumer would (per the project's profile) — not just a test/your description?\n" +
	"  2) Can you SHOW the evidence (result vs. reference; the flow firing / validation output / source-backed claim)?\n" +
	"  3) Is it user-confirmed? If not, say \"not done yet\" / state what's left — don't self-declare done.\n" +
	"Then either present the evidence, soften the claim, or record a learning and continue.\n";

export const MSG_HOLLOW_PROOF =
	"GoodBehavior done-gate — you claimed verification, but nothing was run or observed after the last file change this " +
	"turn, so the final state of the work was never seen. Exercise it (a command, a drive through the real flow), then " +
	"present what you observed — or soften the claim to \"not done yet\". Only observed evidence under this method exists to stop.\n";

/** One tool use in the current turn: tool name (lowercased) + raw input args. */
export type ToolUse = { name: string; input: Record<string, unknown> };

export type GateVerdict = { block: true; reason: string } | null;

function observes(name: string): boolean {
	return Boolean(OBSERVE_TOOLS[name]) || OBSERVE_NAME_HINTS.some((h) => name.includes(h));
}

/** Was anything run/fetched/driven AFTER the last file mutation this turn?
 *
 * A turn with no file mutations armed the gate via bash alone — it executed something, which is
 * itself an observation, so it passes. */
export function observedAfterLastMutation(tools: ToolUse[]): boolean {
	let lastMutation = -1;
	for (let i = 0; i < tools.length; i++) {
		if (MUTATION_TOOLS[tools[i].name]) lastMutation = i;
	}
	if (lastMutation === -1) return true;
	return tools.slice(lastMutation + 1).some((t) => observes(t.name));
}

/** True if every file mutation this turn touched only prose/doc files (and at least one did). */
export function docOnlyMutations(tools: ToolUse[]): boolean {
	const paths: string[] = [];
	for (const t of tools) {
		if (!MUTATION_TOOLS[t.name]) continue;
		const p = t.input?.file_path ?? t.input?.path ?? t.input?.notebook_path ?? "";
		paths.push(String(p).toLowerCase());
	}
	if (paths.length === 0) return false;
	return paths.every((p) => DOC_EXTENSIONS.some((ext) => p.endsWith(ext)));
}

/** A completion word counts only inside a short, declarative clause — not buried in prose. */
export function assertiveClaim(text: string): boolean {
	for (const raw of text.split(/[.!?\n]+/)) {
		const s = raw.trim();
		if (!s) continue;
		if (s.split(/\s+/).length > 12) continue; // incidental mention inside a longer sentence
		if (CLAIM.test(s.toLowerCase())) return true;
	}
	return false;
}

type ContentBlock = { type?: string; text?: string; name?: string; toolName?: string; arguments?: unknown; input?: unknown };

function blocks(content: unknown): ContentBlock[] {
	if (!Array.isArray(content)) return [];
	return content.filter((b): b is ContentBlock => b !== null && typeof b === "object");
}

function textOf(content: unknown): string {
	if (typeof content === "string") return content;
	return blocks(content)
		.map((b) => (b.type === "text" ? String(b.text ?? "") : ""))
		.join(" ");
}

function hasHumanText(content: unknown): boolean {
	if (typeof content === "string") return content.trim().length > 0;
	return blocks(content).some((b) => b.type === "text" && String(b.text ?? "").trim().length > 0);
}

function toolUsesFromAssistant(content: unknown): ToolUse[] {
	const out: ToolUse[] = [];
	for (const b of blocks(content)) {
		if (b.type !== "toolCall" && b.type !== "tool_use") continue;
		const name = String(b.name ?? b.toolName ?? "");
		if (!name) continue;
		const input = (b.arguments ?? b.input ?? {}) as Record<string, unknown>;
		out.push({ name: name.toLowerCase(), input });
	}
	return out;
}

/** All tool uses since the last real human message, plus the last non-empty assistant text. */
export function extractTurnData(messages: Array<{ role?: string; content?: unknown }>): { text: string; tools: ToolUse[] } {
	let lastHuman = -1;
	for (let i = 0; i < messages.length; i++) {
		const m = messages[i];
		// OMP stores tool results with role "toolResult"; only genuine user messages count.
		if ((m.role === "user" || m.role === "human") && hasHumanText(m.content)) lastHuman = i;
	}
	const tools: ToolUse[] = [];
	let text = "";
	for (let i = lastHuman + 1; i < messages.length; i++) {
		const m = messages[i];
		if (m.role !== "assistant") continue;
		tools.push(...toolUsesFromAssistant(m.content));
		const t = textOf(m.content);
		if (t.trim()) text = t;
	}
	return { text, tools };
}

/** The core lexical+behavioral evaluation over the current turn's tool history. */
export function evaluateTurn(text: string, tools: ToolUse[]): GateVerdict {
	if (!text.trim()) return null;

	// (3) Activity gate: a turn that didn't build anything can't have "finished" anything.
	if (!tools.some((t) => BUILD_TOOLS[t.name])) return null;

	// (1) Meta escape: discussing the gate/framework uses words like "done" incidentally.
	if (META.test(text.toLowerCase())) return null;

	// (2) Assertive only: the claim must head a short clause, not lurk in a long sentence.
	if (!assertiveClaim(text)) return null;

	// (0a) An honest hedge always passes — never punish the downgrade.
	if (HEDGE.test(text.toLowerCase())) return null;

	// (0b) Verification vocabulary passes only when the behavior backs it.
	if (PROOF.test(text.toLowerCase())) {
		if (docOnlyMutations(tools) || observedAfterLastMutation(tools)) return null;
		return { block: true, reason: MSG_HOLLOW_PROOF };
	}

	return { block: true, reason: MSG_NO_EVIDENCE };
}

const MAX_FIRES_PER_TURN = 3; // well under the runtime's 8-continuation cap

type SessionEntryLike = { type?: string; message?: { role?: string; content?: unknown } };

export default function doneGate(pi: ExtensionAPI): void {
	let firesThisTurn = 0;

	pi.on("turn_start", async () => {
		firesThisTurn = 0;
	});

	pi.on("session_stop", async (_event, ctx) => {
		try {
			if (firesThisTurn >= MAX_FIRES_PER_TURN) return undefined;
			const entries = ctx.sessionManager.getBranch() as SessionEntryLike[];
			const messages = entries.filter((e) => e.type === "message" && e.message).map((e) => e.message!);
			const { text, tools } = extractTurnData(messages);
			const verdict = evaluateTurn(text, tools);
			if (!verdict) return undefined;
			firesThisTurn++;
			return verdict; // { decision: "block", reason }
		} catch {
			return undefined; // never break the session on a gate error
		}
	});
}
