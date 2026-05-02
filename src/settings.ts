import { App, PluginSettingTab, Setting } from "obsidian";
import type ObsidianToOmnifocusPlugin from "./main";

export type SendMode = "url" | "omnijs" | "plugin";

export interface PluginSettings {
	defaultTags: string;
	defaultProject: string;
	tagsFrontmatterKey: string;
	projectFrontmatterKey: string;
	appendInlineTagsAsOmnifocusTags: boolean;
	skipQuickEntry: boolean;
	sendMode: SendMode;
}

export const DEFAULT_SETTINGS: PluginSettings = {
	defaultTags: "",
	defaultProject: "",
	tagsFrontmatterKey: "omnifocus_tags",
	projectFrontmatterKey: "omnifocus_project",
	appendInlineTagsAsOmnifocusTags: false,
	skipQuickEntry: false,
	sendMode: "url",
};

export class SettingsTab extends PluginSettingTab {
	plugin: ObsidianToOmnifocusPlugin;

	constructor(app: App, plugin: ObsidianToOmnifocusPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Default tags")
			.setDesc(
				"Comma-separated OmniFocus tags applied to every sent task. Frontmatter override takes precedence."
			)
			.addText((text) =>
				text
					.setPlaceholder("@from-obsidian, @inbox-review")
					.setValue(this.plugin.settings.defaultTags)
					.onChange(async (value) => {
						this.plugin.settings.defaultTags = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Default project")
			.setDesc(
				"OmniFocus project name. Leave blank to send to inbox. Frontmatter override takes precedence."
			)
			.addText((text) =>
				text
					.setPlaceholder("(inbox)")
					.setValue(this.plugin.settings.defaultProject)
					.onChange(async (value) => {
						this.plugin.settings.defaultProject = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Tags frontmatter key")
			.setDesc(
				"YAML frontmatter key on a note that overrides default tags. Accepts a list or a comma-separated string."
			)
			.addText((text) =>
				text
					.setPlaceholder("omnifocus_tags")
					.setValue(this.plugin.settings.tagsFrontmatterKey)
					.onChange(async (value) => {
						this.plugin.settings.tagsFrontmatterKey =
							value.trim() || "omnifocus_tags";
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Project frontmatter key")
			.setDesc("YAML frontmatter key on a note that overrides the default project.")
			.addText((text) =>
				text
					.setPlaceholder("omnifocus_project")
					.setValue(this.plugin.settings.projectFrontmatterKey)
					.onChange(async (value) => {
						this.plugin.settings.projectFrontmatterKey =
							value.trim() || "omnifocus_project";
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Send mode")
			.setDesc(
				"URL scheme works everywhere with no prompts but cannot set plannedDate or repeats. OmniAutomation (macOS) supports those fields but prompts on every send. Plug-in (macOS, install required) supports those fields and prompts only once. Plain tasks always use the URL scheme. iOS always uses the URL scheme."
			)
			.addDropdown((dd) =>
				dd
					.addOption("url", "URL scheme (omnifocus:///add)")
					.addOption("omnijs", "OmniAutomation (macOS, prompts every send)")
					.addOption("plugin", "OmniFocus plug-in (macOS, install required, prompts once)")
					.setValue(this.plugin.settings.sendMode)
					.onChange(async (value) => {
						this.plugin.settings.sendMode = value as SendMode;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Skip OmniFocus Quick Entry")
			.setDesc(
				"Save tasks straight to their destination instead of opening the Quick Entry window for each one. No effect in OmniAutomation mode (Quick Entry is never opened there)."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.skipQuickEntry)
					.onChange(async (value) => {
						this.plugin.settings.skipQuickEntry = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Forward inline #tags")
			.setDesc(
				"When enabled, #tags written on the task line are added as OmniFocus tags (combined with default/frontmatter tags)."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.appendInlineTagsAsOmnifocusTags)
					.onChange(async (value) => {
						this.plugin.settings.appendInlineTagsAsOmnifocusTags = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
