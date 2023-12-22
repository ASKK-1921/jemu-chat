// Globals
let cropper;
let timer;
const selectedUsers = [];

$(document).ready(() => {
	refreshMessagesBadge();
	refreshNotificationsBadge();
});

$('#postTextarea, #replyTextarea').keyup((event) => {
	const textbox = $(event.target);
	const value = textbox.val().trim();

	const isModal = textbox.parents('.modal').length === 1;

	const submitButton = isModal ? $('#submitReplyButton') : $('#submitPostButton');

	if (submitButton.length === 0) {
		return alert('No submit button found!');
	}

	if (value === '') {
		submitButton.prop('disabled', true);
		return;
	}

	submitButton.prop('disabled', false);
});

$('#submitPostButton, #submitReplyButton').click((event) => {
	const button = $(event.target);

	const isModal = button.parents('.modal').length === 1;

	const textbox = isModal ? $('#replyTextarea') : $('#postTextarea');

	const url = '/api/posts';

	const data = {
		content: textbox.val().trim(),
	};

	if (isModal) {
		const { id } = button.data();
		if (id == null) {
			return alert('Button ID is null');
		}
		data.replyTo = id;
	}

	$.post(url, data, (postData) => {
		if (postData.replyTo) {
			emitNotification(postData.replyTo.postedBy);
			location.reload();
		} else {
			const html = createPostHtml(postData);
			$('.postsContainer').prepend(html);
			textbox.val('');
			button.prop('disabled', true);
		}
	});
});

$('#createChatButton').click(() => {
	const data = JSON.stringify(selectedUsers);
	const url = '/api/chats';
	$.post(url, { users: data }, (chat) => {
		if (!chat || !chat._id) {
			return alert('Invalid server response');
		}
		window.location.href = `/messages/${chat._id}`;
	});
});

$('#filePhoto').change((event) => {
	const input = $(event.target)[0];
	if (input.files && input.files[0]) {
		const reader = new FileReader();
		reader.onload = (e) => {
			const image = document.getElementById('imagePreview');
			image.src = e.target.result;
			if (cropper !== undefined) {
				cropper.destroy();
			}
			cropper = new Cropper(image, {
				aspectRatio: 1 / 1,
				background: false,
			});
		};
		reader.readAsDataURL(input.files[0]);
	}
});

$('#coverPhoto').change((event) => {
	const input = $(event.target)[0];
	if (input.files && input.files[0]) {
		const reader = new FileReader();
		reader.onload = (e) => {
			const image = document.getElementById('coverPhotoPreview');
			image.src = e.target.result;
			if (cropper !== undefined) {
				cropper.destroy();
			}
			cropper = new Cropper(image, {
				aspectRatio: 16 / 9,
				background: false,
			});
		};
		reader.readAsDataURL(input.files[0]);
	}
});

$('#imageUploadButton').on('click', () => {
	const canvas = cropper.getCroppedCanvas();

	if (canvas == null) {
		alert('Could not upload image. Make sure it is an image file.');
		return;
	}

	canvas.toBlob((blob) => {
		const formData = new FormData();
		formData.append('croppedImage', blob);

		$.ajax({
			url: '/api/users/profilePicture',
			type: 'POST',
			data: formData,
			processData: false,
			contentType: false,
			success: () => {
				location.reload();
			},
		});
	});
});

$('#coverPhotoUploadButton').on('click', () => {
	const canvas = cropper.getCroppedCanvas();

	if (canvas == null) {
		alert('Could not upload image. Make sure it is an image file.');
		return;
	}

	canvas.toBlob((blob) => {
		const formData = new FormData();
		formData.append('croppedImage', blob);

		$.ajax({
			url: '/api/users/coverPhoto',
			type: 'POST',
			data: formData,
			processData: false,
			contentType: false,
			success: () => {
				location.reload();
			},
		});
	});
});

$('#userSearchTextbox').keydown((event) => {
	clearTimeout(timer);
	const textbox = $(event.target);
	let value = textbox.val();

	if (value === '' && (event.which === 8 || event.keyCode === 8)) {
		// Remove user from selection
		selectedUsers.pop();
		updateSelectedUsersHtml();
		$('.resultsContainer').html('');
		if (selectedUsers.length === 0) {
			$('#createChatButton').prop('disabled', true);
		}
		return;
	}

	timer = setTimeout(() => {
		value = textbox.val().trim();
		if (value === '') {
			$('.resultsContainer').html('');
		} else {
			searchUsers(value);
		}
	}, 1000);
});

