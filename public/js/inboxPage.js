$('document').ready(() => {
	url = '/api/chats';
	$.get(url, (data, status, xhr) => {
		if (xhr.status === 400) {
			alert('Could not get the chat list.');
		} else {
			outputChatList(data, $('.resultsContainer'));
		}
	});
});

function outputChatList(chatList, container) {
	chatList.forEach((chat) => {
		const html = createChatHtml(chat);
		container.append(html);
	});

	if (chatList.length === 0) {
		container.append('<span class="noResults>Nothing to show.</span>');
	}
}
