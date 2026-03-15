export class GitizenError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "GitizenError";
	}
}

export class AuthError extends GitizenError {
	constructor(message = "Not authenticated. Run `gitizen init` first.") {
		super(message);
		this.name = "AuthError";
	}
}

export class RepoNotFoundError extends GitizenError {
	constructor(username: string) {
		super(`Gitizen repo not found for @${username}. They may not have initialized yet.`);
		this.name = "RepoNotFoundError";
	}
}

export class ApiError extends GitizenError {
	public status: number;

	constructor(message: string, status: number) {
		super(message);
		this.name = "ApiError";
		this.status = status;
	}
}
