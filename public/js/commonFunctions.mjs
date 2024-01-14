import { chatRoutesUrl, notificationRoutesUrl, s3Url } from './apiRoutes.mjs';
// eslint-disable-next-line import/no-cycle
import { addMessagesHtmlToPage, createMessageHtml, scrollToBottom } from './chatHandler.mjs';

const userLoggedIn = $('body').data('uid');

const timeDifference = (current, previous) => {
	const msPerMinute = 60 * 1000;
	const msPerHour = msPerMinute * 60;
	const msPerDay = msPerHour * 24;
	const msPerMonth = msPerDay * 30;
	// const msPerYear = msPerDay * 365;

	const elapsed = current - previous;

	const options = {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	};

	if (elapsed < msPerMinute) {
		return 'Just now';
	}
	if (elapsed < msPerHour) {
		return `${Math.round(elapsed / msPerMinute)}m`;
	}
	if (elapsed < msPerDay) {
		return `${Math.round(elapsed / msPerHour)}h`;
	}
	if (elapsed < msPerMonth) {
		return `${Math.round(elapsed / msPerDay)}d`;
	}
	// if (elapsed < msPerYear) {
	// 	// return `${Math.round(elapsed / msPerMonth)}M`;
	// }
	return previous.toLocaleDateString('en-GB', options);
	// return `${Math.round(elapsed / msPerYear)}Y`;
};

const getPostIdFromElement = (element) => {
	const isRoot = element.hasClass('post');
	const rootElement = isRoot === true ? element : element.closest('.post');
	const postId = rootElement.data().id;

	if (postId === undefined) {
		// eslint-disable-next-line no-alert
		return alert('Post ID undefined');
	}
	return postId;
};

const createPostHtml = (postData, largeFont = false) => {
	if (postData == null) {
		// eslint-disable-next-line no-alert
		return alert('Post object is null');
	}

	const isShared = postData.shareData !== undefined;
	const sharedBy = isShared ? postData.postedBy.username : null;
	postData = isShared ? postData.shareData : postData;

	const { postedBy } = postData;
	const displayName = `${postedBy.firstName} ${postedBy.lastName}`;
	const timestamp = timeDifference(new Date(), new Date(postData.createdAt));
	const likeButtonActiveClass = postData.likes.includes(userLoggedIn) ? 'active' : '';
	const shareButtonActiveClass = postData.shareUsers.includes(userLoggedIn) ? 'active' : '';
	const largeFontClass = largeFont ? 'largeFont' : '';

	if (postedBy._id === undefined) {
		// eslint-disable-next-line no-console
		return console.log('User object not defined');
	}

	let shareText = '';
	if (isShared) {
		shareText = `<span><i class='fa-solid fa-repeat'></i> Retweeted by <a href='/profile/${sharedBy}'>@${sharedBy}</a></span>`;
	}

	let replyFlag = '';
	if (postData.replyTo && postData.replyTo._id) {
		if (!postData.replyTo._id) {
			// eslint-disable-next-line no-alert
			return alert('Reply to is not populated');
		}
		if (!postData.replyTo.postedBy._id) {
			// eslint-disable-next-line no-alert
			return alert('Posted by is not populated');
		}

		const replyToUsername = postData.replyTo.postedBy.username;
		replyFlag = `<div class='replyFlag'>
                  Replying to <a href='/profile/${replyToUsername}'>@${replyToUsername}</a>
                </div>`;
	}

	let buttons = '';
	let pinnedPostText = '';

	if (postData.postedBy._id === userLoggedIn) {
		let pinnedClass = '';
		let dataTarget = '#confirmPinModalCenter';
		if (postData.pinned === true) {
			pinnedClass = 'active';
			dataTarget = '#unpinPostModalCenter';
			pinnedPostText = `<span class='material-symbols-outlined'>push_pin</span> <span>Pinned post</span>`;
		}
		// TODO: Maybe put these in a drop-down menu to save on space, especially on mobile
		buttons = `<button class='pinButton ${pinnedClass}' data-id='${postData._id}' data-bs-toggle='modal' data-bs-target='${dataTarget}'>
                  <span class='material-symbols-outlined'>push_pin</span>
								</button>
								<button data-id='${postData._id}' data-bs-toggle='modal' data-bs-target='#deletePostModalCenter'>
									<span class='material-symbols-outlined'>delete</span>
								</button>`;
	}

	return `<div class='post ${largeFontClass}' data-id='${postData._id}'>
            <div class='postActionContainer'>
              ${shareText}
            </div>
            <div class='mainContentContainer'>
              <div class='userImageContainer'>
                <img src='${s3Url}/${postedBy.profilePicture}'/>
              </div>
              <div class='postContentContainer'>
                <div class='pinnedPostText'>${pinnedPostText}</div>
                <div class='header'>
                  <a href='/profile/${postedBy.username}' class='displayName'>${displayName}</a>
                  <span class='username'>@${postedBy.username}</span>
                  <span class='date'>${timestamp}</span>
                  ${buttons}
                </div>
                ${replyFlag}
                <div class='postBody'>
                  <span>${postData.content}</span>
                </div>
                <div class='postFooter'>
                  <div class='postButtonContainer'>
                    <button data-bs-toggle='modal' data-bs-target='#replyModalCenter'>
										<span class='material-symbols-outlined'>add_comment</span>
                    </button>
                  </div>
                  <div class='postButtonContainer green'>
                    <button class='shareButton ${shareButtonActiveClass}'>
                    <span class='material-symbols-outlined'>share</span>
                    </button>
										<span class='shareButtonCount'>${postData.shareUsers.length || ''}</span>
                  </div>
                  <div class='postButtonContainer red'>
                    <button class='likeButton ${likeButtonActiveClass}'>
											<span class='material-symbols-outlined'>favorite</span>
                    </button>
										<span class='likeButtonCount'>${postData.likes.length || ''}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>`;
};

