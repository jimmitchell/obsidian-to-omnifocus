import type { ParsedTask } from "./parser";

export interface BuildUrlOpts {
	task: ParsedTask;
	tags: string[];
	project: string;
	obsidianUrl: string;
	autosave: boolean;
}

export function buildOmnifocusUrl(opts: BuildUrlOpts): string {
	const { task, tags, project, obsidianUrl, autosave } = opts;
	const params: [string, string][] = [];
	params.push(["name", task.title]);

	const noteParts: string[] = [];
	const trimmedBody = task.body.trim();
	if (trimmedBody) noteParts.push(trimmedBody);
	noteParts.push(obsidianUrl);
	params.push(["note", noteParts.join("\n\n")]);

	if (project) params.push(["project", project]);
	if (tags.length > 0) params.push(["tags", tags.join(",")]);
	if (task.fields.due) params.push(["due", task.fields.due]);
	if (task.fields.defer) params.push(["defer", task.fields.defer]);
	if (task.fields.flag) params.push(["flag", "true"]);
	if (task.fields.estimate !== undefined) {
		params.push(["estimate", String(task.fields.estimate)]);
	}
	if (autosave) params.push(["autosave", "true"]);

	return `omnifocus:///add?${encodeQuery(params)}`;
}

export const PLUGIN_BOOTSTRAP_SCRIPT =
	`(function(a){globalThis.__t2of_payload=a;PlugIn.find("org.jimmitchell.omnifocus-task-sync").actions[0].perform();})(argument)`;

export interface TaskTreeNode {
	task: ParsedTask;
	tags: string[];
	children: TaskTreeNode[];
}

export interface BuildTreeOpts {
	root: TaskTreeNode;
	project: string;
	obsidianUrl: string;
}

export function buildOmniAutomationUrlTree(opts: BuildTreeOpts): string {
	const { root, project, obsidianUrl } = opts;
	const lines: string[] = [];
	let counter = 0;

	function emit(node: TaskTreeNode, parentVar: string | null): string {
		const v = `t${counter++}`;
		emitTaskLines(lines, v, node.task, node.tags, obsidianUrl, parentVar);
		for (const child of node.children) emit(child, v);
		return v;
	}

	const rootVar = emit(root, null);
	if (project) {
		lines.push(
			`{ const p = flattenedProjects.byName(${JSON.stringify(project)}); if (p) moveTasks([${rootVar}], p); }`
		);
	}
	const script = `(() => {\n${lines.join("\n")}\n})()`;
	return `omnifocus://x-callback-url/omnijs-run?script=${encodeURIComponent(script)}`;
}

export function buildPluginInvocationUrlTree(opts: BuildTreeOpts): string {
	const { root, project, obsidianUrl } = opts;
	const payload = nodeToPayload(root, obsidianUrl);
	if (project) payload.project = project;
	return `omnifocus://x-callback-url/omnijs-run?script=${encodeURIComponent(
		PLUGIN_BOOTSTRAP_SCRIPT
	)}&arg=${encodeURIComponent(JSON.stringify(payload))}`;
}

function nodeToPayload(node: TaskTreeNode, obsidianUrl: string): Record<string, unknown> {
	const { task, tags } = node;
	const noteParts: string[] = [];
	const trimmedBody = task.body.trim();
	if (trimmedBody) noteParts.push(trimmedBody);
	noteParts.push(obsidianUrl);

	const payload: Record<string, unknown> = {
		title: task.title,
		note: noteParts.join("\n\n"),
	};
	if (tags.length > 0) payload.tags = tags;
	if (task.fields.due) payload.due = task.fields.due;
	if (task.fields.defer) payload.defer = task.fields.defer;
	if (task.fields.planned) payload.planned = task.fields.planned;
	if (task.fields.flag) payload.flag = true;
	if (task.fields.estimate !== undefined) payload.estimate = task.fields.estimate;
	if (task.fields.repeat) payload.repeat = task.fields.repeat;
	if (node.children.length > 0) {
		payload.children = node.children.map((c) => nodeToPayload(c, obsidianUrl));
	}
	return payload;
}

function emitTaskLines(
	lines: string[],
	varName: string,
	task: ParsedTask,
	tags: string[],
	obsidianUrl: string,
	parentVar: string | null
): void {
	const noteParts: string[] = [];
	const trimmedBody = task.body.trim();
	if (trimmedBody) noteParts.push(trimmedBody);
	noteParts.push(obsidianUrl);
	const note = noteParts.join("\n\n");

	const ctorArgs = parentVar
		? `${JSON.stringify(task.title)}, ${parentVar}`
		: `${JSON.stringify(task.title)}`;
	lines.push(`const ${varName} = new Task(${ctorArgs});`);
	lines.push(`${varName}.note = ${JSON.stringify(note)};`);
	if (task.fields.due) {
		lines.push(`${varName}.dueDate = ${localDateExpr(task.fields.due)};`);
	}
	if (task.fields.defer) {
		lines.push(`${varName}.deferDate = ${localDateExpr(task.fields.defer)};`);
	}
	if (task.fields.planned) {
		lines.push(
			`if ("plannedDate" in ${varName}) ${varName}.plannedDate = ${localDateExpr(task.fields.planned)};`
		);
	}
	if (task.fields.flag) {
		lines.push(`${varName}.flagged = true;`);
	}
	if (task.fields.estimate !== undefined) {
		lines.push(`${varName}.estimatedMinutes = ${task.fields.estimate};`);
	}
	if (tags.length > 0) {
		lines.push(`for (const name of ${JSON.stringify(tags)}) {`);
		lines.push(`  let tag = flattenedTags.byName(name);`);
		lines.push(`  if (!tag) tag = new Tag(name);`);
		lines.push(`  ${varName}.addTag(tag);`);
		lines.push(`}`);
	}
	if (task.fields.repeat) {
		lines.push(
			`${varName}.repetitionRule = new Task.RepetitionRule(${JSON.stringify(task.fields.repeat.rule)}, Task.RepetitionMethod[${JSON.stringify(task.fields.repeat.method)}]);`
		);
	}
}

export function buildObsidianUrl(vaultName: string, filePath: string): string {
	return `obsidian://open?${encodeQuery([
		["vault", vaultName],
		["file", filePath],
	])}`;
}

function encodeQuery(params: [string, string][]): string {
	return params
		.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
		.join("&");
}

function localDateExpr(s: string): string {
	const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
	if (!m) return `new Date(${JSON.stringify(s)})`;
	const [, y, mo, d, h, mi, se] = m;
	const args = [y, String(parseInt(mo, 10) - 1), d];
	if (h !== undefined) args.push(h, mi, se ?? "0");
	return `new Date(${args.join(", ")})`;
}
