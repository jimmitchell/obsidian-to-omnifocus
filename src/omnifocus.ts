import type { ParsedTask } from "./parser";

export interface BuildUrlOpts {
	task: ParsedTask;
	tags: string[];
	project: string;
	obsidianUrl: string;
}

export function buildOmnifocusUrl(opts: BuildUrlOpts): string {
	const { task, tags, project, obsidianUrl } = opts;
	const params = new URLSearchParams();
	params.set("name", task.title);

	const noteParts: string[] = [];
	const trimmedBody = task.body.trim();
	if (trimmedBody) noteParts.push(trimmedBody);
	noteParts.push(obsidianUrl);
	params.set("note", noteParts.join("\n\n"));

	if (project) params.set("project", project);
	if (tags.length > 0) params.set("tags", tags.join(","));
	if (task.fields.due) params.set("due", task.fields.due);
	if (task.fields.defer) params.set("defer", task.fields.defer);
	if (task.fields.flag) params.set("flag", "true");
	if (task.fields.estimate !== undefined) {
		params.set("estimate", String(task.fields.estimate));
	}

	return `omnifocus:///add?${params.toString()}`;
}

export function buildObsidianUrl(vaultName: string, filePath: string): string {
	const params = new URLSearchParams();
	params.set("vault", vaultName);
	params.set("file", filePath);
	return `obsidian://open?${params.toString()}`;
}
