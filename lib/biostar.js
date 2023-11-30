const axios = require('axios');
const https = require('https');
const { DateTime } = require('luxon');
require('dotenv').config();
const SESSION_HEADER = 'bs-session-id';
const BATCH_SIZE = 50;

const {
  BIOSTAR_API,
  BIOSTAR_USER,
  BIOSTAR_PASS,
} = process.env;

const HTTPS_AGENT = new https.Agent({
  rejectUnauthorized: false,
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const getSessionId = async () => {
  try {
    console.info(`Getting biostar session ID`);
    const sessionResponse = await axios({
      method: 'post',
      httpsAgent: HTTPS_AGENT,
      url: `${BIOSTAR_API}/login`,
      data: {
        User: {
          "login_id": BIOSTAR_USER,
          password: BIOSTAR_PASS,
        }
      }
    });
    return sessionResponse.headers[SESSION_HEADER];
  } catch (e) {
    console.error('Error gettoing biostart session id', e.message);
  }
};

const getUsers = async (sessionId) => {
  try {
    console.info(`Getting all biostar users`);
    const headers = {};
    headers[SESSION_HEADER] = sessionId;
    const usersResponse = await axios({
      method: 'get',
      httpsAgent: HTTPS_AGENT,
      headers,
      url: `${BIOSTAR_API}/users`,
    })
    return usersResponse?.data['UserCollection']?.rows;
  } catch (e) {
    console.error('Error getting biostar users')
  }
};

const createUsers = async (users, sessionId) => {
  if (!users.length) return {
    success: true,
    message: 'No users to create'
  };
  const headers = {};
  headers[SESSION_HEADER] = sessionId;
  console.info(`Creating ${users.length} users in biostar`);
  try {
    const today = DateTime.now().toFormat('yyyy-LL-dd\'T\'hh:mm:ss');
    const expirationDate = DateTime.fromISO('2030-01-01').toFormat('yyyy-LL-dd\'T\'hh:mm:ss');
    const totalCreated = { total: 0, batch: 1 };
    while (users.length) {
      console.log(`Batch ${totalCreated.batch}`);
      const batch = users.splice(0, users.length < BATCH_SIZE ? users.length : BATCH_SIZE);
      const responses = await Promise.all(batch.map(async user => {
        const userResponse = await axios({
          method: 'post',
          headers,
          httpsAgent: HTTPS_AGENT,
          url: `${BIOSTAR_API}/users`,
          data: {
            User: {
              user_id: user.biostarID,
              user_group_id: {
                id: 1
              },
              disabled: false,
              name: user.givenName
                ? `${user.givenName}${user.surname ? ` ${user.surname}` : ''}`.replace(/['‘’"“”]/g, '')
                : 'NoName',
              email: user.mail,
              start_datetime: today,
              expiry_datetime: expirationDate,
            }
          }
        });
        return userResponse;
      }));
      totalCreated.total += responses.length;
      totalCreated.batch += 1;
      await sleep(5000);
    }
    return {
      success: true,
      message: `${totalCreated.total} users created`
    }
  } catch (e) {
    console.log(e);
    return {
      success: false,
      error: e.message,
    }
  }
};

const toggleUsers = async (users, sessionId, disabled) => {
  if (!users.length) return {
    success: true,
    message: `No users to ${disabled ? 'disable' : 'enable'}`
  };

  const headers = {};
  headers[SESSION_HEADER] = sessionId;
  console.info(`${disabled ? 'Disabling' : 'Enabling'} ${users.length} users in biostar`);

  try {
    const totalUpdated = { total: 0, batch: 1 };
    while (users.length) {
      console.log(`Batch ${totalUpdated.batch}`);
      const batch = users.splice(0, users.length < BATCH_SIZE ? users.length : BATCH_SIZE);
      const responses = await Promise.all(batch.map(async user => {
        const userResponse = await axios({
          method: 'put',
          headers,
          httpsAgent: HTTPS_AGENT,
          url: `${BIOSTAR_API}/users/${user.user_id}`,
          data: {
            User: {
              disabled
            }
          }
        });
        return userResponse;
      }));
      totalUpdated.total += responses.length;
      totalUpdated.batch += 1;
      await sleep(5000);
    }
    return {
      success: true,
      message: `${totalUpdated.total} users ${disabled ? 'disabled' : 'enabled'}`
    }
  } catch (e) {
    console.log(e);
    return {
      success: false,
      error: e.message,
    }
  }
};

module.exports = {
  getSessionId,
  getUsers,
  createUsers,
  toggleUsers,
}