const axios = require('axios');
require('dotenv').config();
const SESSION_HEADER = 'bs-session-id';

const {
  BIOSTAR_API,
  BIOSTAR_USER,
  BIOSTAR_PASS,
} = process.env;

const getSessionId = async () => {
  const sessionResponse = await axios({
    method: 'post',
    url: `${BIOSTAR_API}/login`,
    data: {
      User: {
        "login_id": BIOSTAR_USER,
        password: BIOSTAR_PASS,
      }
    }
  });

  return sessionResponse.headers[SESSION_HEADER];
};

const getUsers = async (sessionId) => {
  const headers = {};
  headers[SESSION_HEADER] = sessionId;
  const usersResponse = await axios({
    method: 'get',
    headers,
    url: `${BIOSTAR_API}/users`,
  })
  return usersResponse.data.rows;
};


const createUsers = async (users, sessionId) => {
  if (!users.length) return {
    success: true,
    message: 'No users to create'
  };

  const headers = {};
  headers[SESSION_HEADER] = sessionId;

  try {
    const responses = await Promise.all(users.map(async user => {
      const userResponse = await axios({
        method: 'post',
        url: `${BIOSTAR_API}/users`,
        data: {
          User: {
            disabled: false,
            name: user.givenName || 'NoName',
            email: user.mail,
            "start_datetime": new Date().toISOString(),
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

  try {
    const responses = await Promise.all(users.map(async user => {
      const userResponse = await axios({
        method: 'put',
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