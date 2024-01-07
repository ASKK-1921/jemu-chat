import { userRoutesUrl } from './apiRoutes.mjs';
import { outputUsers } from './commonFunctions.mjs';

const listUsers = (profileUserId, selectedTab) => {
	$.get(`${userRoutesUrl}/${profileUserId}/${selectedTab}`, (results) => {
		outputUsers(results, $('.resultsContainer'));
	});
};

const listContacts = (profileUserId) => {
	$.get(`${userRoutesUrl}/${profileUserId}/following`, (results) => {
		outputUsers(results, $('.contactList'), false);
	});
};

// eslint-disable-next-line import/prefer-default-export
export { listUsers, listContacts };
