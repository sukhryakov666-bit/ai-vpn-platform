# Branch protection baseline

Configure branch protection for `main` in GitHub repository settings:

1. Require pull request before merging.
2. Require status checks to pass:
   - `prisma-validate`
   - `typecheck`
   - `test`
   - `build`
3. Require branches to be up to date before merging.
4. Require linear history.
5. Restrict direct pushes to `main`.
6. Require approval from at least 1 reviewer.
7. Dismiss stale approvals when new commits are pushed.
8. Disable force pushes and deletion for `main`.

This policy enforces lockfile discipline because CI runs `pnpm install --frozen-lockfile`.

## One-time rollout checklist

1. Initialize git repo and connect GitHub remote (if not already done).
2. Push default branch and ensure CI workflow is visible in Actions.
3. Open repository settings -> Branches -> Add rule for `main`.
4. Apply the rule set above and save.
5. Create a test PR and verify merge is blocked until all required checks pass.
