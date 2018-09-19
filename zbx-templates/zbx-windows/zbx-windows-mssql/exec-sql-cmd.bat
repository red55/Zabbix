@ECHO OFF

SET SERVER_NAME=%1
SET host_name="localhost"

IF NOT "%SERVER_NAME%" == "SQLServer" (
SET host_name="localhost\%SERVER_NAME%"
)
sqlcmd -E -S %host_name% -d Master -h -1 -W -Q %2
