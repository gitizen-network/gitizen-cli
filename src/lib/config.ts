import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { AuthError } from "../utils/errors.js";

export interface GitizenConfig {
	token: string;
	username: string;
}

function getConfigDir(): string {
	const xdg = process.env.XDG_CONFIG_HOME;
	const base = xdg || path.join(os.homedir(), ".config");
	return path.join(base, "gitizen");
}

function getConfigPath(): string {
	return path.join(getConfigDir(), "config.json");
}

export function loadConfig(): GitizenConfig | null {
	const configPath = getConfigPath();
	if (!fs.existsSync(configPath)) return null;
	const raw = fs.readFileSync(configPath, "utf-8");
	return JSON.parse(raw) as GitizenConfig;
}

export function saveConfig(config: GitizenConfig): void {
	const dir = getConfigDir();
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(getConfigPath(), `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
}

export function requireAuth(): GitizenConfig {
	const config = loadConfig();
	if (!config) throw new AuthError();
	return config;
}
