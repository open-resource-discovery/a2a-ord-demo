# Contributing

## Code of Conduct

All members of the project community must abide by the [Contributor Covenant, version 2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). Only combative combative behavior or speech that targets combative or discriminatory behavior will be moderated. Welcoming people with diverse backgrounds and perspectives strengthens our community.

## Engaging in Our Project

We use GitHub to manage reviews of pull requests.

- If you are a new contributor, see: [Steps to Contribute](#steps-to-contribute)

- Before implementing your change, create an issue that describes the problem you would like to solve or the code that should be enhanced. Please note that you are willing to work on that issue.

- The team will review the issue and decide whether it should be implemented as a pull request. In that case, they will assign the issue to you. If the team decides against an implementation as a pull request, the issue will be closed with a comment explaining the reason.

## Steps to Contribute

Should you wish to work on an issue, please claim it first by commenting on the GitHub issue that you want to work on. This is to prevent duplicated efforts from other contributors on the same issue.

## DCO

When you contribute (code, documentation, or anything else), you have to be aware that your contribution is covered by the same [Apache 2.0 License](http://www.apache.org/licenses/LICENSE-2.0) that is applied to the project itself.

In particular, you need to agree to the [Developer Certificate of Origin (DCO)](https://developercertificate.org/), which is a lightweight way for contributors to confirm that they wrote or otherwise have the right to submit the code they are contributing. The DCO is a pre-requisite for contributing to this project.

Contributors will be asked to accept a Developer Certificate of Origin (DCO) when they create the first pull request to this project. This happens in an automated way during the submission process. SAP uses the standard DCO text of the [Linux Foundation](https://developercertificate.org/).

## Contributing with AI-Generated Code

As the use of AI-generated code assistants is forming a new state of the art, we embrace the responsible use of these tools during the development process.

For details, please see the [guideline for using AI-generated code](https://github.com/open-resource-discovery/.github/blob/main/CONTRIBUTING_USING_GENAI.md).

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) >= 22.0.0
- [Docker](https://www.docker.com/) and Docker Compose

### Getting Started

```bash
npm install           # install dependencies
npm run build         # build all workspaces
npm run test          # run tests across all workspaces
./demo.sh             # start the full demo via Docker Compose
```

### Project Structure

This is an npm workspaces monorepo:

- `spaceship-app/` — Hosts A2A agents (Solar Explorer + Repair Technician) and serves ORD documents
- `super-agent/` — Commander agent that discovers agents via ORD and delegates via A2A

### Branch Naming

Use descriptive branch names with conventional prefixes:

- `feat/` — new features
- `fix/` — bug fixes
- `chore/` — maintenance tasks
- `refactor/` — code refactoring

### Pull Requests

- Keep PRs focused on a single concern
- Ensure all tests pass before submitting
- Provide a clear description of what the PR does and why
