@echo off
cd /d "%~dp0"
python server.py 8081
ping 127.0.0.1 -n 6 > nul
start microsoft-edge:http://localhost:8081
pause 