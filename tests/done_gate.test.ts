/**
 * done-gate behavior tests — drive the exported gate logic with synthetic turns.
 *
 * Runner-agnostic on purpose: executes under bun, deno (--no-check), or modern node
 * (type stripping). Each case builds a message list (human turn -> assistant tool uses ->
 * final assistant text), runs extractTurnData + evaluateTurn, and asserts the verdict
 * (null = stop allowed; block reason fragment identifies which message fired).
 *
 *   bun run tests/done_gate.test.ts        # or:
 *   deno run --no-check -A tests/done_gate.test.ts
 */
import { strict as assert } from "node:assert";
import { evaluateTurn, extractTurnData } from "../.omp/extensions/done-gate.ts";

type Entry = { role?: string; content?: unknown };

const human = (text: string): Entry => ({ role: "user", content: [{ type: "text", text }] });
const toolMsg = (name: string, input: Record<string, unknown> = {}): Entry => ({
	role: "assistant",
	content: [{ type: "toolCall", name, arguments: input }],
});
const assistantText = (text: string): Entry => ({ role: "assistant", content: [{ type: "text", text }] });

function run(tools: Array<[string, Record<string, unknown>?]>, finalText: string) {
	const messages: Entry[] = [human("please do the task")];
	for (const [name, input] of tools) messages.push(toolMsg(name, input ?? {}));
	messages.push(assistantText(finalText));
	const data = extractTurnData(messages);
	return evaluateTurn(data.text, data.tools);
}

const EDIT_CODE: [string, Record<string, unknown>] = ["edit", { file_path: "src/app.py" }];
const EDIT_DOC: [string, Record<string, unknown>] = ["edit", { file_path: "README.md" }];
const BASH: [string, Record<string, unknown>] = ["bash", { command: "pytest -q" }];
const BROWSER: [string, Record<string, unknown>] = ["browser", { url: "http://localhost:3000" }];

const CASES: Array<{ label: string; tools: Array<[string, Record<string, unknown>?]>; text: string; blocked: boolean; frag?: string }> = [
	{ label: "discussion turn, bare claim -> allowed (activity gate)", tools: [], text: "Done. The feature is complete.", blocked: false },
	{ label: "edited code, bare 'Done.' -> blocked (no evidence)", tools: [EDIT_CODE], text: "Done. The feature is complete.", blocked: true, frag: "claimed completion" },
	{ label: "edited code, 'verified' but ran NOTHING -> blocked (hollow proof)", tools: [EDIT_CODE], text: "Done — I verified it works.", blocked: true, frag: "never seen" },
	{ label: "'confirmed' cheat with zero observation -> blocked (hollow proof)", tools: [EDIT_CODE], text: "Complete. I confirm everything is correct.", blocked: true, frag: "never seen" },
	{ label: "edit then bash, 'tests pass' -> allowed (proof backed by behavior)", tools: [EDIT_CODE, BASH], text: "Done — I ran the tests and they pass.", blocked: false },
	{ label: "bash BEFORE last edit, 'verified' -> blocked (final state never observed)", tools: [BASH, EDIT_CODE], text: "Done — verified earlier, all good to go.", blocked: true, frag: "never seen" },
	{ label: "edit then browser drive, 'verified' -> allowed (browser counts as observing)", tools: [EDIT_CODE, BROWSER], text: "Done — verified in the browser.", blocked: false },
	{ label: "doc-only edit, 'verified' -> allowed (nothing to run for prose)", tools: [EDIT_DOC], text: "Done — reworded the section, verified the links.", blocked: false },
	{ label: "doc-only edit, bare 'Done.' -> still blocked (lexical layer holds)", tools: [EDIT_DOC], text: "Done. All finished.", blocked: true, frag: "claimed completion" },
	{ label: "honest hedge -> always allowed", tools: [EDIT_CODE], text: "The code is written but not yet verified live.", blocked: false },
	{ label: "hedge with completion word -> allowed (honesty never punished)", tools: [EDIT_CODE], text: "Done with the edits, but this is unverified — needs a live run.", blocked: false },
	{ label: "bash-only turn, 'confirmed' -> allowed (execution is itself observation)", tools: [BASH], text: "Done — migration ran, confirmed row counts.", blocked: false },
	{ label: "meta discussion about the gate -> allowed", tools: [EDIT_CODE], text: "The done-gate is now stricter. Done.", blocked: false },
];

let failures = 0;

for (const c of CASES) {
	try {
		const verdict = run(c.tools, c.text);
		if (c.blocked) {
			assert.ok(verdict?.block === true, `expected block, got ${JSON.stringify(verdict)}`);
			assert.ok(c.frag === undefined || verdict.reason.includes(c.frag), `reason missing ${c.frag}: ${verdict?.reason}`);
		} else {
			assert.equal(verdict, null);
		}
		console.log(`  PASS  ${c.label}`);
	} catch (e) {
		failures++;
		console.log(`  FAIL  ${c.label}\n        ${e}`);
	}
}

// Tool results carry role "toolResult" in OMP transcripts — they must not count as human turns.
try {
	const data = extractTurnData([
		toolMsg("edit", { file_path: "a.ts" }),
		{ role: "toolResult", content: [{ type: "text", text: "edited" }] },
		assistantText("All set."),
	]);
	assert.deepEqual(data.tools.map((t) => t.name), ["edit"]);
	assert.equal(evaluateTurn(data.text, data.tools)?.block, true);
	console.log("  PASS  toolResult-role messages don't reset the turn boundary");
} catch (e) {
	failures++;
	console.log(`  FAIL  toolResult-role messages don't reset the turn boundary\n        ${e}`);
}

console.log(`done_gate.test: ${CASES.length + 1 - failures}/${CASES.length + 1} passed`);
if (failures) process.exit(1);