const outputPosts = (results, container) => {
	container.html('');

	if (!Array.isArray(results)) {
		results = [results];
	}

	results.forEach((result) => {
		const html = createPostHtml(result);
		container.append(html);
	});

	if (results.length === 0) {
		container.append(`<span class='noResults'>Nothing to show</span>`);
	}
};

const outputPostsWithReplies = (results, container) => {
	container.html('');
	if (results.replyTo !== undefined && results.replyTo._id !== undefined) {
		const html = createPostHtml(results.replyTo);
		container.append(html);
	}

	const mainPostHtml = createPostHtml(results.postData, true);
	container.append(mainPostHtml);

	results.replies.forEach((result) => {
		const html = createPostHtml(result);
		container.append(html);
	});
};

const createUserHtml = (userData, showFollowButton) => {
	const name = `${userData.firstName} ${userData.lastName}`;
	const isFollowing = userData.followers && userData.followers.includes(userLoggedIn);

	const text = isFollowing ? 'Following' : 'Follow';
	const buttonClass = isFollowing ? 'followButton following' : 'followButton';

	let followButton = '';

	if (showFollowButton && userLoggedIn !== userData._id) {
		followButton = `<div class='followButtonContainer'>
                      <button class='${buttonClass}' data-user='${userData._id}'>${text}</button>
                    </div>`;
	}

	return `<div class='user'>
            <div class='userImageContainer'>
              <img src='${s3Url}/${userData.profilePicture}' alt='profile picture'>
							<span id='${userData._id}_status' class='userStatusBadge'></span>
            </div>
            <div class='userDetailsContainer'>
              <div class='header'>
                <a href='/profile/${userData.username}'>${name}</a>
                <span class='username'>@${userData.username}</span>
              </div>
            </div>
            <div class='userDetailsSpacer'></div>
            ${followButton}
          </div>`;
};

const outputUsers = (results, container, showFollowButton = true) => {
	container.html('');
	results.forEach((result) => {
		const html = createUserHtml(result, showFollowButton);
		container.append(html);
	});
	if (results.length === 0) {
		container.append(`<span class='noResults'>No results found</span>`);
	}
};

