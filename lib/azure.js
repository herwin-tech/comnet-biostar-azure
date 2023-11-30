const axios = require('axios');
require('dotenv').config();

const getToken = async () => {
  const {
    AZURE_LOGIN_API,
    AZURE_TENANT_ID,
    AZURE_CLIENT_ID,
    AZURE_SCOPE,
    AZURE_CLIENT_SECRET,
    AZURE_GRAN_TYPE,
  } = process.env;

  const formData = new FormData()
  formData.append("client_id", AZURE_CLIENT_ID);
  formData.append("scope", AZURE_SCOPE);
  formData.append("client_secret", AZURE_CLIENT_SECRET);
  formData.append("grant_type", AZURE_GRAN_TYPE);

  const loginResponse = await axios({
    method: 'post',
    url: `${AZURE_LOGIN_API}/${AZURE_TENANT_ID}/oauth2/v2.0/token`,
    data: formData,
  });
  return loginResponse.data.access_token;
}

const getUsers = async (users = [], nextLink, batch = 1) => {
  const {
    AZURE_GRAPH_API
  } = process.env;
  try {
    console.info(`Getting azure users, batch ${batch}`);
    const token = await getToken();
    const usersResponse = await axios({
      method: 'get',
      url: nextLink || `${AZURE_GRAPH_API}/users/?$filter=AccountEnabled eq true`,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    users.push(...usersResponse.data.value);
    if (usersResponse.data["@odata.nextLink"]) {
      await getUsers(
        users,
        usersResponse.data["@odata.nextLink"],
        batch + 1,
      );
    }
    return users;
  } catch (e) {
    console.error('Error getting azure users')
  }
};

module.exports = {
  getUsers,
}