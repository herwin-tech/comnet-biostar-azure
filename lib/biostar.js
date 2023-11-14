const axios = require('axios');
const https = require('https');
const { DateTime } = require('luxon');
require('dotenv').config();
const SESSION_HEADER = 'bs-session-id';

const {
  BIOSTAR_API,
  BIOSTAR_USER,
  BIOSTAR_PASS,
} = process.env;

const HTTPS_AGENT = new https.Agent({
  rejectUnauthorized: false,
});

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
    const today = DateTime.now().toISO();
    const expirationDate = DateTime.fromISO('2030-01-01').toISO();
    const responses = await Promise.all(users.map(async user => {
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
            name: user.givenName || 'NoName',
            email: user.mail,
            start_datetime: today,
            expiry_datetime: expirationDate,
          }
        }
      });
      return userResponse;
    }));
    return {
      success: true,
      message: `${responses.length} users created`
    }
  } catch (e) {
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
    const responses = await Promise.all(users.map(async user => {
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
    return {
      success: true,
      message: `${responses.length} users ${disabled ? 'disabled' : 'enabled'}`
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