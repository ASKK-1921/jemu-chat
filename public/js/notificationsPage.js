$(document).ready(() => {
	$.get('/api/notifications', (data) => {
		outputNotificationList(data, $('.resultsContainer'));
	});
});
