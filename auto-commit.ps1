# Automated Git Commit Script
# This script automatically stages, commits, and pushes changes to GitHub

param(
    [string]$CommitMessage = "",
    [switch]$SkipPush = $false
)

# Colors for output
$ErrorColor = "Red"
$SuccessColor = "Green"
$InfoColor = "Cyan"

function Write-ColorOutput($ForegroundColor, $Message) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    Write-Output $Message
    $host.UI.RawUI.ForegroundColor = $fc
}

# Check if git is installed
try {
    $gitVersion = git --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput $ErrorColor "Git is not installed or not in PATH. Please install Git first."
        exit 1
    }
} catch {
    Write-ColorOutput $ErrorColor "Git is not installed or not in PATH. Please install Git first."
    exit 1
}

# Check if we're in a git repository
if (-not (Test-Path .git)) {
    Write-ColorOutput $InfoColor "Initializing git repository..."
    git init
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput $ErrorColor "Failed to initialize git repository."
        exit 1
    }
    Write-ColorOutput $SuccessColor "Git repository initialized successfully."
}

# Check for changes
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-ColorOutput $InfoColor "No changes to commit. Working directory is clean."
    exit 0
}

# Show current status
Write-ColorOutput $InfoColor "Current changes:"
git status --short

# Stage all changes
Write-ColorOutput $InfoColor "`nStaging all changes..."
git add .
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput $ErrorColor "Failed to stage changes."
    exit 1
}
Write-ColorOutput $SuccessColor "All changes staged successfully."

# Generate commit message if not provided
if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $CommitMessage = "Auto-commit: $timestamp"
}

# Commit changes
Write-ColorOutput $InfoColor "`nCommitting changes with message: '$CommitMessage'..."
git commit -m $CommitMessage
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput $ErrorColor "Failed to commit changes."
    exit 1
}
Write-ColorOutput $SuccessColor "Changes committed successfully."

# Push to remote if not skipped
if (-not $SkipPush) {
    # Check if remote exists
    $remote = git remote get-url origin 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput $InfoColor "`nPushing to remote repository..."
        git push
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput $ErrorColor "Failed to push to remote. You may need to set up the remote or configure authentication."
            Write-ColorOutput $InfoColor "To set up remote: git remote add origin <your-repo-url>"
            Write-ColorOutput $InfoColor "To skip push next time: .\auto-commit.ps1 -SkipPush"
            exit 1
        }
        Write-ColorOutput $SuccessColor "Changes pushed to remote successfully."
    } else {
        Write-ColorOutput $InfoColor "`nNo remote repository configured. Skipping push."
        Write-ColorOutput $InfoColor "To add a remote: git remote add origin <your-repo-url>"
    }
} else {
    Write-ColorOutput $InfoColor "`nPush skipped as requested."
}

Write-ColorOutput $SuccessColor "`n[SUCCESS] All done! Commit process completed successfully."

