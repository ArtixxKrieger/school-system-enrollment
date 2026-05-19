@echo off
setlocal EnableExtensions

if not defined PROJECT_DIR set "PROJECT_DIR=%~dp0"
if not defined DB_NAME set "DB_NAME=enrollment"
if not defined DB_USER set "DB_USER=root"
if not defined DB_PASS set "DB_PASS="
if not defined REQUIRED_TABLE_COUNT set "REQUIRED_TABLE_COUNT=6"
set "RESET_DB=0"
set "REQUIRED_COLUMN_COUNT=7"

if /I "%~1"=="reset" set "RESET_DB=1"

set "MYSQL_EXE=C:\xampp\mysql\bin\mysql.exe"
if not exist "%MYSQL_EXE%" set "MYSQL_EXE="

if not defined MYSQL_EXE (
    for %%I in (
        "C:\xampp\mysql\bin\mysql.exe"
        "D:\xampp\mysql\bin\mysql.exe"
        "C:\Program Files\xampp\mysql\bin\mysql.exe"
        "C:\Program Files (x86)\xampp\mysql\bin\mysql.exe"
    ) do (
        if not defined MYSQL_EXE if exist "%%~I" set "MYSQL_EXE=%%~I"
    )
)

if not defined MYSQL_EXE (
    for /f "delims=" %%I in ('where mysql.exe 2^>nul') do (
        if not defined MYSQL_EXE set "MYSQL_EXE=%%~fI"
    )
)

echo ======================================
echo Enrollment Database Import Utility
echo ======================================
echo.

if not defined MYSQL_EXE (
    echo ERROR: mysql.exe could not be located.
    echo.
    echo Install XAMPP MySQL or update MYSQL_EXE in this file.
    pause
    exit /b 1
)

set "MYSQL_ARGS=--default-character-set=utf8mb4 -u %DB_USER%"
if not "%DB_PASS%"=="" set "MYSQL_ARGS=%MYSQL_ARGS% -p%DB_PASS%"

echo Using MySQL: %MYSQL_EXE%
echo Target database: %DB_NAME%
echo DB user: %DB_USER%
if "%RESET_DB%"=="1" echo Mode: clean reset
echo.

for %%F in (database_schema.sql database_migration.sql database_migration_reenroll.sql) do (
    if not exist "%PROJECT_DIR%%%F" (
        echo ERROR: Required file not found: %PROJECT_DIR%%%F
        pause
        exit /b 1
    )
)

echo Checking MySQL connection...
"%MYSQL_EXE%" %MYSQL_ARGS% -e "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Unable to connect to MySQL.
    echo Make sure MySQL is running in XAMPP.
    echo If your root account uses a password, set DB_PASS at the top of this file.
    pause
    exit /b 1
)

if "%RESET_DB%"=="1" (
    echo Resetting database %DB_NAME%...
    "%MYSQL_EXE%" %MYSQL_ARGS% -e "DROP DATABASE IF EXISTS %DB_NAME%; CREATE DATABASE %DB_NAME%;"
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to reset database %DB_NAME%.
        pause
        exit /b 1
    )
    set "SCHEMA_COUNT=0"
) else (
    echo Creating database if it does not exist...
    "%MYSQL_EXE%" %MYSQL_ARGS% -e "CREATE DATABASE IF NOT EXISTS %DB_NAME%;"
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to create database %DB_NAME%.
        pause
        exit /b 1
    )

    echo Checking base schema...
    set "SCHEMA_COUNT=0"
    "%MYSQL_EXE%" %MYSQL_ARGS% -N -s -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='%DB_NAME%' AND table_name IN ('users','roles','permission_modules','role_permissions','students','enrollees');" > "%TEMP%\enrollment_schema_check.txt" 2>nul
    if exist "%TEMP%\enrollment_schema_check.txt" (
        set /p SCHEMA_COUNT=<"%TEMP%\enrollment_schema_check.txt"
        del "%TEMP%\enrollment_schema_check.txt" >nul 2>&1
    )
)

