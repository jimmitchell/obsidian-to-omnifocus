import { Editor, MarkdownFileInfo, MarkdownView, Notice, Plugin, TFile } from "obsidian";
import { parseUncompletedTasks, type ParsedTask } from "./parser";
import { buildObsidianUrl, buildOmnifocusUrl } from "./omnifocus";
import { DEFAULT_SETTINGS, type PluginSettings, SettingsTab } from "./settings";

export default class ObsidianToOmnifocusPlugin extends Plugin {
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

		this.addSettingTab(new SettingsTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private sendTasks(editor: Editor, ctx: MarkdownView | MarkdownFileInfo): void {
		const file = ctx.file;
		if (!file) {
			new Notice("No active file.");
			return;
		}

		const tasks = parseUncompletedTasks(editor.getValue());
		if (tasks.length === 0) {
			new Notice("No uncompleted tasks in this note.");
			return;
		}

		const baseTags = this.resolveTags(file);
		const project = this.resolveProject(file);
		const obsidianUrl = buildObsidianUrl(this.app.vault.getName(), file.path);

		const skipped: string[] = [];
		for (const task of tasks) {
			const taskTags = [...baseTags];
			if (this.settings.appendInlineTagsAsOmnifocusTags) {
				taskTags.push(...task.inlineTags);
			}
			const url = buildOmnifocusUrl({
				task,
				tags: dedupe(taskTags),
				project,
				obsidianUrl,
				autosave: this.settings.skipQuickEntry,
			});
			window.open(url);
			for (const sf of task.skippedFields) {
				skipped.push(`"${task.title}": ${sf.key} (${sf.reason})`);
			}
		}

		this.markTasksComplete(editor, tasks);

		const summary = `Sent ${tasks.length} task${tasks.length === 1 ? "" : "s"} to OmniFocus.`;
		if (skipped.length > 0) {
			new Notice(`${summary}\nSkipped fields:\n${skipped.join("\n")}`, 8000);
		} else {
			new Notice(summary);
		}
	}

	private resolveTags(file: TFile): string[] {
		const cache = this.app.metadataCache.getFileCache(file);
		const fmKey = this.settings.tagsFrontmatterKey;
		const fmValue = cache?.frontmatter?.[fmKey];
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
		const fmValue = cache?.frontmatter?.[fmKey];
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
