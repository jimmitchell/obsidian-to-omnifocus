import { Editor, MarkdownFileInfo, MarkdownView, Notice, Platform, Plugin, TFile } from "obsidian";
import { parseUncompletedTasks, type ParsedTask } from "./parser";
import {
	buildObsidianUrl,
	buildOmniAutomationUrlTree,
	buildOmnifocusUrl,
	buildPluginInvocationUrlTree,
	type TaskTreeNode,
} from "./omnifocus";
import { DEFAULT_SETTINGS, type PluginSettings, SettingsTab } from "./settings";

export default class TasksToOmnifocusPlugin extends Plugin {
	settings: PluginSettings = DEFAULT_SETTINGS;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "send-uncompleted-tasks-to-omnifocus",
			name: "Send uncompleted tasks to OmniFocus",
			editorCallback: (editor: Editor, ctx: MarkdownView | MarkdownFileInfo) => {
				this.sendTasks(editor, ctx);
			},
		});

		this.addCommand({
			id: "send-task-at-cursor-to-omnifocus",
			name: "Send task at cursor to OmniFocus",
			editorCallback: (editor: Editor, ctx: MarkdownView | MarkdownFileInfo) => {
				this.sendTasks(editor, ctx, { scope: "cursor" });
			},
		});

		this.addCommand({
			id: "send-selected-tasks-to-omnifocus",
			name: "Send selected tasks to OmniFocus",
			editorCallback: (editor: Editor, ctx: MarkdownView | MarkdownFileInfo) => {
				this.sendTasks(editor, ctx, { scope: "selection" });
			},
		});

		this.addCommand({
			id: "mark-all-tasks-complete",
			name: "Mark all tasks complete (without sending)",
			editorCallback: (editor: Editor) => {
				const tasks = parseUncompletedTasks(editor.getValue());
				if (tasks.length === 0) {
					new Notice("No uncompleted tasks in this note.");
					return;
				}
				this.markTasksComplete(editor, tasks);
				new Notice(`Marked ${tasks.length} task${tasks.length === 1 ? "" : "s"} complete.`);
			},
		});

		this.addSettingTab(new SettingsTab(this.app, this));
	}

	async loadSettings() {
		const data = (await this.loadData()) as Partial<PluginSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private sendTasks(
		editor: Editor,
		ctx: MarkdownView | MarkdownFileInfo,
		opts: { scope?: "all" | "cursor" | "selection" } = {}
	): void {
		const file = ctx.file;
		if (!file) {
			new Notice("No active file.");
			return;
		}

		const scope = opts.scope ?? "all";
		const preserveHierarchy = this.settings.preserveHierarchy;
		const allTasks = parseUncompletedTasks(editor.getValue(), { preserveHierarchy });
		let tasks = filterTasksByScope(allTasks, editor, scope);
		if (preserveHierarchy) {
			tasks = expandScopeWithDescendants(allTasks, tasks);
		}
		if (tasks.length === 0) {
			const emptyMsg =
				scope === "cursor"
					? "No uncompleted task at the cursor."
					: scope === "selection"
						? "No uncompleted tasks in the selection."
						: "No uncompleted tasks in this note.";
			new Notice(emptyMsg);
			return;
		}

		const baseTags = this.resolveTags(file);
		const project = this.resolveProject(file);
		const obsidianUrl = buildObsidianUrl(this.app.vault.getName(), file.path);
		const autosave = this.settings.skipQuickEntry;

		const omniJsModeAvailable =
			(this.settings.sendMode === "omnijs" || this.settings.sendMode === "plugin") &&
			Platform.isMacOS;

		const trees = groupIntoTrees(tasks, baseTags, this.settings.appendInlineTagsAsOmnifocusTags);
		const skipped: string[] = [];
		let hierarchyFlattened = false;

		for (const tree of trees) {
			const hasChildren = tree.children.length > 0;
			const needsOmniJs =
				treeNeedsOmniJs(tree) || (preserveHierarchy && hasChildren);
			const useOmniJs = omniJsModeAvailable && needsOmniJs;

			let url: string;
			if (useOmniJs && this.settings.sendMode === "plugin") {
				url = buildPluginInvocationUrlTree({ root: tree, project, obsidianUrl });
			} else if (useOmniJs) {
				url = buildOmniAutomationUrlTree({ root: tree, project, obsidianUrl });
			} else {
				const flatTask = tree.children.length > 0 ? foldTreeIntoFlatTask(tree) : tree.task;
				if (tree.children.length > 0 && preserveHierarchy) hierarchyFlattened = true;
				url = buildOmnifocusUrl({
					task: flatTask,
					tags: tree.tags,
					project,
					obsidianUrl,
					autosave,
				});
			}
			window.open(url);

			forEachNode(tree, (node) => {
				for (const sf of node.task.skippedFields) {
					skipped.push(`"${node.task.title}": ${sf.key} (${sf.reason})`);
				}
				if (!useOmniJs) {
					if (node.task.fields.planned) {
						skipped.push(`"${node.task.title}": planned (requires OmniAutomation or Plug-in send mode on macOS)`);
					}
					if (node.task.fields.repeat) {
						skipped.push(`"${node.task.title}": repeat (requires OmniAutomation or Plug-in send mode on macOS)`);
					}
				}
			});
		}

		this.markTasksComplete(editor, tasks);

		const summary = `Sent ${tasks.length} task${tasks.length === 1 ? "" : "s"} to OmniFocus.`;
		const notes: string[] = [];
		if (hierarchyFlattened) {
			notes.push("Hierarchy was folded into the note body — true subtasks require OmniAutomation or Plug-in send mode on macOS.");
		}
		if (skipped.length > 0) {
			notes.push(`Skipped fields:\n${skipped.join("\n")}`);
		}
		if (notes.length > 0) {
			new Notice(`${summary}\n${notes.join("\n")}`, 8000);
		} else {
			new Notice(summary);
		}
	}

	private resolveTags(file: TFile): string[] {
		const cache = this.app.metadataCache.getFileCache(file);
		const fmKey = this.settings.tagsFrontmatterKey;
		const fmValue: unknown = cache?.frontmatter?.[fmKey];
		if (Array.isArray(fmValue)) {
			return fmValue.map(String).map((s) => s.trim()).filter(Boolean);
		}
		if (typeof fmValue === "string" && fmValue.trim()) {
			return fmValue.split(",").map((s) => s.trim()).filter(Boolean);
		}
		return this.settings.defaultTags
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
	}

	private resolveProject(file: TFile): string {
		const cache = this.app.metadataCache.getFileCache(file);
		const fmKey = this.settings.projectFrontmatterKey;
		const fmValue: unknown = cache?.frontmatter?.[fmKey];
		if (typeof fmValue === "string" && fmValue.trim()) return fmValue.trim();
		return this.settings.defaultProject.trim();
	}

	private markTasksComplete(editor: Editor, tasks: ParsedTask[]): void {
		const lineSet = new Set<number>();
		for (const task of tasks) {
			for (const line of task.checkboxLines) lineSet.add(line);
		}
		const changes = Array.from(lineSet)
			.sort((a, b) => a - b)
			.map((lineNum) => {
				const line = editor.getLine(lineNum);
				const newLine = line.replace(
					/^(\s*(?:[-*+]|\d+\.)\s+\[)\s(\])/,
					"$1x$2"
				);
				return {
					from: { line: lineNum, ch: 0 },
					to: { line: lineNum, ch: line.length },
					text: newLine,
				};
			});
		editor.transaction({ changes });
	}
}

