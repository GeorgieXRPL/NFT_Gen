@echo off
setlocal enabledelayedexpansion

REM Change to the directory of this script
cd /d "%~dp0"

REM Check if server.py exists
if not exist server.py (
    echo server.py not found in %CD%.
    pause
    exit /b 1
)

REM Default port
set PORT=8081

REM Allow port override from command line
if not "%1"=="" set PORT=%1

REM Check if python is installed
where python >nul 2>nul
if !ERRORLEVEL! NEQ 0 (
    echo Python is not installed or not in PATH. Please install Python 3.x.
    echo You can download it from https://www.python.org/downloads/
    pause
    exit /b 1
)

echo Starting NFT Collection Creator server on port !PORT!...

REM Check if port is already in use
netstat -ano | findstr ":!PORT!" >nul
if !ERRORLEVEL! EQU 0 (
    echo Port !PORT! is already in use. Trying alternative ports...
    
    REM Try incrementing ports from 8082 to 8090
    for /L %%p in (8082, 1, 8090) do (
        echo Checking port %%p...
        netstat -ano | findstr ":%%p" >nul
        if !ERRORLEVEL! NEQ 0 (
            set "PORT=%%p"
            echo Found available port: !PORT!
            goto port_found
        )
    )
    
    REM If we get here, none of the ports were available
    echo All standard ports (8081-8090) are in use.
    
    REM Ask user if they want to use a random high port instead
    set /p choice="Would you like to try a random high port? (y/n): "
    if /i "!choice!"=="y" (
        REM Generate a random port between 10000 and 65000
        set /a "random_port=!RANDOM! * 55000 / 32768 + 10000"
        set "PORT=!random_port!"
        echo Using random port: !PORT!
        goto port_found
    ) else (
        echo Please close other applications using these ports and try again.
        pause
        exit /b 1
    )
)

:port_found
REM Start the server with the selected port
echo Starting server at http://localhost:!PORT!
echo Server will open in your default browser automatically

REM Run the server script with the chosen port
python server.py !PORT!

REM If server.py fails, show error
if !ERRORLEVEL! NEQ 0 (
    echo.
    echo Failed to start the server. Error code: !ERRORLEVEL!
    echo.
    echo Common issues:
    echo 1. Port !PORT! might still be in use by another application
    echo 2. Python modules might be missing
    echo 3. Permission issues with the current directory
    echo.
    echo You can also try running the server manually with:
    echo python server.py !PORT!
    echo.
    echo If problems persist, try using a different port:
    echo run-server.bat 8082
    pause
    exit /b 1
)

echo Server is running successfully on port !PORT!. Press Ctrl+C to stop.

pause 