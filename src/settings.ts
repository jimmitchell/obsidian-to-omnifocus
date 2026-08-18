import {
	App,
	Platform,
	PluginSettingTab,
	Setting,
	requireApiVersion,
	type SettingControl,
	type SettingDefinition,
	type SettingDefinitionItem,
} from "obsidian";
import type TasksToOmnifocusPlugin from "./main";

export type SendMode = "url" | "omnijs" | "plugin";

export interface PluginSettings {
	defaultTags: string;
	defaultProject: string;
	tagsFrontmatterKey: string;
	projectFrontmatterKey: string;
	appendInlineTagsAsOmnifocusTags: boolean;
	skipQuickEntry: boolean;
	sendMode: SendMode;
	preserveHierarchy: boolean;
}

export const DEFAULT_SETTINGS: PluginSettings = {
	defaultTags: "",
	defaultProject: "",
	tagsFrontmatterKey: "omnifocus_tags",
	projectFrontmatterKey: "omnifocus_project",
	appendInlineTagsAsOmnifocusTags: false,
	skipQuickEntry: false,
	sendMode: "url",
	preserveHierarchy: false,
};

/** Resolve a `boolean | (() => boolean)` predicate, defaulting to `fallback`. */
function resolvePredicate(
	value: boolean | (() => boolean) | undefined,
	fallback: boolean
): boolean {
	if (value === undefined) return fallback;
	return typeof value === "function" ? value() : value;
}

export class SettingsTab extends PluginSettingTab {
	plugin: TasksToOmnifocusPlugin;

	constructor(app: App, plugin: TasksToOmnifocusPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	/**
	 * Single source of truth for the settings tab. Obsidian 1.13+ renders this
	 * declaratively (and indexes it for settings search); older versions fall
	 * back to `display()` below, which interprets this same array.
	 *
	 * Called on every `update()` and once at registration for search indexing,
	 * so it must stay cheap — literals and closures only, no I/O.
	 */
	getSettingDefinitions(): SettingDefinitionItem[] {
		const defs: SettingDefinitionItem<keyof PluginSettings>[] = [
			{
				type: "group",
				heading: "Defaults",
				items: [
					{
						name: "Default tags",
						desc: "Comma-separated OmniFocus tags applied to every sent task. Frontmatter override takes precedence.",
						aliases: ["contexts", "labels"],
						control: {
							type: "text",
							key: "defaultTags",
							placeholder: "@from-obsidian, @inbox-review",
						},
					},
					{
						name: "Default project",
						desc: "OmniFocus project name. Leave blank to send to inbox. Frontmatter override takes precedence.",
						aliases: ["inbox", "folder", "destination"],
						control: {
							type: "text",
							key: "defaultProject",
							placeholder: "(inbox)",
						},
					},
				],
			},
			{
				type: "group",
				heading: "Frontmatter keys",
				items: [
					{
						name: "Tags frontmatter key",
						desc: "YAML frontmatter key on a note that overrides default tags. Accepts a list or a comma-separated string.",
						aliases: [
							"yaml",
							"properties",
							"metadata",
							"front matter",
							"omnifocus_tags",
						],
						control: {
							type: "text",
							key: "tagsFrontmatterKey",
							placeholder: "omnifocus_tags",
							validate: (value) =>
								value.trim() ? undefined : "Frontmatter key cannot be empty.",
						},
					},
					{
						name: "Project frontmatter key",
						desc: "YAML frontmatter key on a note that overrides the default project.",
						aliases: [
							"yaml",
							"properties",
							"metadata",
							"front matter",
							"omnifocus_project",
						],
						control: {
							type: "text",
							key: "projectFrontmatterKey",
							placeholder: "omnifocus_project",
							validate: (value) =>
								value.trim() ? undefined : "Frontmatter key cannot be empty.",
						},
					},
				],
			},
			{
				type: "group",
				heading: "Sending",
				items: [
					{
						name: "Send mode",
						desc: "URL scheme works everywhere with no prompts but cannot set plannedDate or repeats. OmniAutomation (macOS) supports those fields but prompts on every send. Plug-in (macOS, install required) supports those fields and prompts only once. Plain tasks always use the URL scheme. iOS always uses the URL scheme.",
						aliases: [
							"url scheme",
							"x-callback",
							"omniautomation",
							"omnijs",
							"applescript",
							"automation",
						],
						control: {
							type: "dropdown",
							key: "sendMode",
							options: {
								url: "URL scheme (omnifocus:///add)",
								omnijs: "OmniAutomation (macOS, prompts every send)",
								plugin: "OmniFocus plug-in (macOS, install required, prompts once)",
							},
						},
					},
					{
						name: "Skip OmniFocus Quick Entry",
						desc: "Save tasks straight to their destination instead of opening the Quick Entry window for each one. No effect in OmniAutomation or Plug-in mode (Quick Entry is never opened there).",
						aliases: ["autosave", "quick entry", "prompt"],
						control: {
							type: "toggle",
							key: "skipQuickEntry",
							// Quick Entry is never opened in omnijs/plug-in mode, but those
							// modes only take effect on macOS (main.ts gates them on
							// Platform.isMacOS), so on iOS autosave is still in play.
							disabled: () =>
								Platform.isMacOS && this.plugin.settings.sendMode !== "url",
						},
					},
					{
						name: "Preserve task hierarchy",
						desc: "When on, nested checkboxes become subtasks in OmniFocus instead of being folded into the parent task's note. True subtasks require OmniAutomation or Plug-in send mode (macOS); URL scheme mode falls back to today's body-folding behavior.",
						aliases: ["subtasks", "nested", "indent", "children", "action group"],
						control: { type: "toggle", key: "preserveHierarchy" },
					},
					{
						name: "Forward inline #tags",
						desc: "When enabled, #tags written on the task line are added as OmniFocus tags (combined with default/frontmatter tags).",
						aliases: ["hashtag", "inline tags"],
						control: { type: "toggle", key: "appendInlineTagsAsOmnifocusTags" },
					},
				],
			},
			{
				type: "group",
				heading: "Support",
				items: [
					{
						name: "Support development",
						desc: "If this plugin is useful to you, you can buy me a coffee. Thanks!",
						aliases: ["donate", "coffee", "funding", "sponsor"],
						render: (setting) => {
							setting.addButton((button) =>
								button
									.setButtonText("Buy me a coffee")
									.setCta()
									.onClick(() => {
										window.open("https://buymeacoffee.com/jim.mitchell");
									})
							);
						},
					},
				],
			},
		];
		return defs;
	}

	getControlValue(key: string): unknown {
		return this.plugin.settings[key as keyof PluginSettings];
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		(this.plugin.settings as unknown as Record<string, unknown>)[key] = value;
		await this.plugin.saveSettings();
		// Send mode gates the Quick Entry toggle; re-evaluate disabled predicates.
		if (requireApiVersion("1.13.0")) this.refreshDomState();
	}

	/**
	 * Fallback renderer for Obsidian < 1.13, which has no
	 * `getSettingDefinitions()`. Interprets the same definitions so the two
	 * paths cannot drift. Obsidian 1.13+ never calls this.
	 */
	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		for (const item of this.getSettingDefinitions()) {
			if ("type" in item) {
				// Only groups are used here; lists and pages have no pre-1.13 analogue.
				if (item.type !== "group" || !resolvePredicate(item.visible, true)) continue;
				if (item.heading) {
					new Setting(containerEl).setName(item.heading).setHeading();
				}
				for (const child of item.items ?? []) {
					if ("type" in child) continue; // nested pages: not supported pre-1.13
					this.renderLegacySetting(child);
				}
			} else {
				this.renderLegacySetting(item);
			}
		}
	}

