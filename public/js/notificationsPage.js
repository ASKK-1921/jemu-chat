$(document).ready(() => {
	$.get('/api/v1/notifications', (data) => {
		outputNotificationList(data, $('.resultsContainer'));
	});
});
