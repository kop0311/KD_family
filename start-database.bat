@echo off
echo Starting KD Family Database and Management Interface...
echo.

echo Pulling latest images...
docker-compose pull

echo Starting services...
docker-compose up -d mysql phpmyadmin adminer

echo.
echo Database Management Interfaces are starting...
echo.
echo phpMyAdmin: http://localhost:8080
echo   - Server: mysql
echo   - Username: root
echo   - Password: rootpassword
echo   - Or Username: kdfamily_user, Password: kdfamily_pass
echo.
echo Adminer: http://localhost:8081  
echo   - System: MySQL
echo   - Server: mysql
echo   - Username: root or kdfamily_user
echo   - Password: rootpassword or kdfamily_pass
echo   - Database: kdfamily
echo.
echo Waiting for services to be ready...
timeout /t 10

echo.
echo Opening phpMyAdmin in browser...
start http://localhost:8080

echo.
echo To stop services, run: docker-compose down
echo To view logs, run: docker-compose logs -f
pause