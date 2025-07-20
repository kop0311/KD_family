@echo off
echo Starting KD_Family debug environment...

REM Check if kd_family container exists
docker inspect kd_family >nul 2>&1
if %errorlevel% neq 0 (
    echo Container kd_family does not exist, creating it...
    docker-compose up -d
) else (
    echo Container kd_family exists, starting it...
    docker start kd_family
    docker start kdfamily_mysql
    docker start kdfamily_phpmyadmin
    docker start kdfamily_adminer
)

echo.
echo Debug environment is ready:
echo - Application: http://localhost:3000
echo - phpMyAdmin: http://localhost:8080
echo - Adminer: http://localhost:8081
echo - MySQL: localhost:3307
echo.
echo Container kd_family is running and ready for debugging.
echo Your database data will persist between sessions.