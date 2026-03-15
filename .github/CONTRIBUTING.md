# Contributing to Gitizen CLI

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

```bash
git clone https://github.com/gitizen-network/cli.git
cd cli
pnpm install
pnpm dev -- --help    # Run CLI in dev mode
```

## Workflow

1. Fork and create a branch from `main`
2. Make your changes
3. Run `pnpm lint && pnpm test && pnpm build` to verify
4. Open a pull request

## Code Style

We use [Biome](https://biomejs.dev/) for linting and formatting. Run `pnpm lint:fix` to auto-fix issues.

## Testing

```bash
pnpm test          # Run all tests
pnpm test:watch    # Watch mode
```

## Contributor License Agreement (CLA)

By submitting a pull request, you agree to the terms of our [CLA](../CLA.md). This is required for all contributions.

The CLA ensures that contributions can be properly licensed and that the project can be maintained long-term. You only need to sign once.

## Reporting Issues

Use [GitHub Issues](https://github.com/gitizen-network/cli/issues) to report bugs or request features. Please include:
- Steps to reproduce
- Expected vs actual behavior
- Node.js version and OS

## Code of Conduct

Be respectful. We're building a social network — let's start by being good neighbors.
