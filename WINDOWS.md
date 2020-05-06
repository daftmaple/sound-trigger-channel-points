# Self-hosting on Windows

This is an instruction for self-hosting the application on your own PC.

## Installation and configuration

1. Register your application on [Twitch developer console](https://dev.twitch.tv/console/apps). Add `http://localhost:8080/oauth2/twitch` for your OAuth Redirect URL.
2. Download the zipfile of this repository by clicking download ZIP on the main page. Unzip it wherever you're comfortable with.
3. Install nodejs and npm (newest version) on your machine.
    - Node (with npm) is available on https://nodejs.org/en/download/
    - Make sure that it is included in your path
4. Run `windows-setup.bat`
5. Open `.env` file and modify the parameter according to your desired value
    - Note that your BASE_URL must have the same port as HTTP_PORT for self-hosting
    - This BASE_URL should also be the same as the one registered in Twitch developer console (exclude the '/oauth2/twitch' part in BASE_URL). There is no need to change this if you're using the OAuth Redirect URL given in part 1.
    - CLIENT_ID and CLIENT_SECRET should be obvious (from your app registration)
    - CHANNEL_LOGIN is the username of the channel
6. Add your desired sound effects on `www/sound-effects`. Set the configuration for the sound on `config.toml`
7. Set your desired configuration on `points.json` for your channel points prefix and announcer.
8. Run `windows-run.bat` and access your BASE_URL on your browser
9. Authorize app to your channel by clicking the link provided on the web page.
10. Go back to BASE_URL and open the SFX page.
11. Use the URL of the SFX page as your browser source.
12. Your app is ready to use.

## Running the app

Run `windows-run.bat`.

## Note

- Changing channel points on Twitch won't affect this app
- Changing sound effects, points config (`points.json`), sound config (`config.toml`), or environment variables (`.env`) needs app restarting. Use Ctrl+C to stop your batch script, and reload it by executing the `windows-run.bat` batch file again.
- Other details regarding configuration on your channel or the app, read [README page](README.md).