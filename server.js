const fs = require('fs');
const path = require('path');

require('dotenv').config();
const express = require('express');
const socketIO = require('socket.io');
const Session = require('express-session');
const text2wav = require('text2wav');

const { getSoundEffects, state } = require('./lib/config');
const { getAccessToken, validateUser } = require('./lib/twitchapi');
const events = require('./lib/events');

const ws = require('./lib/ws-client');

const points_config_file = fs.readFileSync(
  path.join(process.cwd(), '.config', 'points.json'),
  'utf-8'
);
const points_config = JSON.parse(points_config_file);

const base_url = process.env.BASE_URL;
const redirect_uri = base_url + '/oauth2/twitch';
const client_id = process.env.CLIENT_ID;
const port = process.env.HTTP_PORT || 8080;

const app = express();
const server = app.listen(port, () => {
  console.log('Listening :' + server.address().port);
});
const io = socketIO(server);

app.use(express.static('www', { extensions: ['html'] }));
app.use(
  Session({
    cookie: {
      secure: !!process.env.SECURE_COOKIE,
      maxAge: 6 * 60 * 1000,
    },
    proxy: true,
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.enable('trust proxy');

// Use request sessionID as state
app.get('/api/verify', async (req, res) => {
  let twitchOAuthUrl =
    'https://id.twitch.tv/oauth2/authorize' +
    '?client_id=' +
    client_id +
    '&redirect_uri=' +
    decodeURIComponent(redirect_uri) +
    '&response_type=code&scope=channel:read:redemptions' +
    '&state=' +
    req.sessionID;
  res.redirect(302, twitchOAuthUrl);
});

app.get('/oauth2/twitch', async (req, res) => {
  const q = req.query;
  if (q.state !== req.query.state) {
    console.log(q.state);
    console.log(req.query.state);
    console.log('Session ID mismatch');
    res.redirect(302, base_url + '/error');
  } else if (req.query.hasOwnProperty('error')) {
    console.log('Error on query');
    res.redirect(302, base_url + '/error');
  } else {
    const e = {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      code: q.code,
      grant_type: 'authorization_code',
      redirect_uri: decodeURIComponent(redirect_uri),
      scope: 'channel:read:redemptions',
    };

    try {
      const r = await getAccessToken(e);
      if (r) {
        const uid = await validateUser(r.access_token);
        if (uid !== null) {
          // Use code
          const access_token = r.access_token;
          const refresh_token = r.refresh_token;

          fs.writeFileSync(
            path.join(process.cwd(), '.config', 'tokens', 'access'),
            access_token
          );
          fs.writeFileSync(
            path.join(process.cwd(), '.config', 'tokens', 'refresh'),
            refresh_token
          );
          fs.writeFileSync(
            path.join(process.cwd(), '.config', 'tokens', 'id'),
            uid
          );
          res
            .status(200)
            .send('Matching user_id. Wait for 5 minutes or restart your app.');
        } else {
          res.status(400).send('User mismatch');
        }
      } else {
        res.status(400).send('User mismatch');
      }
    } catch (e) {
      console.log(e);
      res.status(500).send('Error');
    }
  }
});

app.get('/api/sounds/list', async (req, res) => {
  const sounds = await getSoundEffects();
  res.json({ sounds });
});

app.get('/api/state', (req, res) => {
  res.json(state);
});

app.post('/api/state/tts/toggle', (req, res) => {
  state.tts.enabled = !state.tts.enabled;
  res.json(state);
  updateState();
});

app.get('/api/tts', async (req, res) => {
  const encodedText = req.query['text'];
  const voice = req.query['voice'];

  if (!encodedText) {
    res.sendStatus(400);
    return;
  }

  const text = decodeURIComponent(encodedText);
  const out = await text2wav(text, {
    speed: points_config['tts']['speed'] || 100,
    voice: `en+${voice}`,
  });

  res.send(Buffer.from(out));
});

app.use((req, res, next) => {
  res.sendStatus(404);
});

app.use((err, req, res, next) => {
  console.error(err);
  res.sendStatus(500);
});

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

events.on('sfx', (...args) => io.emit('sfx', ...args));
events.on('tts', (...args) => io.emit('tts', ...args));

function updateState() {
  io.emit('state', state);
}

io.on('connect', (socket) => {
  socket.on('toggle-tts', () => {
    state.tts.enabled = !state.tts.enabled;
    updateState();
  });
  socket.on('skip', () => io.emit('skip'));
});

process.on('warning', (e) => console.warn(e.stack));
