# Sound Trigger Channel Points

A Node.js app that will listen to Twitch channel points to play sound effects
or TTS (user input or announcer) in a hidden webpage (like a browser source in OBS).

This application is a derivative form of Sound Trigger Bot made by AlcaDesign (https://github.com/alcadesign/sound-trigger-bot).

## Do the things

### Register your application on Twitch developer portal

Visit [Twitch developer console](https://dev.twitch.tv/console/apps) and register your application. Put OAuth redirect URL according to the base url on `.env` (if you're hosting on local machine, use the given example on the file).

### Setting things up (for noobs or Windows user)

Read [Windows documentation](WINDOWS.md).

### Configure node and npm instance (for Linux users)

```bash
# Run the starting script (make filter and tokens directory inside .config)
mkdir .config
mkdir .config/filter .config/tokens
# Touch a file for regex and both access and refresh token
touch tokens/access tokens/refresh tokens/id filter/regex.txt
# Clone the repo
git clone git@github.com:daftmaple/sound-trigger-channel-points.git
# Change directory into the repo
cd sound-trigger-channel-points
# Copy the .env.example file to .env
cp .env.example .env
# Edit the .env file
nano .env
# Copy the points.json.example file to .config/points.json
cp points.json.example .config/points.json
# Copy the config.toml.example file to .config/config.toml
cp config.toml.example .config/config.toml
# Edit the .env file according to the configuration
nano .config/points.json
# Install the dependencies
npm install
# Start the server
npm start
```

By default, the port is set to `8080` in the `.env`. Go to `localhost:8080` and
you'll get a link to the sfx page. This is the page that would be loaded in OBS.
The main page may be used for adding more sound effects and other options later.

### Configure on Docker

```sh
docker build -t soundboard .
docker run --detach --env-file .env -v <PATH_TO_CONFIG_DIR>:/usr/src/.config -p <internal>:<external> --name soundboard-container soundboard
```

Internal port `<internal>` should match the HTTP_PORT in `.env` file, and external port is the exposed port. By default, both are 8080.

For Windows WSL1 Docker, use `$(wslpath -w $(pwd)/.config)`

## Basic Configuration

### Enable application to read your channel custom reward redemptions

Go to BASE_URL that you set on `.env` and click the authorize link so that your app can access your channel points redemption.
Note: this application only asks for `channel:read:redemptions`, where it can only read redemptions in your channel. This application **will not ask for any other scope**, especially sensitive information such as email or moderation.

![Authorize](www/authorize.png)

### Setting up basic TTS

Set a channel point with a reward name called `TTS`, with require viewer to enter text. It is highly recommended for AutoMod to be allowed here, since review reward queue does not stop the channel point event to be emitted from the API. Most profanity is filtered by `.config/filter/regex.txt`, where it takes both string and regex. It is advised for most TOS-forbidden words to be filtered directly via blocked terms.

I did not include the `.config/filter/regex.txt` in this repository.

### Setting up sound effects

Set a channel point with a reward name called `Soundboard: <sound name>`, without requiring viewer to enter text. To add more sound effects, add sound files (mp3/ogg) them to `www/sound-effects/` and list them in the `.config/config.toml` file.

### Setting up announcer for channel points redeemables

If you want to announce channel points redeemables as TTS, list all redeemables title as an array of string in `points.json` under `points["redemptions"]["redeemables"]`.

## Extra Configuration

### Prefix for TTS and Soundboard

By default, the TTS command is called `TTS` and soundboard starts with `Soundboard:`. To modify this, change the configuration on `points.json`, under `points["tts"]["prefix"]` or `points["sound"]["prefix"]`.

### TTS voice

~~By default, the user voice is Brian. Put the desired voice(s) as an array of string under `["voice"]` on either TTS or redeemables.~~

TTS voice can only be set to voice that was defined [in this list](https://github.com/abbr/text2wav.node.js/tree/master/espeak-ng-data/voices/!v)
