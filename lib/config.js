const fs = require('fs');
const path = require('path');
const { EventEmitter, once } = require('events');

const tomlParse = require('@iarna/toml/parse-stream');

const state = {
  tts: {
    enabled: true,
  },
};

const configCache = {
  currentlyReading: false,
  events: new EventEmitter(),
};

/**
 * A file object.
 * @typedef File
 * @prop {string} name The file name.
 * @prop {number} volume The volume to play the file at.
 */

/**
 * A sound.
 * @typedef Sound
 * @property {string} name Name of the sound effect.
 * @property {string[] | File[]} files The location of the file relative to the
 * www/sounds-effects folder.
 * @property {string[] | undefined} aliases Aliases for the name of the sound effect.
 * @property {number} volume Volume of th esound effect.
 */

/**
 * @typedef Config
 * @property {Sound[]} sounds A list of sounds.
 */

/**
 * @returns {Promise<Config>}
 */
function readConfig() {
  if (configCache.currentlyReading) {
    return once(configCache.events, 'config-read');
  }
  configCache.currentlyReading = true;
  const stream = fs.createReadStream(
    path.join(process.cwd(), '.config', 'config.toml')
  );
  return tomlParse(stream)
    .then((config) => {
      configCache.currentlyReading = false;
      process.nextTick(() => configCache.events.emit('config-read', config));
      return config;
    })
    .catch((err) => {
      configCache.currentlyReading = false;
      console.error(err);
      configCache.events.emit('error', err);
    });
}

/**
 * @return {Promise<Sound[]>}
 */
async function getSoundEffects() {
  const config = await readConfig();
  return config.sounds;
}

module.exports = {
  readConfig,
  getSoundEffects,

  state,
};
