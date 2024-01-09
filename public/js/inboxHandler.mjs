import { chatRoutesUrl } from './apiRoutes.mjs';
import { createChatHtml } from './commonFunctions.mjs';

const outputChatList = (chatList, container) => {
	chatList.forEach((chat) => {
		const html = createChatHtml(chat);
		container.append(html);
	});

	if (chatList.length === 0) {
		container.append('<span class="noResults>Nothing to show.</span>');
	}
};

const listChats = (mode) => {
	$.get(chatRoutesUrl, { inboxType: mode }, (data, status, xhr) => {
		if (xhr.status === 400) {
			// eslint-disable-next-line no-alert
			alert('Could not get the chat list.');
			return;
		}
		outputChatList(data, $('.resultsContainer'));
	});
};

// eslint-disable-next-line import/prefer-default-export
export { listChats };
