const sfxBase = 'sound-effects/';
const ttsBase = window.location.origin + '/api/tts';

const voiceList = [
  'Andy',
  'Annie',
  'AnxiousAndy',
  'Denis',
  'Gene',
  'Gene2',
  'Jacky',
  'Lee',
  'Mario',
  'Michael',
  'Mr',
  'serious',
  'Storm',
  'Tweaky',
  'aunty',
  'boris',
  'croak',
  'f1',
  'f2',
  'f3',
  'f4',
  'f5',
  'iven',
  'iven2',
  'iven3',
  'john',
  'kaukovalta',
  'klatt',
  'klatt2',
  'klatt3',
  'klatt4',
  'linda',
  'm1',
  'm2',
  'm3',
  'm4',
  'm5',
  'm6',
  'm7',
  'm8',
  'max',
  'michel',
  'norbert',
  'quincy',
  'rob',
  'robert',
  'steph',
  'steph2',
  'steph3',
  'travis',
  'whisper',
  'whisperf',
  'zac',
];

let soundsPlayed = [];
/** @type {Map<string AudioBuffer>} */
const soundCache = new Map();
const events = new EventEmitter();
const queue = {
  isPlaying: false,
  list: [],
  currentlyPlaying: null,
};

const audioCtx = new AudioContext();
const audioGain = audioCtx.createGain();
audioGain.gain.value = 1;
audioGain.connect(audioCtx.destination);

async function loadSound(location, dontCache = false) {
  if (!dontCache) {
    const sound = soundCache.get(location);
    if (sound) {
      return sound;
    }
  }
  let audioBuf;
  try {
    const res = await fetch(location);
    const arrayBuf = await res.arrayBuffer();
    audioBuf = await audioCtx.decodeAudioData(arrayBuf);
  } catch {
    console.error(`Failed to load sound at: "${location}"`);
    return null;
  }
  if (!dontCache) {
    soundCache.set(location, audioBuf);
  }
  return audioBuf;
}

function loadSoundNoCache(location) {
  return loadSound(location, true);
}

function playSound(audio) {
  return new Promise((resolve, reject) => {
    if (!audio) return resolve();
    const source = audioCtx.createBufferSource();
    source.buffer = audio.buffer;
    audioGain.gain.value = audio.volume || 1;
    source.connect(audioGain);
    source.start(audioCtx.currentTime);
    source.onended = () => {
      queue.currentlyPlaying = null;
      resolve();
    };
    queue.currentlyPlaying = {
      stop() {
        source.stop();
        resolve();
      },
    };
  });
}

async function playQueue() {
  if (!queue.list.length) {
    return;
  } else if (queue.isPlaying) {
    return once(events, 'queue-next').then(playQueue);
  }
  queue.isPlaying = true;
  const listItem = queue.list.shift();
  for (const item of listItem.items) {
    await playSound(item);
  }
  queue.isPlaying = false;
  events.emit('queue-next');
}

async function addToQueue(...items) {
  for (const [i, n] of items.entries()) {
    if (n.sound === 'sfx') {
      const isString = typeof n === 'string';
      const name = isString ? n : n.location;
      items[i] = {
        buffer: await loadSound(name),
        volume: isString ? 1 : n.volume || 1,
      };
    } else {
      items[i] = { buffer: n.location, volume: n.volume };
    }
  }
  queue.list.push({ items });
  playQueue();
}

socket.on('tts', async ({ text, voice: voiceInput = 'm1', volume = 0.75 }) => {
  const voice =
    voiceList.findIndex((i) => i === voiceInput) !== -1
      ? voiceInput
      : voiceList[Math.floor(Math.random() * voiceList.length)];

  const qs = new URLSearchParams({ voice, text });
  addToQueue({
    location: await loadSoundNoCache(`${ttsBase}?${qs}`),
    volume: volume,
    sound: 'tts',
  });
});

socket.on('sfx', ({ command, soundEffect, volume = 1 }) => {
  const { files } = soundEffect;
  let file;
  if (files.length > 1) {
    const filteredFiles = files.filter((n) => !soundsPlayed.includes(n));
    const list = filteredFiles.length
      ? filteredFiles
      : files.filter((n) => n !== soundsPlayed[soundsPlayed.length - 1]);
    file = list[Math.floor(Math.random() * list.length)];
  } else {
    file = files[0];
  }
  const isString = typeof file === 'string';
  let name = isString ? file : file.name;
  soundsPlayed = soundsPlayed.slice(-2);
  if (!soundsPlayed.includes(name)) {
    soundsPlayed.push(name);
  }
  const location = sfxBase + name;
  addToQueue({ location, volume, sound: 'sfx' });
});

socket.on('skip', () => {
  if (queue.currentlyPlaying) {
    queue.currentlyPlaying.stop();
  }
});