const getOtherChatUsers = (users) => {
	if (users.length === 1) {
		return users;
	}
	return users.filter((user) => user._id !== userLoggedIn);
};

const getChatName = (chatData) => {
	let { chatName } = chatData;

	if (!chatName) {
		const otherChatUsers = getOtherChatUsers(chatData.users);
		const namesArray = otherChatUsers.map((user) => `${user.firstName} ${user.lastName}`);
		chatName = namesArray.join(', ');
	}

	return chatName;
};

const getUserChatImageElement = (user) => {
	if (!user || !user.profilePicture) {
		// eslint-disable-next-line no-alert
		return alert('User passed into function is invalid');
	}
	return `<img src="${s3Url}/${user.profilePicture}" alt='User profile picture'/>`;
};

const getChatImageElements = (chatData) => {
	const otherChatUsers = getOtherChatUsers(chatData.users);
	let groupChatClass = '';

	let chatImage = getUserChatImageElement(otherChatUsers[0]);

	if (otherChatUsers.length > 1) {
		groupChatClass = 'groupChatImage';
		chatImage += getUserChatImageElement(otherChatUsers[1]);
	}

	return `<div class='resultsImageContainer ${groupChatClass}'>${chatImage}</div>`;
};

const getLatestMessage = (latestMessage) => {
	if (latestMessage != null) {
		const { sender } = latestMessage;
		return `${sender.firstName} ${sender.lastName}: ${latestMessage.content}`;
	}
	return 'New chat';
};

const createChatHtml = (chatData) => {
	const chatName = getChatName(chatData);
	const image = getChatImageElements(chatData);
	const latestMessage = getLatestMessage(chatData.latestMessage);
	const activeClass = !chatData.latestMessage || chatData.latestMessage.readBy.includes(userLoggedIn) ? '' : 'active';

	return `<a href="/messages/${chatData._id}" class='resultsListItem ${activeClass}'>
            ${image}
            <div class='resultsDetailsContainer ellipsis'>
              <span class='heading ellipsis'>${chatName}</span>
              <span class='subText ellipsis'>${latestMessage}</span>
            </div>
          </a>`;
};

const showMessagePopup = (data) => {
	if (!data.chat.latestMessage._id) {
		data.chat.latestMessage = data;
	}

	const html = createChatHtml(data.chat);
	const element = $(html);
	element.hide().prependTo('#notificationsList').slideDown('fast');

	setTimeout(() => {
		element.fadeOut(400);
	}, 5000);
};

const refreshMessagesBadge = () => {
	$.get(chatRoutesUrl, { unreadOnly: true }, (data) => {
		let inboxResults = 0;
		let groupResults = 0;

		if (data) {
			data.forEach((notification) => {
				if (notification.isGroupChat) {
					groupResults += 1;
				} else {
					inboxResults += 1;
				}
			});
		}

		if (inboxResults > 0) {
			$('#messagesBadge').text(inboxResults).addClass('active');
			$('#messagesLink').addClass('active');
		} else {
			$('#messagesBadge').text('').removeClass('active');
			$('#messagesLink').removeClass('active');
		}

		if (groupResults > 0) {
			$('#groupsBadge').text(groupResults).addClass('active');
			$('#groupsLink').addClass('active');
		} else {
			$('#groupsBadge').text('').removeClass('active');
			$('#groupsLink').removeClass('active');
		}
	});
};

const markNotificationAsOpened = (notificationId = null, callback = null) => {
	if (callback == null) {
		callback = () => {
			// eslint-disable-next-line no-restricted-globals
			location.reload();
		};
	}

	const url =
		notificationId != null ? `${notificationRoutesUrl}/${notificationId}/opened` : `${notificationRoutesUrl}/opened`;

	$.ajax({ url: url, type: 'PUT', success: () => callback() });
};

