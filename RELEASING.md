# Releasing @moeinmnia/motion

## Before the first publish: check the npm scope
The package is named `@moeinmnia/motion`. A scoped package can only be published under a scope you own
(your npm username or an organization). If your npm username is `moeinmnia80`, either create the
organization `moeinmnia` on npmjs.com, or rename the package to `@moeinmnia80/motion` (package.json `name`,
the README, and the imports in the website).

## First push to GitHub
```bash
git init -b main
git add .
git commit -m "feat: 0.5.0 – hoverRoll, typeLoop, imageReveal, cursor variants; package split from website"
git remote add origin https://github.com/moeinmnia80/motion.git
git push -u origin main --force      # --force only because the old repo also held the website
```

## Publish to npm (manual)
```bash
npm login
npm run prepublishOnly      # typecheck + build
npm pack --dry-run          # check: only dist, README, LICENSE
npm publish --access public
git tag v0.5.0 && git push --tags
```

## Publish to npm (automatic)
Add an npm *Automation* token as the GitHub secret `NPM_TOKEN`, then create a GitHub Release
for the tag. `.github/workflows/publish.yml` runs the tests and publishes with provenance.

## Next versions
`npm version minor` (or `patch`) bumps package.json and tags it. Add the entry to CHANGELOG.md first.
