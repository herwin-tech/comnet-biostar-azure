const azure = require('./lib/azure');
const biostar = require('./lib/biostar');

const main = async () => {
  const azureUsers = await azure.getUsers();
  const biostarUsers = biostar.getUsers();

  console.log('MS users', azureUsers);
  console.log('BIOS users', biostarUsers);

  const usersToCreate = azureUsers
    .filter(azureUser =>
      azureUser.mail && !biostarUsers.find(biostarUser => biostarUser.email.toLowerCase() === azureUser.mail.toLowerCase()
      ));

  const usersToEnable = azureUsers
    .filter(azureUser =>
      azureUser.mail &&
      biostarUsers.find(biostarUser =>
        biostarUser.email.toLowerCase() === azureUser.mail.toLowerCase() &&
        biostarUser.disabled,
      ));

  const usersToDisable = biostarUsers.filter(biostarUser =>
    !azureUsers.find(
      azureUser =>
        !biostarUser.disabled &&
        biostar.login_id !== "admin" &&
        biostarUser.email.toLowerCase() === azureUser?.mail?.toLowerCase()
    ));

  const biostarSessionId = biostar.getSessionId();
  const createResponse = biostar.createUsers(usersToCreate, biostarSessionId);
  const enableResponse = biostar.toggleUsers(usersToEnable, biostarSessionId, false);
  const disableResponse = biostar.toggleUsers(usersToDisable, biostarSessionId, false);

  console.log(
    createResponse,
    enableResponse,
    disableResponse,
  )
};

main()