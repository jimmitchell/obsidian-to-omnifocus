import { App, PluginSettingTab, Setting } from "obsidian";
import type ObsidianToOmnifocusPlugin from "./main";

export interface PluginSettings {
	defaultTags: string;
	defaultProject: string;
	tagsFrontmatterKey: string;
	projectFrontmatterKey: string;
	appendInlineTagsAsOmnifocusTags: boolean;
	skipQuickEntry: boolean;
}

export const DEFAULT_SETTINGS: PluginSettings = {
	defaultTags: "",
	defaultProject: "",
	tagsFrontmatterKey: "omnifocus_tags",
	projectFrontmatterKey: "omnifocus_project",
	appendInlineTagsAsOmnifocusTags: false,
	skipQuickEntry: false,
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
			.setName("Skip OmniFocus Quick Entry")
			.setDesc(
				"Save tasks straight to their destination instead of opening the Quick Entry window for each one."
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