$(document).on('click', '.likeButton', (event) => {
	const button = $(event.target);
	const postId = getPostIdFromElement(button);

	if (postId === undefined) {
		return;
	}

	$.ajax({
		url: `/api/posts/${postId}/like`,
		type: 'PUT',
		success: (postData) => {
			button.find('span').text(postData.likes.length || '');
			if (postData.likes.includes(userLoggedIn._id)) {
				button.addClass('active');
				emitNotification(postData.postedBy);
			} else {
				button.removeClass('active');
			}
		},
	});
});

$(document).on('click', '.retweetButton', (event) => {
	const button = $(event.target);
	const postId = getPostIdFromElement(button);

	if (postId === undefined) {
		return;
	}

	$.ajax({
		url: `/api/posts/${postId}/retweet`,
		type: 'POST',
		success: (postData) => {
			button.find('span').text(postData.retweetUsers.length || '');
			if (postData.retweetUsers.includes(userLoggedIn._id)) {
				button.addClass('active');
				emitNotification(postData.postedBy);
			} else {
				button.removeClass('active');
			}
		},
	});
});

$(document).on('click', '.post', (event) => {
	const element = $(event.target);
	const postId = getPostIdFromElement(element);

	if (postId !== undefined && !element.is('button')) {
		window.location.href = `/post/${postId}`;
	}
});

function getPostIdFromElement(element) {
	const isRoot = element.hasClass('post');
	const rootElement = isRoot === true ? element : element.closest('.post');
	const postId = rootElement.data().id;

	if (postId === undefined) {
		return alert('Post ID undefined');
	}
	return postId;
}

function createPostHtml(postData, largeFont = false) {
	if (postData == null) {
		return alert('Post object is null');
	}

	const isRetweet = postData.retweetData !== undefined;
	const retweetedBy = isRetweet ? postData.postedBy.username : null;
	postData = isRetweet ? postData.retweetData : postData;

	const { postedBy } = postData;
	const displayName = `${postedBy.firstName} ${postedBy.lastName}`;
	const timestamp = timeDifference(new Date(), new Date(postData.createdAt));
	const likeButtonActiveClass = postData.likes.includes(userLoggedIn._id) ? 'active' : '';
	const retweetButtonActiveClass = postData.retweetUsers.includes(userLoggedIn._id) ? 'active' : '';
	const largeFontClass = largeFont ? 'largeFont' : '';

	if (postedBy._id === undefined) {
		return console.log('User object not defined');
	}

	let retweetText = '';
	if (isRetweet) {
		retweetText = `<span><i class='fa-solid fa-repeat'></i> Retweeted by <a href='/profile/${retweetedBy}'>@${retweetedBy}</a></span>`;
	}

	let replyFlag = '';
	if (postData.replyTo && postData.replyTo._id) {
		if (!postData.replyTo._id) {
			return alert('Reply to is not populated');
		}
		if (!postData.replyTo.postedBy._id) {
			return alert('Posted by is not populated');
		}

		const replyToUsername = postData.replyTo.postedBy.username;
		replyFlag = `<div class='replyFlag'>
                  Replying to <a href='/profile/${replyToUsername}'>@${replyToUsername}</a>
                </div>`;
	}

	let buttons = '';
	let pinnedPostText = '';

	if (postData.postedBy._id === userLoggedIn._id) {
		let pinnedClass = '';
		let dataTarget = '#confirmPinModalCenter';
		if (postData.pinned === true) {
			pinnedClass = 'active';
			dataTarget = '#unpinPostModalCenter';
			pinnedPostText = `<i class='fa-solid fa-thumbtack'></i> <span>Pinned post</span>`;
		}
		buttons = `<button class='pinButton ${pinnedClass}' data-id='${postData._id}' data-bs-toggle='modal' data-bs-target='${dataTarget}'>
                          <i class='fa-solid fa-thumbtack'></i>
                        </button>
                        <button data-id='${postData._id}' data-bs-toggle='modal' data-bs-target='#deletePostModalCenter'>
                          <i class='fa-solid fa-trash'></i>
                        </button>`;
	}

	return `<div class='post ${largeFontClass}' data-id='${postData._id}'>
            <div class='postActionContainer'>
              ${retweetText}
            </div>
            <div class='mainContentContainer'>
              <div class='userImageContainer'>
                <img src='${postedBy.profilePicture}'/>
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
                      <i class='fa-regular fa-comments'></i>
                    </button>
                  </div>
                  <div class='postButtonContainer green'>
                    <button class='retweetButton ${retweetButtonActiveClass}'>
                    <i class='fa-solid fa-repeat'></i>
                    <span>${postData.retweetUsers.length || ''}</span>
                    </button>
                  </div>
                  <div class='postButtonContainer red'>
                    <button class='likeButton ${likeButtonActiveClass}'>
                      <i class='fa-regular fa-heart'></i>
                      <span>${postData.likes.length || ''}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>`;
}

