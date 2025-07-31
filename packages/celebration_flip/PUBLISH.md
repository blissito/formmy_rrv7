# 🚀 Publishing Guide

## Prerequisites

1. **GitHub Account** with repository access
2. **NPM Account** with publishing permissions
3. **Node.js** 16+ installed
4. **Git** configured

## 📦 Publishing Steps

### 1. Setup Repository

```bash
# Navigate to the package directory
cd packages/celebration_flip

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: CelebrationFlip component"

# Create GitHub repository
# Go to https://github.com/new
# Repository name: celebration-flip
# Description: Beautiful animated flip text component for celebrating milestones

# Add remote and push
git remote add origin https://github.com/formmy/celebration-flip.git
git branch -M main
git push -u origin main
```

### 2. Install Dependencies

```bash
# Install build dependencies
npm install
```

### 3. Build the Package

```bash
# Build the distribution files
npm run build

# This creates:
# - dist/index.js (CommonJS)
# - dist/index.esm.js (ES Modules)
# - dist/index.d.ts (TypeScript definitions)
# - dist/styles.css (CSS styles)
```

### 4. Test Locally

```bash
# Test the build
npm pack

# This creates a .tgz file you can test locally:
# npm install ./formmy-celebration-flip-1.0.0.tgz
```

### 5. Publish to NPM

```bash
# Login to NPM (if not already logged in)
npm login

# Publish the package
npm publish --access public

# For scoped packages (@formmy/celebration-flip)
npm publish --access public
```

### 6. Create GitHub Release

```bash
# Tag the release
git tag v1.0.0
git push origin v1.0.0

# Or create release through GitHub UI:
# https://github.com/formmy/celebration-flip/releases/new
```

## 🔄 Update Workflow

### For new versions:

```bash
# 1. Make changes
# 2. Update version in package.json
npm version patch  # for bug fixes
npm version minor  # for new features
npm version major  # for breaking changes

# 3. Build and test
npm run build
npm test

# 4. Commit and push
git add .
git commit -m "Release v1.0.1"
git push

# 5. Publish
npm publish

# 6. Create GitHub release
git tag v1.0.1
git push origin v1.0.1
```

## 📋 Checklist Before Publishing

- [ ] ✅ All files are in correct structure
- [ ] ✅ package.json has correct information
- [ ] ✅ README.md is complete and accurate
- [ ] ✅ LICENSE file is included
- [ ] ✅ .gitignore and .npmignore are configured
- [ ] ✅ TypeScript builds without errors
- [ ] ✅ CSS is properly bundled
- [ ] ✅ Example works correctly
- [ ] ✅ Version number is correct
- [ ] ✅ Repository URL is correct

## 🌐 Usage After Publishing

### Install from NPM

```bash
npm install @formmy/celebration-flip
```

### Import in React

```jsx
import { CelebrationFlip } from "@formmy/celebration-flip";
import "@formmy/celebration-flip/styles";
```

### CDN Usage

```html
<!-- CSS -->
<link
  rel="stylesheet"
  href="https://unpkg.com/@formmy/celebration-flip/dist/styles.css"
/>

<!-- JS (ES Module) -->
<script type="module">
  import { CelebrationFlip } from "https://unpkg.com/@formmy/celebration-flip/dist/index.esm.js";
</script>
```

## 🔧 Troubleshooting

### Build Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript compilation
npx tsc --noEmit
```

### Publishing Issues

```bash
# Check if package name is available
npm view @formmy/celebration-flip

# Check NPM login status
npm whoami

# Dry run publish
npm publish --dry-run
```

### Version Conflicts

```bash
# Check current version
npm view @formmy/celebration-flip version

# Update version manually
npm version 1.0.1 --no-git-tag-version
```

## 📈 Post-Publishing

1. **Update main project** to use the published package
2. **Create demo site** on GitHub Pages
3. **Share on social media** 🎉
4. **Monitor downloads** on NPM
5. **Respond to issues** on GitHub

---

**Ready to share your celebration component with the world! 🚀**
