export interface TaskFields {
	due?: string;
	defer?: string;
	planned?: string;
	flag?: boolean;
	estimate?: number;
	repeat?: RepeatRule;
}

export interface RepeatRule {
	rule: string;
	method: "DueDate" | "Fixed" | "Start" | "Completion";
}

export interface SkippedField {
	key: string;
	value: string;
	reason: string;
}

export interface ParsedTask {
	lineNumber: number;
	title: string;
	body: string;
	checkboxLines: number[];
	fields: TaskFields;
	inlineTags: string[];
	skippedFields: SkippedField[];
}

const CHECKBOX_RE = /^(\s*)(?:[-*+]|\d+\.)\s+\[([ xX])\]\s+(.*)$/;
const DV_FIELD_RE = /\[([a-zA-Z][a-zA-Z0-9_-]*)\s*::\s*([^\]]+)\]/g;
const INLINE_TAG_RE = /(^|\s)#([\p{L}\p{N}_/-]+)/gu;

export function parseUncompletedTasks(content: string): ParsedTask[] {
	const lines = content.split("\n");
	const tasks: ParsedTask[] = [];

	let i = 0;
	while (i < lines.length) {
		const match = lines[i].match(CHECKBOX_RE);
		if (!match) {
			i++;
			continue;
		}

		const [, indent, state, rest] = match;
		const taskIndent = indent.length;

		if (state !== " ") {
			i = consumeIndentedBlock(lines, i + 1, taskIndent);
			continue;
		}

		const checkboxLines = [i];
		const bodyLines: string[] = [];
		const bodyEnd = consumeIndentedBlock(lines, i + 1, taskIndent, (lineIdx, line) => {
			bodyLines.push(line);
			if (CHECKBOX_RE.test(line)) checkboxLines.push(lineIdx);
		});

		const parsed = parseTaskLine(rest);
		tasks.push({
			lineNumber: i,
			title: parsed.title,
			body: dedentBody(bodyLines),
			checkboxLines,
			fields: parsed.fields,
			inlineTags: parsed.inlineTags,
			skippedFields: parsed.skippedFields,
		});

		i = bodyEnd;
	}

	return tasks;
}

function consumeIndentedBlock(
	lines: string[],
	startIdx: number,
	parentIndent: number,
	onLine?: (idx: number, line: string) => void
): number {
	let j = startIdx;
	while (j < lines.length) {
		const line = lines[j];
		if (line.trim() === "") {
			let k = j + 1;
			while (k < lines.length && lines[k].trim() === "") k++;
			if (k >= lines.length) break;
			const nextIndent = leadingIndent(lines[k]);
			if (nextIndent <= parentIndent) break;
			if (onLine) onLine(j, line);
			j++;
			continue;
		}
		if (leadingIndent(line) <= parentIndent) break;
		if (onLine) onLine(j, line);
		j++;
	}
	return j;
}

function leadingIndent(line: string): number {
	const m = line.match(/^(\s*)/);
	return m ? m[1].length : 0;
}

function dedentBody(lines: string[]): string {
	if (lines.length === 0) return "";
	const indents = lines
		.filter((l) => l.trim() !== "")
		.map(leadingIndent);
	if (indents.length === 0) return "";
	const minIndent = Math.min(...indents);
	return lines.map((l) => l.slice(minIndent)).join("\n").replace(/\s+$/, "");
}

interface ParsedLine {
	title: string;
	fields: TaskFields;
	inlineTags: string[];
	skippedFields: SkippedField[];
}

