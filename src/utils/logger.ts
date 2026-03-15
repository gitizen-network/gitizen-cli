import chalk from "chalk";
import ora, { type Ora } from "ora";

export function info(message: string): void {
	console.log(chalk.blue("i"), message);
}

export function success(message: string): void {
	console.log(chalk.green("✓"), message);
}

export function warn(message: string): void {
	console.log(chalk.yellow("!"), message);
}

export function error(message: string): void {
	console.error(chalk.red("✗"), message);
}

export function dim(message: string): void {
	console.log(chalk.dim(message));
}

export function blank(): void {
	console.log();
}

export function heading(message: string): void {
	console.log(chalk.bold(message));
}

export function separator(): void {
	console.log(chalk.dim("───"));
}

export function spinner(text: string): Ora {
	return ora({ text, color: "cyan" }).start();
}

export const log = { info, success, warn, error, dim, blank, heading, separator, spinner };
