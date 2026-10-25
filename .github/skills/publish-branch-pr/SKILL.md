---
name: publish-branch-pr
description: Push a task branch and create or update its GitHub pull request.
---

# Publish a branch and pull request

Use this skill after the task changes and required checks are complete.
Follow the branch and commit rules in `CLAUDE.md`.

1. Check the current branch and worktree.
   Keep unrelated changes out of the commit.
2. Run `npm run check` when the task changes repository files.
   Fix failures before you publish.
3. Commit the task changes with an allowed Conventional Commit message.
   Add the required agent attribution footer.
4. Fetch `origin` and compare the task branch with its remote branch.
   Stop and inspect any divergence before you push.
5. Push the task branch to `origin`.
   Set its upstream when the remote branch does not exist.
   Never push task work directly to `main`.
6. Check for an open pull request from the task branch.
   Update that pull request when one exists.
   Otherwise, create a pull request against `main`.
   Set its base to `main` when needed.
7. Use an allowed Conventional Commit title.
   Update the pull request title and body to match the task.
   Fill the sections in `.github/PULL_REQUEST_TEMPLATE.md`.
8. Confirm the pull request targets `main` and includes only task changes.
   Report its URL and the checks you ran.

Use the available GitHub integration or `gh` when it is available.
Do not force-push or discard changes to resolve a publishing problem.
If you cannot publish, keep the branch and report the exact blocker.