	private renderLegacySetting(def: SettingDefinition): void {
		if (!resolvePredicate(def.visible, true)) return;

		const setting = new Setting(this.containerEl).setName(def.name);
		if (def.desc) setting.setDesc(def.desc);

		if (def.render) {
			// `SettingGroup` has no pre-1.13 equivalent. Safe only because every
			// `render` definition in this file ignores its second argument.
			def.render(setting, undefined as never);
			return;
		}

		if (def.action) {
			const { action } = def;
			setting.settingEl.addEventListener("click", () => action(setting.settingEl, 0));
			if (resolvePredicate(def.disabled, false)) setting.setDisabled(true);
			return;
		}

		if (def.control) this.addLegacyControl(setting, def.control);
	}

	private addLegacyControl(setting: Setting, control: SettingControl): void {
		const { key } = control;
		const disabled = resolvePredicate(control.disabled, false);
		// `validate` is intentionally not run here: main.ts normalizes the
		// frontmatter keys at the read site, which covers this path too.

		switch (control.type) {
			case "toggle":
				setting.addToggle((toggle) =>
					toggle
						.setValue(Boolean(this.getControlValue(key) ?? control.defaultValue))
						.setDisabled(disabled)
						// Re-render so other settings' `disabled` predicates update.
						.onChange(async (value) => {
							await this.setControlValue(key, value);
							this.display();
						})
				);
				break;
			case "dropdown":
				setting.addDropdown((dropdown) => {
					for (const [value, label] of Object.entries(control.options)) {
						dropdown.addOption(value, label);
					}
					dropdown
						.setValue(String(this.getControlValue(key) ?? control.defaultValue ?? ""))
						.setDisabled(disabled)
						.onChange(async (value) => {
							await this.setControlValue(key, value);
							this.display();
						});
				});
				break;
			case "text":
				setting.addText((text) => {
					if (control.placeholder) text.setPlaceholder(control.placeholder);
					text
						.setValue(String(this.getControlValue(key) ?? control.defaultValue ?? ""))
						.setDisabled(disabled)
						// No re-render: it would steal focus mid-typing.
						.onChange((value) => void this.setControlValue(key, value));
				});
				break;
			default:
				// No other control types are used by this plugin.
				break;
		}
	}
}
