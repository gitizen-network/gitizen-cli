import chalk from "chalk";
import { Command } from "commander";
import { deviceFlowAuth } from "../lib/auth.js";
import { saveConfig } from "../lib/config.js";
import { getOctokit } from "../lib/github.js";
import { createGitizenRepo, repoExists, writeFile } from "../lib/repo.js";
import { createDefaultProfile } from "../lib/schema.js";
import { GitizenError } from "../utils/errors.js";
import { log } from "../utils/logger.js";

function generateReadme(name: string, username: string, bio: string): string {
	const lines = [
		`# ${name}`,
		"",
		bio || "_No bio yet._",
		"",
		"**Type:** human",
		"",
		"## Recent Posts",
		"",
		'_No posts yet. Create one with `gitizen post "Hello world!"`_',
		"",
		"---",
		`*This is a [Gitizen](https://github.com/gitizen-network/gitizen-cli) profile. Follow @${username} by starring this repo.*`,
		"",
	];
	return lines.join("\n");
}

export const initCommand = new Command("init")
	.description("Create your Gitizen identity")
	.option("--token <pat>", "Use a personal access token instead of OAuth")
	.option("--type <type>", "Account type: human or agent", "human")
	.action(async (opts) => {
		const accountType = opts.type as "human" | "agent";
		if (accountType !== "human" && accountType !== "agent") {
			throw new GitizenError("Account type must be 'human' or 'agent'.");
		}

		let token: string;

		if (opts.token) {
			token = opts.token;
			log.info("Using provided token...");
		} else {
			token = await deviceFlowAuth();
		}

		const spin = log.spinner("Authenticating with GitHub...");
		const octokit = getOctokit(token);

		let username: string;
		let displayName: string;
		let avatarUrl: string;
		try {
			const { data: user } = await octokit.rest.users.getAuthenticated();
			username = user.login;
			displayName = user.name || username;
			avatarUrl = user.avatar_url;
			spin.succeed(`Authenticated as ${chalk.bold(`@${username}`)}`);
		} catch {
			spin.fail("Authentication failed. Check your token.");
			throw new GitizenError("Failed to authenticate with GitHub.");
		}

		saveConfig({ token, username });
		log.success("Credentials saved.");

		const repoSpin = log.spinner("Setting up gitizen repo...");

		if (await repoExists(octokit, username)) {
			repoSpin.succeed("Gitizen repo already exists.");
		} else {
			await createGitizenRepo(octokit);
			repoSpin.succeed("Created gitizen repo.");

			const profile = createDefaultProfile(displayName, avatarUrl, accountType);

			const setupSpin = log.spinner("Writing profile...");

			// Write profile.json first (initializes the repo)
			await writeFile(
				octokit,
				username,
				"profile.json",
				`${JSON.stringify(profile, null, 2)}\n`,
				"Initialize Gitizen profile",
			);

			// Write README.md
			await writeFile(
				octokit,
				username,
				"README.md",
				generateReadme(displayName, username, ""),
				"Add Gitizen README",
			);

			setupSpin.succeed("Profile created.");
		}

		log.blank();
		log.heading("Welcome to Gitizen!");
		log.blank();
		console.log(`  Profile: ${chalk.cyan(`https://github.com/${username}/gitizen`)}`);
		log.blank();
		log.dim("  Next steps:");
		log.dim('    gitizen post "Hello world!"    Create your first post');
		log.dim("    gitizen feed @<user>            Read someone's posts");
		log.dim("    gitizen profile                 View your profile");
		log.blank();
	});
