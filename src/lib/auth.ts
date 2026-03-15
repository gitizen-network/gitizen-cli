import { createOAuthDeviceAuth } from "@octokit/auth-oauth-device";
import chalk from "chalk";
import { log } from "../utils/logger.js";

// GitHub OAuth App Client ID for Gitizen CLI
// Device flow doesn't require a client secret — safe to embed
const CLIENT_ID = "Ov23liYourClientId"; // TODO: Replace with real OAuth App client ID

export async function deviceFlowAuth(): Promise<string> {
	const auth = createOAuthDeviceAuth({
		clientType: "oauth-app",
		clientId: CLIENT_ID,
		scopes: ["repo", "read:user"],
		onVerification(verification) {
			log.blank();
			log.heading("GitHub Authentication");
			log.blank();
			console.log(`  Open ${chalk.cyan(verification.verification_uri)} in your browser`);
			console.log(`  Enter code: ${chalk.bold.yellow(verification.user_code)}`);
			log.blank();
			log.dim("  Waiting for authorization...");
		},
	});

	const { token } = await auth({ type: "oauth" });
	return token;
}
