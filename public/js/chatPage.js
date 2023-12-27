let typing = false;
let lastTypingTime;

$(document).ready(() => {
	socket.emit('join room', chatId);
	socket.on('typing', () => {
		$('.typingDots').show();
	});
	socket.on('stop typing', () => {
		$('.typingDots').hide();
	});
	$.get(`/api/v1/chats/${chatId}`, (data) => {
		$('#chatName').text(getChatName(data));
	});
	$.get(`/api/v1/chats/${chatId}/messages`, (data) => {
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
});

$('#chatNameButton').click(() => {
	const name = $('#chatNameTextbox').val().trim();

	$.ajax({
		url: `/api/v1/chats/${chatId}`,
		type: 'PUT',
		data: { chatName: name },
		success: (data, status, xhr) => {
			if (xhr.status !== 204) {
				alert('Could not update');
			} else {
				location.reload();
			}
		},
	});
});

$('.sendMessageButton').click(() => {
	messageSubmitted();
});

$('.inputTextbox').keydown((event) => {
	updateTyping();

	if (event.which === 13 && !event.shiftKey) {
		messageSubmitted();
		return false;
	}
});

function updateTyping() {
	if (!connected) {
		return;
	}

	if (!typing) {
		typing = true;
		socket.emit('typing', chatId);
	}

	lastTypingTime = new Date().getTime();
	const timerLength = 3000;

	setTimeout(() => {
		const timeNow = new Date().getTime();
		const timeDiff = timeNow - lastTypingTime;
		if (timeDiff >= timerLength && typing) {
			socket.emit('stop typing', chatId);
			typing = false;
		}
	}, timerLength);
}

function messageSubmitted() {
	const content = $('.inputTextbox').val().trim();

	if (content !== '') {
		sendMessage(content);
		$('.inputTextbox').val('');
		socket.emit('stop typing', chatId);
		typing = false;
	}
}

function sendMessage(content) {
	$.post(`/api/v1/messages`, { content: content, chatId: chatId }, (data, status, xhr) => {
		if (xhr.status !== 201) {
			alert('Could not send message');
			$('.inputTextbox').val(content);
			return;
		}
		addChatMessageHtml(data);
		if (connected) {
			socket.emit('new message', data);
		}
	});
}

function addChatMessageHtml(message) {
	if (!message || !message._id) {
		alert('Message is not valid');
		return;
	}

	const messageDiv = createMessageHtml(message, null, '');

	addMessagesHtmlToPage(messageDiv);
	scrollToBottom(true);
}

function createMessageHtml(message, nextMessage, lastSenderId) {
	const { sender } = message;
	const senderName = `${sender.firstName} ${sender.lastName}`;
	const currentSenderId = sender._id;
	const nextSenderId = nextMessage !== null ? nextMessage.sender._id : '';

	const isFirst = lastSenderId !== currentSenderId;
	const isLast = nextSenderId !== currentSenderId;

	const isMine = message.sender._id === userLoggedIn._id;
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
}

function addMessagesHtmlToPage(html) {
	$('.chatMessages').append(html);
}

function scrollToBottom(animated) {
	const container = $('.chatMessages');
	const { scrollHeight } = container[0];
	if (animated) {
		container.animate({ scrollTop: scrollHeight }, 'slow');
	} else {
		container.scrollTop(scrollHeight);
	}
}

function markAllMessagesAsRead() {
	$.ajax({
		url: `/api/v1/chats/${chatId}/messages/markasread`,
		type: 'PUT',
		success: () => {
			refreshMessagesBadge();
		},
	});
}
