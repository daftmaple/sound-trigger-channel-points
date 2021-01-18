const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const { getSoundEffects } = require('./config');
const { refreshAccessToken } = require('./twitchapi');
const events = require('./events');

const points_config_file = fs.readFileSync(
  path.join(process.cwd(), '.config', 'points.json'),
  'utf-8'
);
const points_config = JSON.parse(points_config_file);

const connect = async (token, retryCount) => {
  try {
    const channel_id = fs.readFileSync(
      path.join(process.cwd(), '.config', 'tokens', 'id'),
      'utf8'
    );

    console.log('Retry count: ' + retryCount);
    if (retryCount === 0) {
      console.log('Ran out of retry, wait for 1 minute');
      await sleep(60 * 1000);
      return connect(token, 3);
    }

    if (token.length === 0 || channel_id.length === 0) {
      console.log(
        'Token or channel_id is empty. Please verify. Sleep for 5 minutes'
      );
      const access_token = fs.readFileSync(
        path.join(process.cwd(), '.config', 'tokens', 'access'),
        'utf8'
      );
      await sleep(60 * 1000 * 5);
      return connect(access_token, 3);
    }

    const ws = new WebSocket('wss://pubsub-edge.twitch.tv');

    ws.on('open', () => {
      const topic = 'channel-points-channel-v1.' + channel_id;
      // Set to listen on event
      const p = JSON.stringify({
        type: 'LISTEN',
        data: {
          topics: [topic],
          auth_token: token,
        },
      });
      ws.send(p);

      // Ping regularly (every 60 seconds/min * 2.5 min)
      let v = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'PING',
            })
          );
        } else {
          console.log('Stopped ping from pubsub');
          clearInterval(v);
        }
      }, 60 * 1000 * 2.5);
    });

    ws.on('message', async (p) => {
      try {
        const data = JSON.parse(p);

        if (data.type === 'MESSAGE') {
          await handleMessage(data);
        } else if (data.type === 'RECONNECT') {
          console.log(
            'Received reconnect message from Twitch. Reconnecting to ws...'
          );
          ws.close();
          return connect(token, 5);
        } else if (data.type === 'PONG') {
          // console.log('Received pong from pubsub');
        } else {
          // There might be an error. Print out the response
          console.log('Response message from Twitch:');
          console.log(data);

          if (data.error === 'ERR_BADAUTH') {
            console.log('Bad auth. Requesting new OAuth2 access token');
            const token = await refreshAccessToken();
            ws.close();
            return connect(token.access_token, retryCount - 1);
          }
        }
      } catch (e) {
        console.log('ws.on message error: ', e);
      }
    });
  } catch (e) {
    console.log('connect error: ', e);
  }
};

const handleMessage = async (data) => {
  const r = JSON.parse(data.data.message);
  const title = r.data.redemption.reward.title;
  const username = r.data.redemption.user.display_name;

  console.log(`User: ${username} redeemed ${title}`);

  const tts_prefix =
    points_config['tts']['prefix'].length !== 0
      ? points_config['tts']['prefix']
      : 'TTS';
  const sound_prefix =
    points_config['sound']['prefix'].length !== 0
      ? points_config['sound']['prefix']
      : 'Soundboard: ';

  if (title.toLowerCase().startsWith(tts_prefix.toLowerCase())) {
    const user_input = r.data.redemption.user_input;
    const args = title.split(tts_prefix);
    const voiceList = points_config['tts']['voice'];
    const voice = args[1]
      ? args[1]
      : voiceList[Math.floor(Math.random() * voiceList.length)];
    const volume = points_config['tts']['volume'];
    const speech = username + ' sent a message: ' + user_input;

    if (filterMessage(speech)) {
      events.emit('tts', { text: speech, voice, volume: volume });
    }
  } else if (title.toLowerCase().startsWith(sound_prefix.toLowerCase())) {
    const args = title.split(sound_prefix);
    const soundToPlay = args[1].toLowerCase();
    const sounds = await getSoundEffects();
    const soundEffect = sounds.find(
      (n) =>
        (n.name.toLowerCase() === soundToPlay ||
          (n.aliases && n.aliases.includes(soundToPlay))) &&
        (!n.events || n.events.includes('sfx'))
    );

    if (soundEffect) {
      events.emit('sfx', {
        soundToPlay,
        soundEffect,
        volume: soundEffect.volume,
      });
    }
  } else if (
    points_config['redemptions']['redeemables'].findIndex(
      (item) => title.toLowerCase() === item.toLowerCase()
    ) !== -1
  ) {
    const voiceList = points_config['redemptions']['voice'];
    const voice = voiceList[Math.floor(Math.random() * voiceList.length)];

    const speech = username + ' redeemed channel points: ' + title;
    const volume = points_config['tts']['volume'];

    events.emit('tts', { text: speech, voice, volume: volume });
  }
};

const filterMessage = (message) => {
  const bad_words = fs.readFileSync(
    path.join(process.cwd(), '.config', 'filter', 'regex.txt'),
    'utf-8'
  );
  const bad_words_array = bad_words.split('\n');

  for (let i = 0; i < bad_words_array.length; i++) {
    const str = bad_words_array[i];
    if (str.length === 0) continue;
    const re = new RegExp(str.replace(/(\r\n|\n|\r)/gm, ''), 'igm');
    if (re.test(message)) {
      return false;
    }
  }

  return true;
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

console.log('Spawning ws client');
const t = fs.readFileSync(
  path.join(process.cwd(), '.config', 'tokens', 'access'),
  'utf8'
);
console.log(`token: ${t}`);
connect(t, 3);
