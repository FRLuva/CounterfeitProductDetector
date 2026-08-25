@echo off
setlocal
cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo Creating the FakeGuard virtual environment...
    py -m venv .venv
    if errorlevel 1 goto error
)

echo Installing required packages...
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 goto error

echo Preparing the local database...
".venv\Scripts\python.exe" manage.py migrate --noinput
if errorlevel 1 goto error

echo Loading demonstration data...
".venv\Scripts\python.exe" manage.py seed_demo
if errorlevel 1 goto error

echo.
echo FakeGuard will be available at http://127.0.0.1:8000/
echo Press Ctrl+C to stop the server.
".venv\Scripts\python.exe" manage.py runserver
exit /b 0

:error
echo.
echo FakeGuard setup could not be completed. Review the error above.
pause
exit /b 1
