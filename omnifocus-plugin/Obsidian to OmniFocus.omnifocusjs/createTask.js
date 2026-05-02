/*{
	"type": "action",
	"author": "Jim Mitchell",
	"identifier": "createTask",
	"version": "1.0",
	"description": "Create a task from a JSON payload sent by the Obsidian-to-OmniFocus plugin.",
	"label": "Create Task from Obsidian",
	"shortLabel": "Create Task",
	"paletteLabel": "Create Task from Obsidian"
}*/
(() => {
	const action = new PlugIn.Action(function (selection, sender) {
		const payload = globalThis.__o2of_payload;
		if (!payload || typeof payload !== "object") return;

		const t = new Task(String(payload.title || ""));
		if (typeof payload.note === "string") t.note = payload.note;
		if (payload.due) t.dueDate = localDate(payload.due);
		if (payload.defer) t.deferDate = localDate(payload.defer);
		if (payload.planned && "plannedDate" in t) {
			t.plannedDate = localDate(payload.planned);
		}
		if (payload.flag === true) t.flagged = true;
		if (typeof payload.estimate === "number") {
			t.estimatedMinutes = payload.estimate;
		}
		if (Array.isArray(payload.tags)) {
			for (const name of payload.tags) {
				let tag = flattenedTags.byName(name);
				if (!tag) tag = new Tag(name);
				t.addTag(tag);
			}
		}
		if (typeof payload.project === "string" && payload.project) {
			const p = flattenedProjects.byName(payload.project);
			if (p) moveTasks([t], p);
		}
		if (payload.repeat && payload.repeat.rule && payload.repeat.method) {
			t.repetitionRule = new Task.RepetitionRule(
				payload.repeat.rule,
				Task.RepetitionMethod[payload.repeat.method]
			);
		}
	});
	action.validate = function (selection, sender) {
		return true;
	};
	return action;

	function localDate(s) {
		const m = String(s).match(
			/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/
		);
		if (!m) return new Date(s);
		const y = +m[1], mo = +m[2] - 1, d = +m[3];
		if (m[4] === undefined) return new Date(y, mo, d);
		return new Date(y, mo, d, +m[4], +m[5], +(m[6] || 0));
	}
})();
