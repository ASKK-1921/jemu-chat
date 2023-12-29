import { userRoutesUrl } from './apiRoutes.mjs';
import { outputUsers } from './commonFunctions.mjs';

const listUsers = (profileUserId, selectedTab) => {
	$.get(`${userRoutesUrl}/${profileUserId}/${selectedTab}`, (results) => {
		outputUsers(results, $('.resultsContainer'));
	});
};

// eslint-disable-next-line import/prefer-default-export
export { listUsers };
