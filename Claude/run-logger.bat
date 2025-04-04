@echo off
color 0B
title Claude Conversation Logger
echo ===============================
echo Claude Conversation Logger
echo ===============================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Node.js is not installed or not in your PATH.
  echo Please install Node.js from https://nodejs.org/
  echo.
  pause
  exit /b 1
)

REM Get the directory where this batch file is located
set SCRIPT_DIR=%~dp0

REM If input file is provided as argument, use it
if not "%~1"=="" (
  set inputfile=%~1
  goto process_file
)

REM Otherwise, ask for the file
:ask_for_file
echo Please provide the conversation text file:
echo 1. Drag and drop the file here, or
echo 2. Enter the full path to the file
echo.
set /p inputfile="File path: "

REM Check if the provided file exists
if not exist "%inputfile%" (
  echo.
  echo ERROR: File not found. Please check the path and try again.
  echo.
  goto ask_for_file
)

:process_file
echo.
echo Processing: "%inputfile%"
echo.

REM Run the Node.js script
node "%SCRIPT_DIR%improved-conversation-logger.js" "%inputfile%"

echo.
echo ===============================
echo.
pause