const refreshNotificationsBadge = () => {
	$.get(notificationRoutesUrl, { unreadOnly: true }, (data) => {
		const numberOfResults = data.length;
		if (numberOfResults > 0) {
			$('#notificationsBadge').text(numberOfResults).addClass('active');
			$('#notificationsLink').addClass('active');
		} else {
			$('#notificationsBadge').text('').removeClass('active');
			$('#notificationsLink').removeClass('active');
		}
	});
};

const getNotificationText = (notification) => {
	const { userFrom } = notification;
	if (!userFrom.firstName || !userFrom.lastName) {
		// eslint-disable-next-line no-alert
		return alert('userFrom data not populated');
	}
	const userFromName = `${userFrom.firstName} ${userFrom.lastName}`;

	let text;

	if (notification.notificationType === 'share') {
		text = `${userFromName} shared one of your posts`;
	} else if (notification.notificationType === 'postLike') {
		text = `${userFromName} liked one of your posts`;
	} else if (notification.notificationType === 'reply') {
		text = `${userFromName} replied to one of your posts`;
	} else if (notification.notificationType === 'follow') {
		text = `${userFromName} followed you`;
	}

	return `<span class='ellipsis'>${text}</span>`;
};

const getNotificationUrl = (notification) => {
	let url = '#';

	if (
		notification.notificationType === 'share' ||
		notification.notificationType === 'postLike' ||
		notification.notificationType === 'reply'
	) {
		url = `/post/${notification.entityId}`;
	} else if (notification.notificationType === 'follow') {
		url = `/profile/${notification.entityId}`;
	}

	return url;
};

const createNotificationHtml = (notification) => {
	const { userFrom } = notification;
	const notificationMessage = getNotificationText(notification);
	const url = getNotificationUrl(notification);
	const className = notification.opened ? '' : 'active';

	return `<a href='${url}' class='resultsListItem notification ${className}' data-id='${notification._id}'>
            <div class='resultsImageContainer'>
              <img src='${s3Url}/${userFrom.profilePicture}' alt='User profile picture' />
            </div>
            <div class='resultsDetailsContainer ellipsis'>
              <span class='ellipsis'>${notificationMessage}</span>
            </div>
          </a>`;
};

const showNotificationPopup = (data) => {
	const html = createNotificationHtml(data);
	const element = $(html);
	element.hide().prependTo('#notificationsList').slideDown('fast');

	setTimeout(() => {
		element.fadeOut(400);
	}, 5000);
};

const outputNotificationList = (notifications, container) => {
	notifications.forEach((notification) => {
		const html = createNotificationHtml(notification);
		container.append(html);
	});

	if (notifications.length === 0) {
		container.append(`<span class='noResults'>Nothing to show.</span>`);
	}
};

const markAllMessagesAsRead = (chatId) => {
	$.ajax({
		url: `${chatRoutesUrl}/${chatId}/messages/markasread`,
		type: 'PUT',
		success: () => {
			refreshMessagesBadge();
		},
	});
};

const loadChatName = (chatId) => {
	$.get(`${chatRoutesUrl}/${chatId}`, (data) => {
		$('#chatName').text(getChatName(data));
	});
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

const messageReceived = (newMessage) => {
	if ($(`[data-room='${newMessage.chat._id}']`).length === 0) {
		showMessagePopup(newMessage);
		refreshMessagesBadge();
	} else {
		markAllMessagesAsRead(newMessage.chat._id);
		addChatMessageHtml(newMessage);
	}
};

export {
	timeDifference,
	getPostIdFromElement,
	createPostHtml,
	outputPosts,
	outputPostsWithReplies,
	createUserHtml,
	outputUsers,
	getOtherChatUsers,
	getChatName,
	showMessagePopup,
	refreshMessagesBadge,
	messageReceived,
	markNotificationAsOpened,
	refreshNotificationsBadge,
	getNotificationText,
	getNotificationUrl,
	createNotificationHtml,
	showNotificationPopup,
	outputNotificationList,
	getChatImageElements,
	getLatestMessage,
	createChatHtml,
	getUserChatImageElement,
	markAllMessagesAsRead,
	loadChatName,
	addChatMessageHtml,
};
