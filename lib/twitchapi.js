const fs = require('fs');
const path = require('path');

const fetch = require('node-fetch');
const qs = require('qs');

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;

const refreshAccessToken = async () => {
  try {
    const refresh_token = fs.readFileSync(
      path.join(process.cwd(), '.config', 'tokens', 'refresh'),
      'utf8'
    );
    const exchange = {
      client_id: client_id,
      client_secret: client_secret,
      grant_type: 'refresh_token',
      refresh_token: refresh_token,
    };

    const r = await fetch(`https://id.twitch.tv/oauth2/token`, {
      method: 'POST',
      body: qs.stringify(exchange),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const j = await r.json();

    return j;
  } catch (e) {
    console.error('Exchange error: ' + e);
    return null;
  }
};

const getAccessToken = async (exchange) => {
  try {
    const r = await fetch(`https://id.twitch.tv/oauth2/token`, {
      method: 'POST',
      body: qs.stringify(exchange),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const j = await r.json();

    return j;
  } catch (e) {
    console.error('Exchange error: ' + e);
    return null;
  }
};

const validateUser = async (token) => {
  console.log('Validating access token. Check if user matches login');

  try {
    const auth = 'OAuth ' + token;
    const r = await fetch(`https://id.twitch.tv/oauth2/validate`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: auth,
      },
    });

    const j = await r.json();

    if (j.login && j.login == process.env.CHANNEL_LOGIN.toLowerCase()) {
      console.log('Matching login');
      return j.user_id;
    }

    console.log('Mismatch on login');
    return null;
  } catch (e) {
    console.error('Exchange error: ' + e);
    return null;
  }
};

module.exports = {
  refreshAccessToken,
  getAccessToken,
  validateUser,
};
