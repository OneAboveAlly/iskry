@echo off
cd /d "%~dp0"
powershell -Command "Start-Process cmd -ArgumentList '/c cd /d "%~dp0" && npx prisma generate' -Verb RunAs -Wait"