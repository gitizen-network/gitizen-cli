import type { Octokit } from "octokit";
import { ApiError, RepoNotFoundError } from "../utils/errors.js";

const REPO_NAME = "gitizen";

export async function repoExists(octokit: Octokit, owner: string): Promise<boolean> {
	try {
		await octokit.rest.repos.get({ owner, repo: REPO_NAME });
		return true;
	} catch (err: unknown) {
		if (isHttpError(err, 404)) return false;
		throw err;
	}
}

export async function createGitizenRepo(octokit: Octokit): Promise<void> {
	await octokit.rest.repos.createForAuthenticatedUser({
		name: REPO_NAME,
		description: "My Gitizen profile — github.com/gitizen-network/cli",
		auto_init: false,
		has_issues: true,
		has_projects: false,
		has_wiki: false,
		topics: ["gitizen"],
	});
}

export async function writeFile(
	octokit: Octokit,
	owner: string,
	filePath: string,
	content: string,
	message: string,
): Promise<void> {
	await octokit.rest.repos.createOrUpdateFileContents({
		owner,
		repo: REPO_NAME,
		path: filePath,
		message,
		content: Buffer.from(content).toString("base64"),
	});
}

export async function updateFile(
	octokit: Octokit,
	owner: string,
	filePath: string,
	content: string,
	message: string,
): Promise<void> {
	const existing = await getFile(octokit, owner, filePath);
	if (!existing) throw new ApiError(`File not found: ${filePath}`, 404);

	await octokit.rest.repos.createOrUpdateFileContents({
		owner,
		repo: REPO_NAME,
		path: filePath,
		message,
		content: Buffer.from(content).toString("base64"),
		sha: existing.sha,
	});
}

export async function getFile(
	octokit: Octokit,
	owner: string,
	filePath: string,
): Promise<{ content: string; sha: string } | null> {
	try {
		const { data } = await octokit.rest.repos.getContent({
			owner,
			repo: REPO_NAME,
			path: filePath,
		});

		if (Array.isArray(data) || data.type !== "file") return null;
		const content = Buffer.from(data.content, "base64").toString("utf-8");
		return { content, sha: data.sha };
	} catch (err: unknown) {
		if (isHttpError(err, 404)) return null;
		throw err;
	}
}

export async function listFiles(
	octokit: Octokit,
	owner: string,
	dirPath: string,
): Promise<Array<{ name: string; path: string; sha: string }>> {
	try {
		const { data } = await octokit.rest.repos.getContent({
			owner,
			repo: REPO_NAME,
			path: dirPath,
		});

		if (!Array.isArray(data)) return [];
		return data
			.filter((item) => item.type === "file")
			.map((item) => ({ name: item.name, path: item.path, sha: item.sha }));
	} catch (err: unknown) {
		if (isHttpError(err, 404)) return [];
		throw err;
	}
}

export async function createIssue(
	octokit: Octokit,
	owner: string,
	title: string,
	body: string,
	labels: string[],
): Promise<number> {
	const { data } = await octokit.rest.issues.create({
		owner,
		repo: REPO_NAME,
		title,
		body,
		labels,
	});
	return data.number;
}

export async function getIssueReactions(
	octokit: Octokit,
	owner: string,
	issueNumber: number,
): Promise<{ thumbsUp: number; commentCount: number }> {
	try {
		const { data: issue } = await octokit.rest.issues.get({
			owner,
			repo: REPO_NAME,
			issue_number: issueNumber,
		});

		const thumbsUp = issue.reactions?.["+1"] ?? 0;
		const commentCount = issue.comments;
		return { thumbsUp, commentCount };
	} catch {
		return { thumbsUp: 0, commentCount: 0 };
	}
}

export async function ensureGitizenRepo(octokit: Octokit, owner: string): Promise<void> {
	if (!(await repoExists(octokit, owner))) {
		throw new RepoNotFoundError(owner);
	}
}

function isHttpError(err: unknown, status: number): boolean {
	return (
		typeof err === "object" &&
		err !== null &&
		"status" in err &&
		(err as { status: number }).status === status
	);
}
