# Automated Git Commit Guide

## Quick Start

### Option 1: Double-Click (Easiest)
Just **double-click `commit.bat`** in your project folder. It will automatically:
- Stage all changes
- Commit with an auto-generated message (timestamp)
- Push to GitHub (if remote is configured)

### Option 2: Command Line
Open PowerShell or Command Prompt in your project folder and run:

```bash
# Basic commit with auto-generated message
.\commit.bat

# Commit with custom message
.\commit.bat "Your custom commit message here"

# Or use the PowerShell script directly
.\auto-commit.ps1 -CommitMessage "Your message"
```

### Option 3: NPM Script
```bash
npm run commit "Your commit message"
```

## Advanced Usage

### Skip Push
If you only want to commit locally without pushing:
```bash
.\auto-commit.ps1 -SkipPush
```

### Custom Commit Message
```bash
.\auto-commit.ps1 -CommitMessage "Fixed CSS styling issues"
```

## First Time Setup

1. **Initialize Git Repository** (if not already done):
   ```bash
   git init
   ```

2. **Add Remote Repository** (if you have a GitHub repo):
   ```bash
   git remote add origin https://github.com/yourusername/your-repo.git
   ```

3. **Configure Git** (if not already done):
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

## What the Script Does

1. ✅ Checks if Git is installed
2. ✅ Initializes repository if needed
3. ✅ Shows current changes
4. ✅ Stages all changes (`git add .`)
5. ✅ Commits with message
6. ✅ Pushes to remote (if configured)

## Troubleshooting

- **"Git is not installed"**: Install Git from https://git-scm.com/
- **"Failed to push"**: Make sure you've added a remote repository and configured authentication
- **PowerShell execution policy error**: Run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` in PowerShell as Administrator

