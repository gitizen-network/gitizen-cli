import { describe, expect, it } from "vitest";
import {
	createDefaultFriends,
	createDefaultProfile,
	generatePostSlug,
	parsePost,
	serializePost,
	validateFriends,
	validateProfile,
} from "../../src/lib/schema.js";

describe("createDefaultProfile", () => {
	it("creates a valid profile with defaults", () => {
		const profile = createDefaultProfile("Alice", "https://avatar.url/alice.png");
		expect(profile.v).toBe(1);
		expect(profile.name).toBe("Alice");
		expect(profile.bio).toBe("");
		expect(profile.avatar).toBe("https://avatar.url/alice.png");
		expect(profile.type).toBe("human");
		expect(profile.links).toEqual({});
		expect(profile.created).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it("supports agent type", () => {
		const profile = createDefaultProfile("Bot", "https://avatar.url/bot.png", "agent");
		expect(profile.type).toBe("agent");
	});
});

describe("createDefaultFriends", () => {
	it("creates empty friends structure", () => {
		const friends = createDefaultFriends();
		expect(friends.friends).toEqual([]);
		expect(friends.pending_incoming).toEqual([]);
		expect(friends.pending_outgoing).toEqual([]);
	});
});

describe("validateProfile", () => {
	it("accepts valid profile", () => {
		expect(
			validateProfile({
				v: 1,
				name: "Alice",
				bio: "Hello",
				avatar: "https://example.com/a.png",
				type: "human",
				links: {},
				created: "2026-03-15",
			}),
		).toBe(true);
	});

	it("rejects null", () => {
		expect(validateProfile(null)).toBe(false);
	});

	it("rejects missing fields", () => {
		expect(validateProfile({ v: 1, name: "Alice" })).toBe(false);
	});

	it("rejects invalid type", () => {
		expect(
			validateProfile({
				v: 1,
				name: "A",
				bio: "",
				avatar: "",
				type: "robot",
				links: {},
				created: "",
			}),
		).toBe(false);
	});
});

describe("validateFriends", () => {
	it("accepts valid friends", () => {
		expect(
			validateFriends({
				friends: [{ github: "alice", since: "2026-03-14" }],
				pending_incoming: [],
				pending_outgoing: [],
			}),
		).toBe(true);
	});

	it("rejects missing arrays", () => {
		expect(validateFriends({ friends: [] })).toBe(false);
	});
});

describe("generatePostSlug", () => {
	it("starts with date in YYYY-MM-DD format", () => {
		const date = new Date("2026-03-15T12:00:00Z");
		const slug = generatePostSlug(date);
		expect(slug).toMatch(/^2026-03-15-[a-z0-9]+$/);
	});

	it("generates unique slugs", () => {
		const slugs = new Set(Array.from({ length: 10 }, () => generatePostSlug()));
		expect(slugs.size).toBe(10);
	});
});

describe("serializePost / parsePost", () => {
	it("round-trips a post with issue", () => {
		const date = new Date("2026-03-15T10:30:00.000Z");
		const body = "Hello world!";
		const serialized = serializePost(body, date, 3);

		expect(serialized).toContain("date: 2026-03-15T10:30:00.000Z");
		expect(serialized).toContain("issue: 3");
		expect(serialized).toContain("Hello world!");

		const parsed = parsePost(serialized, "2026-03-15-abc123");
		expect(parsed.slug).toBe("2026-03-15-abc123");
		expect(parsed.date).toBe("2026-03-15T10:30:00.000Z");
		expect(parsed.issue).toBe(3);
		expect(parsed.body).toBe("Hello world!");
	});

	it("handles post without issue", () => {
		const date = new Date("2026-03-15T10:30:00.000Z");
		const serialized = serializePost("Test", date);
		const parsed = parsePost(serialized, "test-slug");
		expect(parsed.issue).toBeUndefined();
		expect(parsed.body).toBe("Test");
	});

	it("handles plain text without frontmatter", () => {
		const parsed = parsePost("Just some text", "slug");
		expect(parsed.body).toBe("Just some text");
		expect(parsed.date).toBe("");
	});
});
