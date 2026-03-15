import { Command } from "commander";
import { feedCommand } from "./commands/feed.js";
import { initCommand } from "./commands/init.js";
import { postCommand } from "./commands/post.js";
import { profileCommand } from "./commands/profile.js";
import { GitizenError } from "./utils/errors.js";
import { log } from "./utils/logger.js";

const program = new Command();

program.name("gitizen").description("GitHub-native social network CLI").version("0.1.0");

program.addCommand(initCommand);
program.addCommand(postCommand);
program.addCommand(feedCommand);
program.addCommand(profileCommand);

program.parseAsync(process.argv).catch((err) => {
	if (err instanceof GitizenError) {
		log.error(err.message);
	} else {
		log.error(err instanceof Error ? err.message : String(err));
	}
	process.exit(1);
});
