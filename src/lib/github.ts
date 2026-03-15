import { Octokit } from "octokit";

let cachedClient: Octokit | null = null;

export function getOctokit(token: string): Octokit {
	if (cachedClient) return cachedClient;
	cachedClient = new Octokit({ auth: token });
	return cachedClient;
}

export function resetClient(): void {
	cachedClient = null;
}