$('#replyModalCenter').on('show.bs.modal', (event) => {
	const button = $(event.relatedTarget);
	const postId = getPostIdFromElement(button);
	$('#submitReplyButton').data('id', postId);

	const url = `/api/posts/${postId}`;

	$.get(url, (results) => {
		outputPosts(results.postData, $('#originalPostContainer'));
	});
});

$('#replyModalCenter').on('hidden.bs.modal', () => {
	$('#originalPostContainer').html('');
});

$('#deletePostModalCenter').on('show.bs.modal', (event) => {
	const button = $(event.relatedTarget);
	const postId = getPostIdFromElement(button);
	$('#deletePostButton').data('id', postId);
});

$('#confirmPinModalCenter').on('show.bs.modal', (event) => {
	const button = $(event.relatedTarget);
	const postId = getPostIdFromElement(button);
	$('#pinPostButton').data('id', postId);
});

$('#unpinPostModalCenter').on('show.bs.modal', (event) => {
	const button = $(event.relatedTarget);
	const postId = getPostIdFromElement(button);
	$('#unpinPostButton').data('id', postId);
});

$('#deletePostButton').click((event) => {
	const postId = $(event.target).data('id');

	$.ajax({
		url: `/api/posts/${postId}`,
		type: 'DELETE',
		success: (data, status, xhr) => {
			if (xhr.status !== 202) {
				alert('Could not delete post');
				return;
			}
			location.reload();
		},
	});
});

$('#pinPostButton').click((event) => {
	const postId = $(event.target).data('id');

	$.ajax({
		url: `/api/posts/${postId}`,
		type: 'PUT',
		data: { pinned: true },
		success: (data, status, xhr) => {
			if (xhr.status !== 204) {
				alert('Could not pin post');
				return;
			}
			location.reload();
		},
	});
});

$('#unpinPostButton').click((event) => {
	const postId = $(event.target).data('id');

	$.ajax({
		url: `/api/posts/${postId}`,
		type: 'PUT',
		data: { pinned: false },
		success: (data, status, xhr) => {
			if (xhr.status !== 204) {
				alert('Could not unpin post');
				return;
			}
			location.reload();
		},
	});
});

$(document).on('click', '.followButton', (event) => {
	const button = $(event.target);
	const userId = button.data().user;

	$.ajax({
		url: `/api/users/${userId}/follow`,
		type: 'PUT',
		success: (data, status, xhr) => {
			if (xhr.status === 404) {
				// TODO: handle error
				// ADD A BOOTSTRAP MODAL FOR THIS LATER
			}

			let difference = 1;
			if (data.following && data.following.includes(userId)) {
				button.addClass('following');
				button.text('Following');
				emitNotification(userId);
			} else {
				button.removeClass('following');
				button.text('Follow');
				difference = -1;
			}

			const followersLabel = $('#followersValue');
			if (followersLabel.length !== 0) {
				let followersText = followersLabel.text();
				followersText = parseInt(followersText);
				followersLabel.text(followersText + difference);
			}
		},
	});
});

$(document).on('click', '.notification.active', (e) => {
	e.preventDefault();
	const container = $(e.target);
	const notificationId = container.data().id;

	const href = container.attr('href');

	const callback = () => {
		window.location = href;
	};

	markNotificationAsOpened(notificationId, callback);
});

function outputPosts(results, container) {
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
}

function outputPostsWithReplies(results, container) {
	container.html('');
	if (results.replyTo != undefined && results.replyTo._id != undefined) {
		const html = createPostHtml(results.replyTo);
		container.append(html);
	}

	const mainPostHtml = createPostHtml(results.postData, true);
	container.append(mainPostHtml);

	results.replies.forEach((result) => {
		const html = createPostHtml(result);
		container.append(html);
	});
}

function outputUsers(results, container) {
	container.html('');
	results.forEach((result) => {
		const html = createUserHtml(result, true);
		container.append(html);
	});
	if (results.length === 0) {
		container.append(`<span class='noResults'>No results found</span>`);
	}
}

