import chalk from "chalk";
import { Command } from "commander";
import { requireAuth } from "../lib/config.js";
import { getOctokit } from "../lib/github.js";
import { ensureGitizenRepo, getFile, listFiles } from "../lib/repo.js";
import { type Friends, type Profile, validateProfile } from "../lib/schema.js";
import { log } from "../utils/logger.js";

export const profileCommand = new Command("profile")
	.description("View a Gitizen profile")
	.argument("[user]", "Username to view (e.g. @alice). Omit for your own profile.")
	.action(async (userArg?: string) => {
		const config = requireAuth();
		const octokit = getOctokit(config.token);

		const username = userArg ? userArg.replace(/^@/, "") : config.username;
		await ensureGitizenRepo(octokit, username);

		const spin = log.spinner(`Loading profile for @${username}...`);

		// Fetch profile
		const profileFile = await getFile(octokit, username, "profile.json");
		if (!profileFile) {
			spin.fail(`No profile.json found for @${username}.`);
			return;
		}

		const profile = JSON.parse(profileFile.content) as Profile;
		if (!validateProfile(profile)) {
			spin.fail("Invalid profile.json format.");
			return;
		}

		// Fetch friend count
		let friendCount = 0;
		const friendsFile = await getFile(octokit, username, "friends.json");
		if (friendsFile) {
			const friends = JSON.parse(friendsFile.content) as Friends;
			friendCount = friends.friends.length;
		}

		// Fetch post count
		const posts = await listFiles(octokit, username, "posts");
		const postCount = posts.filter((f) => f.name.endsWith(".md")).length;

		spin.stop();

		// Display
		log.blank();
		console.log(`  ${chalk.bold(`@${username}`)}`);
		if (profile.bio) {
			console.log(`  ${profile.bio}`);
		}
		log.blank();
		console.log(
			`  ${chalk.dim("Type:")} ${profile.type} ${chalk.dim("·")} ${chalk.dim("Joined:")} ${profile.created}`,
		);
		console.log(
			`  ${chalk.dim("Friends:")} ${friendCount} ${chalk.dim("·")} ${chalk.dim("Posts:")} ${postCount}`,
		);

		const linkEntries = Object.entries(profile.links);
		if (linkEntries.length > 0) {
			log.blank();
			console.log(`  ${chalk.dim("Links:")}`);
			for (const [key, value] of linkEntries) {
				console.log(`    ${chalk.dim(`${key}:`)} ${value}`);
			}
		}
		log.blank();
	});
