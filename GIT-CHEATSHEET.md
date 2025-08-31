# Git Cheat Sheet for Brand Assets Ecosystem

## 🎯 Your Daily Git Workflow

### Check Status (What's happening?)
```bash
git status
```

### Add Changes (Stage files for commit)
```bash
git add .              # Add all files
git add filename.js    # Add specific file
```

### Save Changes (Create commit)
```bash
git commit -m "Describe what you changed"
```

### View History
```bash
git log --oneline      # See all commits
```

## 🔄 Branch Workflow (Safe Experimentation)

### Create New Branch (Start new feature)
```bash
git checkout -b feature-name
```

### Switch Between Branches
```bash
git checkout main      # Go back to main
git checkout feature-name # Switch to feature
```

### Merge Branch (When feature is done)
```bash
git checkout main      # Switch to main
git merge feature-name # Bring changes from feature
```

## 🌍 GitHub Commands (Coming Next)

### Connect to GitHub
```bash
git remote add origin https://github.com/yourusername/repo-name.git
```

### Push to GitHub
```bash
git push -u origin main
```

## 🆘 Emergency Commands (If you break something)

### Undo Last Commit (but keep changes)
```bash
git reset --soft HEAD~1
```

### See What Changed in Last Commit
```bash
git show HEAD
```

### Discard All Changes Since Last Commit (DANGER!)
```bash
git checkout .
```

## 🎯 Your Current Status

✅ **You have successfully:**
- Initialized Git repository
- Created first commit (ab8bd70)
- Saved working brand asset browser
- Ready for GitHub and branching!

**Next:** Create GitHub repository and push your code