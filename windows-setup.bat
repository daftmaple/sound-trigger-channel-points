ECHO OFF
ECHO Creating directories
if not exist %~dp0\filter mkdir filter
if not exist %~dp0\tokens mkdir tokens

ECHO Creating filter and tokens files
copy /y nul filter\regex.txt
copy /y nul tokens\access
copy /y nul tokens\refresh
copy /y nul tokens\id

ren .env.example .env
ren points.json.example points.json

npm install

PAUSE