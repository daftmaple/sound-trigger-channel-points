ECHO OFF
ECHO Creating directories
if not exist %~dp0\.config mkdir .config
if not exist %~dp0\.config\filter mkdir .config\filter
if not exist %~dp0\.config\tokens mkdir .config\tokens

ECHO Creating filter and tokens files
copy /y nul .config\filter\regex.txt
copy /y nul .config\tokens\access
copy /y nul .config\tokens\refresh
copy /y nul .config\tokens\id

copy /y .env.example .env
copy /y config.toml.example .config\config.toml
copy /y points.json.example .config\points.json

npm install

PAUSE