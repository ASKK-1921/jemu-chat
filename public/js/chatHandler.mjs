import { chatRoutesUrl, messageRoutesUrl } from './apiRoutes.mjs';
// eslint-disable-next-line import/no-cycle
import { markAllMessagesAsRead } from './commonFunctions.mjs';

const userLoggedIn = $('body').data('uid');

const updateChatName = (chatId, name) => {
	$.ajax({
		url: `${chatRoutesUrl}/${chatId}`,
		type: 'PUT',
		data: { chatName: name },
		success: (data, status, xhr) => {
			if (xhr.status !== 204) {
				// eslint-disable-next-line no-alert
				alert('Could not update');
			} else {
				// eslint-disable-next-line no-restricted-globals
				location.reload();
			}
		},
	});
};

const createMessageHtml = (message, nextMessage, lastSenderId) => {
	const { sender } = message;
	const senderName = `${sender.firstName} ${sender.lastName}`;
	const currentSenderId = sender._id;
	const nextSenderId = nextMessage !== null ? nextMessage.sender._id : '';

	const isFirst = lastSenderId !== currentSenderId;
	const isLast = nextSenderId !== currentSenderId;

	const isMine = message.sender._id === userLoggedIn;
	let liClassName = isMine ? 'mine' : 'theirs';

	let nameElement = '';
	let imageContainer = '';
	let profileImage = '';

	if (isFirst) {
		liClassName += ' first';
		if (!isMine) {
			nameElement = `<span class='senderName'>${senderName}</span>`;
		}
	}

	if (isLast) {
		liClassName += ' last';
		profileImage = `<img src=${sender.profilePicture} />`;
	}

	if (!isMine) {
		imageContainer = `<div class='imageContainer'>
                        ${profileImage}
                      </div>`;
	}

	return `<li class='message ${liClassName}'>
            ${imageContainer}
            <div class='messageContainer'>
              ${nameElement}
              <span class='messageBody'>
                ${message.content}
              </span>
            </div>
          </li>`;
};

const addMessagesHtmlToPage = (html) => {
	$('.chatMessages').append(html);
};

const scrollToBottom = (animated) => {
	const container = $('.chatMessages');
	const { scrollHeight } = container[0];
	if (animated) {
		container.animate({ scrollTop: scrollHeight }, 'slow');
	} else {
		container.scrollTop(scrollHeight);
	}
};

const addChatMessageHtml = (message) => {
	if (!message || !message._id) {
		// eslint-disable-next-line no-alert
		alert('Message is not valid');
		return;
	}

	const messageDiv = createMessageHtml(message, null, '');

	addMessagesHtmlToPage(messageDiv);
	scrollToBottom(true);
};

const loadChatMessages = (chatId) => {
	$.get(`${chatRoutesUrl}/${chatId}/messages`, (data) => {
		const messages = [];
		let lastSenderId = '';
		data.forEach((message, index) => {
			const html = createMessageHtml(message, data[index], lastSenderId);
			messages.push(html);
			lastSenderId = message.sender._id;
		});
		const messagesHtml = messages.join('');
		addMessagesHtmlToPage(messagesHtml);
		scrollToBottom(false);
		markAllMessagesAsRead();
		$('.loadingSpinnerContainer').remove();
		$('.chatContainer').css('visibility', 'visible');
	});
};

const sendMessage = (content, chatId, connected, socket) => {
	$.post(`${messageRoutesUrl}`, { content: content, chatId: chatId }, (data, status, xhr) => {
		if (xhr.status !== 201) {
			// eslint-disable-next-line no-alert
			alert('Could not send message');
			$('.inputTextbox').val(content);
			return;
		}
		addChatMessageHtml(data);
		if (connected) {
			socket.emit('new message', data);
		}
	});
};

export {
	loadChatMessages,
	updateChatName,
	sendMessage,
	addChatMessageHtml,
	createMessageHtml,
	addMessagesHtmlToPage,
	scrollToBottom,
};
