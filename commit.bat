@echo off
REM Quick commit script - just double-click to commit and push
REM Usage: Double-click this file, or run: commit.bat "Your commit message"

if "%1"=="" (
    powershell.exe -ExecutionPolicy Bypass -File "%~dp0auto-commit.ps1"
) else (
    powershell.exe -ExecutionPolicy Bypass -File "%~dp0auto-commit.ps1" -CommitMessage "%*"
)

pause