function createUserHtml(userData, showFollowButton) {
	const name = `${userData.firstName} ${userData.lastName}`;

	const isFollowing = userLoggedIn.following && userLoggedIn.following.includes(userData._id);

	const text = isFollowing ? 'Following' : 'Follow';
	const buttonClass = isFollowing ? 'followButton following' : 'followButton';

	let followButton = '';

	if (showFollowButton && userLoggedIn._id !== userData._id) {
		followButton = `<div class='followButtonContainer'>
                      <button class='${buttonClass}' data-user='${userData._id}'>${text}</button>
                    </div>`;
	}

	return `<div class='user'>
            <div class='userImageContainer'>
              <img src='${userData.profilePicture}' alt='profile picture'>
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
}

function searchUsers(searchTerm) {
	$.get('/api/users', { search: searchTerm }, (results) => {
		outputSelectableUsers(results, $('.resultsContainer'));
	});
}

function outputSelectableUsers(results, container) {
	container.html('');

	results.forEach((result) => {
		if (result._id === userLoggedIn._id || selectedUsers.some((u) => u._id === result._id)) {
			return;
		}
		const html = createUserHtml(result, false);
		const element = $(html);

		element.click(() => {
			userSelected(result);
		});

		container.append(element);
	});

	if (results.length === 0) {
		container.append('<span class="noResults">No results found</span>');
	}
}

function userSelected(user) {
	selectedUsers.push(user);
	updateSelectedUsersHtml();
	$('#userSearchTextbox').val('').focus();
	$('.resultsContainer').html('');
	$('#createChatButton').prop('disabled', false);
}

function updateSelectedUsersHtml() {
	const elements = [];
	selectedUsers.forEach((user) => {
		const name = `${user.firstName} ${user.lastName}`;
		const userElement = $(`<span class='selectedUser'>${name}</span>`);
		elements.push(userElement);
	});
	$('.selectedUser').remove();
	$('#selectedUsers').prepend(elements);
}

function getChatName(chatData) {
	let { chatName } = chatData;

	if (!chatName) {
		const otherChatUsers = getOtherChatUsers(chatData.users);
		const namesArray = otherChatUsers.map((user) => `${user.firstName} ${user.lastName}`);
		chatName = namesArray.join(', ');
	}

	return chatName;
}

function getOtherChatUsers(users) {
	if (users.length === 1) {
		return users;
	}
	return users.filter((user) => user._id !== userLoggedIn._id);
}

function messageReceived(newMessage) {
	if ($(`[data-room='${newMessage.chat._id}]`).length === 0) {
		showMessagePopup(newMessage);
	} else {
		addChatMessageHtml(newMessage);
	}
	refreshMessagesBadge();
}

function timeDifference(current, previous) {
	const msPerMinute = 60 * 1000;
	const msPerHour = msPerMinute * 60;
	const msPerDay = msPerHour * 24;
	const msPerMonth = msPerDay * 30;
	const msPerYear = msPerDay * 365;

	const elapsed = current - previous;

	if (elapsed < msPerMinute) {
		return 'Just now';
	}
	if (elapsed < msPerHour) {
		return `${Math.round(elapsed / msPerMinute)} minutes ago`;
	}
	if (elapsed < msPerDay) {
		return `${Math.round(elapsed / msPerHour)} hours ago`;
	}
	if (elapsed < msPerMonth) {
		return `${Math.round(elapsed / msPerDay)} days ago`;
	}
	if (elapsed < msPerYear) {
		return `${Math.round(elapsed / msPerMonth)} months ago`;
	}
	return `${Math.round(elapsed / msPerYear)} years ago`;
}

function markNotificationAsOpened(notificationId = null, callback = null) {
	if (callback == null) {
		callback = () => {
			location.reload();
		};
	}

	const url = notificationId != null ? `/api/notifications/${notificationId}/opened` : `/api/notifications/opened`;

	$.ajax({ url: url, type: 'PUT', success: () => callback() });
}

function refreshMessagesBadge() {
	$.get(`/api/chats`, { unreadOnly: true }, (data) => {
		const numberOfResults = data.length;
		if (numberOfResults > 0) {
			$('#messagesBadge').text(numberOfResults).addClass('active');
		} else {
			$('#messagesBadge').text('').removeClass('active');
		}
	});
}