if "%SCHEMA_COUNT%"=="0" (
    echo No base schema detected. Importing database_schema.sql...
    call :run_sql_file "database_schema.sql"
    if errorlevel 1 goto :import_failed
) else if "%SCHEMA_COUNT%"=="%REQUIRED_TABLE_COUNT%" (
    echo Base schema already exists. Skipping full schema import and applying repair migrations...
) else (
    echo Incomplete base schema detected ^(%SCHEMA_COUNT%/%REQUIRED_TABLE_COUNT% required tables found^).
    echo Running schema repair import in safe mode...
    call :run_sql_file "database_schema.sql" "--force"
)

echo Importing database_migration.sql...
call :run_sql_file "database_migration.sql"
if errorlevel 1 goto :import_failed

echo Importing database_migration_reenroll.sql...
call :run_sql_file "database_migration_reenroll.sql"
if errorlevel 1 goto :import_failed

echo.
echo Verifying imported database...
set "TABLE_COUNT=0"
set "USER_COUNT=0"
set "COLUMN_COUNT=0"

"%MYSQL_EXE%" %MYSQL_ARGS% -N -s -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='%DB_NAME%';" > "%TEMP%\enrollment_table_count.txt" 2>nul
if exist "%TEMP%\enrollment_table_count.txt" (
    set /p TABLE_COUNT=<"%TEMP%\enrollment_table_count.txt"
    del "%TEMP%\enrollment_table_count.txt" >nul 2>&1
)

"%MYSQL_EXE%" %MYSQL_ARGS% -N -s %DB_NAME% -e "SELECT COUNT(*) FROM users;" > "%TEMP%\enrollment_user_count.txt" 2>nul
if exist "%TEMP%\enrollment_user_count.txt" (
    set /p USER_COUNT=<"%TEMP%\enrollment_user_count.txt"
    del "%TEMP%\enrollment_user_count.txt" >nul 2>&1
)

"%MYSQL_EXE%" %MYSQL_ARGS% -N -s -e "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='%DB_NAME%' AND ((table_name='users' AND column_name IN ('profile_photo','session_version')) OR (table_name='students' AND column_name IN ('profile_photo','import_semester','progression_status')) OR (table_name='enrollees' AND column_name IN ('enrollment_type','existing_student_id')));" > "%TEMP%\enrollment_column_check.txt" 2>nul
if exist "%TEMP%\enrollment_column_check.txt" (
    set /p COLUMN_COUNT=<"%TEMP%\enrollment_column_check.txt"
    del "%TEMP%\enrollment_column_check.txt" >nul 2>&1
)

echo Tables detected: %TABLE_COUNT%
echo Users detected: %USER_COUNT%
echo Critical migrated columns detected: %COLUMN_COUNT%/%REQUIRED_COLUMN_COUNT%

if not "%COLUMN_COUNT%"=="%REQUIRED_COLUMN_COUNT%" (
    echo.
    echo ERROR: Database import finished, but required migrated columns are missing.
    echo Expected %REQUIRED_COLUMN_COUNT% critical columns, found %COLUMN_COUNT%.
    echo Re-run this script after checking the migration SQL output.
    goto :import_failed
)

"%MYSQL_EXE%" %MYSQL_ARGS% %DB_NAME% -e "SELECT COUNT(*) AS tables_count FROM information_schema.tables WHERE table_schema='%DB_NAME%'; SELECT COUNT(*) AS user_count FROM users;"
if errorlevel 1 goto :import_failed

echo.
echo SUCCESS: Database import completed.
echo You can now open the system in your browser.
echo Tip: run import_database.bat reset for a clean rebuild.
echo.
pause
exit /b 0

:run_sql_file
set "SQL_FILE=%~1"
set "EXTRA_FLAGS=%~2"
cmd /c ""%MYSQL_EXE%" %MYSQL_ARGS% %EXTRA_FLAGS% %DB_NAME% < "%PROJECT_DIR%%SQL_FILE%""
exit /b %errorlevel%

:import_failed
echo.
echo ERROR: Database import did not complete successfully.
echo Review the messages above, then rerun this file after fixing the issue.
echo.
pause
exit /b 1