function dedupe<T>(arr: T[]): T[] {
	return Array.from(new Set(arr));
}

function filterTasksByScope(
	tasks: ParsedTask[],
	editor: Editor,
	scope: "all" | "cursor" | "selection"
): ParsedTask[] {
	if (scope === "all") return tasks;
	if (scope === "cursor") {
		const line = editor.getCursor().line;
		return tasks.filter((t) => t.checkboxLines.includes(line));
	}
	const from = editor.getCursor("from").line;
	const to = editor.getCursor("to").line;
	const lo = Math.min(from, to);
	const hi = Math.max(from, to);
	return tasks.filter((t) => t.checkboxLines.some((l) => l >= lo && l <= hi));
}

function expandScopeWithDescendants(
	allTasks: ParsedTask[],
	inScope: ParsedTask[]
): ParsedTask[] {
	const byLine = new Map<number, ParsedTask>();
	for (const t of allTasks) byLine.set(t.lineNumber, t);
	const included = new Set<number>(inScope.map((t) => t.lineNumber));
	let changed = true;
	while (changed) {
		changed = false;
		for (const t of allTasks) {
			if (included.has(t.lineNumber)) continue;
			if (t.parentLineNumber !== undefined && included.has(t.parentLineNumber)) {
				included.add(t.lineNumber);
				changed = true;
			}
		}
	}
	return allTasks.filter((t) => included.has(t.lineNumber));
}

function groupIntoTrees(
	tasks: ParsedTask[],
	baseTags: string[],
	appendInline: boolean
): TaskTreeNode[] {
	const byLine = new Map<number, TaskTreeNode>();
	const roots: TaskTreeNode[] = [];
	for (const task of tasks) {
		const tags = appendInline ? dedupe([...baseTags, ...task.inlineTags]) : [...baseTags];
		const node: TaskTreeNode = { task, tags, children: [] };
		byLine.set(task.lineNumber, node);
		const parentNode =
			task.parentLineNumber !== undefined ? byLine.get(task.parentLineNumber) : undefined;
		if (parentNode) {
			parentNode.children.push(node);
		} else {
			roots.push(node);
		}
	}
	return roots;
}

function treeNeedsOmniJs(node: TaskTreeNode): boolean {
	if (node.task.fields.planned !== undefined || node.task.fields.repeat !== undefined) {
		return true;
	}
	return node.children.some(treeNeedsOmniJs);
}

function forEachNode(node: TaskTreeNode, fn: (n: TaskTreeNode) => void): void {
	fn(node);
	for (const c of node.children) forEachNode(c, fn);
}

function foldTreeIntoFlatTask(node: TaskTreeNode): ParsedTask {
	const bodyParts: string[] = [];
	const trimmedBody = node.task.body.trim();
	if (trimmedBody) bodyParts.push(trimmedBody);
	const childList = renderChildrenAsList(node.children, 0);
	if (childList) bodyParts.push(childList);
	return { ...node.task, body: bodyParts.join("\n\n") };
}

function renderChildrenAsList(children: TaskTreeNode[], depth: number): string {
	const indent = "  ".repeat(depth);
	const out: string[] = [];
	for (const c of children) {
		out.push(`${indent}- [ ] ${c.task.title}`);
		if (c.task.body.trim()) {
			const bodyIndent = "  ".repeat(depth + 1);
			for (const bl of c.task.body.split("\n")) {
				out.push(bl ? `${bodyIndent}${bl}` : "");
			}
		}
		if (c.children.length > 0) {
			out.push(renderChildrenAsList(c.children, depth + 1));
		}
	}
	return out.join("\n");
}
