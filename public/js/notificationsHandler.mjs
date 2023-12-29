import { notificationRoutesUrl } from './apiRoutes.mjs';
import { outputNotificationList } from './commonFunctions.mjs';

const listNotifications = () => {
	$.get(notificationRoutesUrl, (data) => {
		outputNotificationList(data, $('.resultsContainer'));
	});
};

// eslint-disable-next-line import/prefer-default-export
export { listNotifications };
