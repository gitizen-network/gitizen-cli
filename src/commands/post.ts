import chalk from "chalk";
import { Command } from "commander";
import { requireAuth } from "../lib/config.js";
import { getOctokit } from "../lib/github.js";
import { createIssue, ensureGitizenRepo, updateFile, writeFile } from "../lib/repo.js";
import { generatePostSlug, serializePost } from "../lib/schema.js";
import { log } from "../utils/logger.js";

export const postCommand = new Command("post")
	.description("Publish a post to your Gitizen profile")
	.argument("<message>", "The post content")
	.action(async (message: string) => {
		const config = requireAuth();
		const octokit = getOctokit(config.token);

		await ensureGitizenRepo(octokit, config.username);

		const now = new Date();
		const slug = generatePostSlug(now);
		const filePath = `posts/${slug}.md`;

		const spin = log.spinner("Publishing post...");

		// Step 1: Write post file
		const initialContent = serializePost(message, now);
		await writeFile(octokit, config.username, filePath, initialContent, `Post: ${slug}`);

		// Step 2: Create issue for interactions
		const issueNumber = await createIssue(octokit, config.username, `[post] ${slug}`, message, [
			"post",
		]);

		// Step 3: Update post with issue number
		const updatedContent = serializePost(message, now, issueNumber);
		await updateFile(
			octokit,
			config.username,
			filePath,
			updatedContent,
			`Link post to issue #${issueNumber}`,
		);

		spin.succeed("Post published!");
		log.blank();
		console.log(
			`  ${chalk.dim("Post:")} ${chalk.cyan(`https://github.com/${config.username}/gitizen/blob/main/${filePath}`)}`,
		);
		console.log(
			`  ${chalk.dim("Discuss:")} ${chalk.cyan(`https://github.com/${config.username}/gitizen/issues/${issueNumber}`)}`,
		);
		log.blank();
	});
