import type { ParsedTask } from "./parser";

export interface BuildUrlOpts {
	task: ParsedTask;
	tags: string[];
	project: string;
	obsidianUrl: string;
}

export function buildOmnifocusUrl(opts: BuildUrlOpts): string {
	const { task, tags, project, obsidianUrl } = opts;
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

	return `omnifocus:///add?${encodeQuery(params)}`;
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
