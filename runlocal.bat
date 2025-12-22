@echo off
REM runlocal.bat - Batch file wrapper for PowerShell script
REM This allows you to just type "runlocal" from the portfolio directory

powershell.exe -ExecutionPolicy Bypass -File "%~dp0runlocal.ps1"
