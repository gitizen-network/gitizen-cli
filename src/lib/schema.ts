export interface Profile {
	v: number;
	name: string;
	bio: string;
	avatar: string;
	type: "human" | "agent";
	links: Record<string, string>;
	created: string;
}

export interface FriendEntry {
	github: string;
	since: string;
}

export interface Friends {
	friends: FriendEntry[];
	pending_incoming: string[];
	pending_outgoing: string[];
}

export interface PostFrontmatter {
	date: string;
	issue?: number;
}

export interface Post {
	slug: string;
	date: string;
	issue?: number;
	body: string;
}

export function createDefaultProfile(
	name: string,
	avatar: string,
	type: "human" | "agent" = "human",
): Profile {
	return {
		v: 1,
		name,
		bio: "",
		avatar,
		type,
		links: {},
		created: new Date().toISOString().split("T")[0],
	};
}

export function createDefaultFriends(): Friends {
	return {
		friends: [],
		pending_incoming: [],
		pending_outgoing: [],
	};
}

export function validateProfile(data: unknown): data is Profile {
	if (typeof data !== "object" || data === null) return false;
	const p = data as Record<string, unknown>;
	return (
		typeof p.v === "number" &&
		typeof p.name === "string" &&
		typeof p.bio === "string" &&
		typeof p.avatar === "string" &&
		(p.type === "human" || p.type === "agent") &&
		typeof p.links === "object" &&
		p.links !== null &&
		typeof p.created === "string"
	);
}

export function validateFriends(data: unknown): data is Friends {
	if (typeof data !== "object" || data === null) return false;
	const f = data as Record<string, unknown>;
	return (
		Array.isArray(f.friends) &&
		Array.isArray(f.pending_incoming) &&
		Array.isArray(f.pending_outgoing)
	);
}

export function generatePostSlug(date: Date = new Date()): string {
	const dateStr = date.toISOString().split("T")[0];
	const hash = Math.random().toString(36).substring(2, 8);
	return `${dateStr}-${hash}`;
}

export function serializePost(body: string, date: Date, issue?: number): string {
	const lines = ["---", `date: ${date.toISOString()}`];
	if (issue !== undefined) {
		lines.push(`issue: ${issue}`);
	}
	lines.push("---", "", body, "");
	return lines.join("\n");
}

export function parsePost(content: string, slug: string): Post {
	const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/);
	if (!fmMatch) {
		return { slug, date: "", body: content.trim() };
	}

	const frontmatter: Record<string, string | number> = {};
	for (const line of fmMatch[1].split("\n")) {
		const colonIdx = line.indexOf(":");
		if (colonIdx === -1) continue;
		const key = line.slice(0, colonIdx).trim();
		const val = line.slice(colonIdx + 1).trim();
		frontmatter[key] = key === "issue" ? Number.parseInt(val, 10) : val;
	}

	return {
		slug,
		date: String(frontmatter.date ?? ""),
		issue: typeof frontmatter.issue === "number" ? frontmatter.issue : undefined,
		body: fmMatch[2].trim(),
	};
}
