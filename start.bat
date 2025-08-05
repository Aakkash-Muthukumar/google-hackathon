@echo off
rem Start both backend and frontend servers
echo Starting Programming Learning Platform...

rem Start backend server
echo Starting backend server...
cd backend
start "Backend Server" python main.py
cd ..

rem Wait a moment for backend to start
timeout /t 2 /nobreak >nul

rem Start frontend server
echo Starting frontend server...
cd frontend
start "Frontend Server" npm run dev
cd ..

rem Start Ollama server
echo Starting Ollama server...
cd ollama
start "Ollama Server" ollama serve
cd ..

rem Wait a moment for backend to start
timeout /t 2 /nobreak >nul

echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:8080
echo.
echo Press Ctrl+C in the respective terminal windows to stop the servers
echo This window will close now - check the opened terminal windows for server status

pause