function parseTaskLine(text: string): ParsedLine {
	const fields: TaskFields = {};
	const skippedFields: SkippedField[] = [];

	let title = text.replace(DV_FIELD_RE, (orig, rawKey: string, rawValue: string) => {
		const key = rawKey.toLowerCase();
		const value = rawValue.trim();
		switch (key) {
			case "due": {
				const d = parseDate(value);
				if (d) fields.due = d;
				else skippedFields.push({ key: rawKey, value, reason: "invalid date" });
				return "";
			}
			case "defer":
			case "start":
			case "scheduled": {
				const d = parseDate(value);
				if (d) fields.defer = d;
				else skippedFields.push({ key: rawKey, value, reason: "invalid date" });
				return "";
			}
			case "planned":
			case "planneddate":
			case "plandate": {
				const d = parseDate(value);
				if (d) fields.planned = d;
				else skippedFields.push({ key: rawKey, value, reason: "invalid date" });
				return "";
			}
			case "repeat":
			case "repeats":
			case "repetition": {
				const r = parseRepeatRule(value);
				if (r) fields.repeat = r;
				else skippedFields.push({ key: rawKey, value, reason: "invalid repeat rule" });
				return "";
			}
			case "flag":
			case "flagged": {
				fields.flag = isTruthy(value);
				return "";
			}
			case "estimate":
			case "duration": {
				const m = parseEstimate(value);
				if (m !== null) fields.estimate = m;
				else skippedFields.push({ key: rawKey, value, reason: "invalid duration" });
				return "";
			}
			default:
				return orig;
		}
	});

	const inlineTags: string[] = [];
	title = title.replace(INLINE_TAG_RE, (_full: string, sep: string, tag: string) => {
		inlineTags.push(tag);
		return sep;
	});

	if (title.includes("\u{1F6A9}")) {
		fields.flag = true;
		title = title.replace(/\u{1F6A9}/gu, "");
	}

	title = title.replace(/\s+/g, " ").trim();
	return { title, fields, inlineTags, skippedFields };
}

function parseDate(s: string): string | null {
	const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
	const dateTime = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/;
	if (!dateOnly.test(s) && !dateTime.test(s)) return null;
	const d = new Date(s.replace(" ", "T"));
	if (isNaN(d.getTime())) return null;
	return s.replace("T", " ");
}

function parseEstimate(s: string): number | null {
	const trimmed = s.trim().toLowerCase();
	if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
	let total = 0;
	let matched = false;
	const hour = trimmed.match(/(\d+)\s*h/);
	const min = trimmed.match(/(\d+)\s*m(?!s)/);
	if (hour) {
		total += parseInt(hour[1], 10) * 60;
		matched = true;
	}
	if (min) {
		total += parseInt(min[1], 10);
		matched = true;
	}
	return matched ? total : null;
}

function isTruthy(s: string): boolean {
	const t = s.trim().toLowerCase();
	return t === "true" || t === "yes" || t === "1" || t === "y";
}

const FREQ_BY_UNIT: Record<string, string> = {
	day: "DAILY",
	days: "DAILY",
	week: "WEEKLY",
	weeks: "WEEKLY",
	month: "MONTHLY",
	months: "MONTHLY",
	year: "YEARLY",
	years: "YEARLY",
};

function parseRepeatRule(s: string): RepeatRule | null {
	const trimmed = s.trim();
	if (!trimmed) return null;
	const lower = trimmed.toLowerCase();

	switch (lower) {
		case "daily":
			return { rule: "FREQ=DAILY", method: "DueDate" };
		case "weekly":
			return { rule: "FREQ=WEEKLY", method: "DueDate" };
		case "monthly":
			return { rule: "FREQ=MONTHLY", method: "DueDate" };
		case "yearly":
		case "annually":
			return { rule: "FREQ=YEARLY", method: "DueDate" };
	}

	const everyMatch = lower.match(/^every\s+(\d+)\s+(day|days|week|weeks|month|months|year|years)$/);
	if (everyMatch) {
		const n = parseInt(everyMatch[1], 10);
		const freq = FREQ_BY_UNIT[everyMatch[2]];
		if (n >= 1 && freq) return { rule: `FREQ=${freq};INTERVAL=${n}`, method: "DueDate" };
	}

	if (/^FREQ=[A-Z]+/i.test(trimmed)) {
		return { rule: trimmed, method: "DueDate" };
	}

	return null;
}
