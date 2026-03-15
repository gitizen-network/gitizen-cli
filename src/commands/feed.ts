import chalk from "chalk";
import { Command } from "commander";
import { requireAuth } from "../lib/config.js";
import { getOctokit } from "../lib/github.js";
import { ensureGitizenRepo, getFile, getIssueReactions, listFiles } from "../lib/repo.js";
import { type Friends, type Post, parsePost } from "../lib/schema.js";
import { log } from "../utils/logger.js";

function formatTimeAgo(dateStr: string): string {
	const diff = Date.now() - new Date(dateStr).getTime();
	const mins = Math.floor(diff / 60_000);
	if (mins < 1) return "just now";
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 30) return `${days}d ago`;
	return new Date(dateStr).toLocaleDateString();
}

async function fetchUserPosts(
	octokit: ReturnType<typeof getOctokit>,
	username: string,
): Promise<(Post & { author: string })[]> {
	const files = await listFiles(octokit, username, "posts");
	const mdFiles = files.filter((f) => f.name.endsWith(".md")).slice(-20); // Last 20 posts

	const posts: (Post & { author: string })[] = [];

	for (const file of mdFiles) {
		const result = await getFile(octokit, username, file.path);
		if (!result) continue;
		const slug = file.name.replace(/\.md$/, "");
		const post = parsePost(result.content, slug);
		posts.push({ ...post, author: username });
	}

	return posts;
}

async function displayPosts(
	octokit: ReturnType<typeof getOctokit>,
	posts: (Post & { author: string })[],
): Promise<void> {
	// Sort reverse chronological
	posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	if (posts.length === 0) {
		log.dim("  No posts yet.");
		return;
	}

	for (const post of posts) {
		let reactions = "";
		if (post.issue) {
			const { thumbsUp, commentCount } = await getIssueReactions(octokit, post.author, post.issue);
			const parts: string[] = [];
			if (thumbsUp > 0) parts.push(`👍 ${thumbsUp}`);
			if (commentCount > 0) parts.push(`💬 ${commentCount}`);
			reactions = parts.join("  ");
		}

		const timeAgo = post.date ? formatTimeAgo(post.date) : "";
		console.log(`  ${chalk.bold(`@${post.author}`)} ${chalk.dim(`· ${timeAgo}`)}`);
		console.log(`  ${post.body}`);
		if (reactions) console.log(`  ${reactions}`);
		log.separator();
	}
}

export const feedCommand = new Command("feed")
	.description("View posts from a user or your friends")
	.argument("[user]", "Username to view (e.g. @alice). Omit for friends feed.")
	.action(async (userArg?: string) => {
		const config = requireAuth();
		const octokit = getOctokit(config.token);

		if (userArg) {
			// Single user feed
			const username = userArg.replace(/^@/, "");
			await ensureGitizenRepo(octokit, username);

			const spin = log.spinner(`Loading posts from @${username}...`);
			const posts = await fetchUserPosts(octokit, username);
			spin.stop();

			log.blank();
			log.heading(`  Posts by @${username}`);
			log.blank();
			await displayPosts(octokit, posts);
			log.blank();
		} else {
			// Aggregated friends feed
			const spin = log.spinner("Loading friends feed...");

			const friendsFile = await getFile(octokit, config.username, "friends.json");
			if (!friendsFile) {
				spin.stop();
				log.blank();
				log.dim("  No friends yet. Add friends to see their posts in your feed.");
				log.dim("  Tip: Use `gitizen feed @<username>` to view anyone's posts.");
				log.blank();
				return;
			}

			const friends = JSON.parse(friendsFile.content) as Friends;
			if (friends.friends.length === 0) {
				spin.stop();
				log.blank();
				log.dim("  No friends yet. Add friends to see their posts in your feed.");
				log.dim("  Tip: Use `gitizen feed @<username>` to view anyone's posts.");
				log.blank();
				return;
			}

			const allPosts: (Post & { author: string })[] = [];
			for (const friend of friends.friends) {
				try {
					const posts = await fetchUserPosts(octokit, friend.github);
					allPosts.push(...posts);
				} catch {
					// Skip friends whose repos are inaccessible
				}
			}

			spin.stop();
			log.blank();
			log.heading("  Friends Feed");
			log.blank();
			await displayPosts(octokit, allPosts);
			log.blank();
		}
	});
