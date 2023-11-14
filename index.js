const azure = require('./lib/azure');
const biostar = require('./lib/biostar');

const main = async () => {

  const biostarSessionId = await biostar.getSessionId();

  const azureUsers = await azure.getUsers();
  const biostarUsers = await biostar.getUsers(biostarSessionId);

  const lastID = biostarUsers
    .map(user => Number(user.user_id))
    .sort((a, b) => a - b)
    .pop();

  const usersToCreate = azureUsers
    .filter(azureUser =>
      azureUser.mail &&
      !biostarUsers
        .find(biostarUser => biostarUser?.email?.toLowerCase() === azureUser?.mail?.toLowerCase()
        ))
    .map((user, index) => ({
      ...user,
      biostarID: lastID + index + 1
    }));

  const usersToDisable = biostarUsers.filter(biostarUser =>
    biostarUser.email &&
    biostarUser.disabled !== 'true' &&
    biostarUser?.permission?.id !== '1' &&
    !azureUsers.find(azureUser => azureUser?.mail?.toLowerCase() === biostarUser?.email?.toLowerCase())
  );

  const usersToEnable = biostarUsers.filter(biostarUser =>
    biostarUser.email &&
    biostarUser.disabled === 'true' &&
    azureUsers.find(azureUser => azureUser?.mail?.toLowerCase() === biostarUser?.email?.toLowerCase())
  );

  const createResponse = await biostar.createUsers(usersToCreate, biostarSessionId);
  const disableResponse = await biostar.toggleUsers(usersToDisable, biostarSessionId, true);
  const enableResponse = await biostar.toggleUsers(usersToEnable, biostarSessionId, false);

  console.log(
    createResponse,
    disableResponse,
    enableResponse,
  )
};

main();