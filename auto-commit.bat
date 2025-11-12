@echo off
REM Automated Git Commit Batch File
REM This file launches the PowerShell script for automated commits

powershell.exe -ExecutionPolicy Bypass -File "%~dp0auto-commit.ps1" %*

