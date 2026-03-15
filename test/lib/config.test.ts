import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadConfig, requireAuth, saveConfig } from "../../src/lib/config.js";
import { AuthError } from "../../src/utils/errors.js";

describe("config", () => {
	const originalEnv = process.env.XDG_CONFIG_HOME;
	let tmpDir: string;

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "gitizen-test-"));
		process.env.XDG_CONFIG_HOME = tmpDir;
	});

	afterEach(() => {
		process.env.XDG_CONFIG_HOME = originalEnv;
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	it("returns null when no config exists", () => {
		expect(loadConfig()).toBeNull();
	});

	it("saves and loads config", () => {
		const config = { token: "ghp_test123", username: "alice" };
		saveConfig(config);
		const loaded = loadConfig();
		expect(loaded).toEqual(config);
	});

	it("creates config file with restricted permissions", () => {
		saveConfig({ token: "ghp_secret", username: "bob" });
		const configPath = path.join(tmpDir, "gitizen", "config.json");
		const stat = fs.statSync(configPath);
		// 0o600 = owner read/write only
		expect(stat.mode & 0o777).toBe(0o600);
	});

	it("requireAuth throws when not authenticated", () => {
		expect(() => requireAuth()).toThrow(AuthError);
	});

	it("requireAuth returns config when authenticated", () => {
		saveConfig({ token: "ghp_test", username: "alice" });
		const config = requireAuth();
		expect(config.username).toBe("alice");
	});
});