function refreshNotificationsBadge() {
	$.get(`/api/notifications`, { unreadOnly: true }, (data) => {
		const numberOfResults = data.length;
		if (numberOfResults > 0) {
			$('#notificationsBadge').text(numberOfResults).addClass('active');
		} else {
			$('#notificationsBadge').text('').removeClass('active');
		}
	});
}

function showNotificationPopup(data) {
	const html = createNotificationHtml(data);
	const element = $(html);
	element.hide().prependTo('#notificationsList').slideDown('fast');

	setTimeout(() => {
		element.fadeOut(400);
	}, 5000);
}

function showMessagePopup(data) {
	if (!data.chat.latestMessage._id) {
		data.chat.latestMessage = data;
	}

	const html = createChatHtml(data.chat);
	const element = $(html);
	element.hide().prependTo('#notificationsList').slideDown('fast');

	setTimeout(() => {
		element.fadeOut(400);
	}, 5000);
}

function outputNotificationList(notifications, container) {
	notifications.forEach((notification) => {
		const html = createNotificationHtml(notification);
		container.append(html);
	});

	if (notifications.length === 0) {
		container.append(`<span class='noResults'>Nothing to show.</span>`);
	}
}

function createNotificationHtml(notification) {
	const { userFrom } = notification;
	const notificationMessage = getNotificationText(notification);
	const url = getNotificationUrl(notification);
	const className = notification.opened ? '' : 'active';

	return `<a href='${url}' class='resultsListItem notification ${className}' data-id='${notification._id}'>
            <div class='resultsImageContainer'>
              <img src='${userFrom.profilePicture}' alt='User profile picture' />
            </div>
            <div class='resultsDetailsContainer ellipsis'>
              <span class='ellipsis'>${notificationMessage}</span>
            </div>
          </a>`;
}

function getNotificationText(notification) {
	const { userFrom } = notification;
	if (!userFrom.firstName || !userFrom.lastName) {
		return alert('userFrom data not populated');
	}
	const userFromName = `${userFrom.firstName} ${userFrom.lastName}`;

	let text;

	if (notification.notificationType === 'retweet') {
		text = `${userFromName} retweeted one of your posts`;
	} else if (notification.notificationType === 'postLike') {
		text = `${userFromName} liked one of your posts`;
	} else if (notification.notificationType === 'reply') {
		text = `${userFromName} replied to one of your posts`;
	} else if (notification.notificationType === 'follow') {
		text = `${userFromName} followed you`;
	}

	return `<span class='ellipsis'>${text}</span>`;
}

function getNotificationUrl(notification) {
	let url = '#';

	if (
		notification.notificationType === 'retweet' ||
		notification.notificationType === 'postLike' ||
		notification.notificationType === 'reply'
	) {
		url = `/post/${notification.entityId}`;
	} else if (notification.notificationType === 'follow') {
		url = `/profile/${notification.entityId}`;
	}

	return url;
}

$('#markAllAsRead').click(() => {
	markNotificationAsOpened();
});

function createChatHtml(chatData) {
	const chatName = getChatName(chatData);
	const image = getChatImageElements(chatData);
	const latestMessage = getLatestMessage(chatData.latestMessage);
	const activeClass =
		!chatData.latestMessage || chatData.latestMessage.readBy.includes(userLoggedIn._id) ? '' : 'active';

	return `<a href="/messages/${chatData._id}" class='resultsListItem ${activeClass}'>
            ${image}
            <div class='resultsDetailsContainer ellipsis'>
              <span class='heading ellipsis'>${chatName}</span>
              <span class='subText ellipsis'>${latestMessage}</span>
            </div>
          </a>`;
}

function getLatestMessage(latestMessage) {
	if (latestMessage != null) {
		const { sender } = latestMessage;
		return `${sender.firstName} ${sender.lastName}: ${latestMessage.content}`;
	}
	return 'New chat';
}

function getChatImageElements(chatData) {
	const otherChatUsers = getOtherChatUsers(chatData.users);
	let groupChatClass = '';

	let chatImage = getUserChatImageElement(otherChatUsers[0]);

	if (otherChatUsers.length > 1) {
		groupChatClass = 'groupChatImage';
		chatImage += getUserChatImageElement(otherChatUsers[1]);
	}

	return `<div class='resultsImageContainer ${groupChatClass}'>${chatImage}</div>`;
}

function getUserChatImageElement(user) {
	if (!user || !user.profilePicture) {
		return alert('User passed into function is invalid');
	}
	return `<img src="${user.profilePicture}" alt='User profile picture'/>`;
}
