// IMPORTS AND DEPENDENCIES
// eslint-disable-next-line import/no-extraneous-dependencies
import { io } from 'socket.io-client';
import * as commonFunctions from './commonFunctions.mjs';
import * as homeHandler from './homeHandler.mjs';
import * as chatHandler from './chatHandler.mjs';
import { notificationRoutesUrl, userRoutesUrl } from './apiRoutes.mjs';
import * as followersAndFollowingHandler from './followersAndFollowingHandler.mjs';
import * as inboxHandler from './inboxHandler.mjs';
import * as notificationsHandler from './notificationsHandler.mjs';
import * as postHandler from './postHandler.mjs';
import * as searchHandler from './searchHandler.mjs';
// eslint-disable-next-line import/no-cycle
import * as commonHandler from './commonHandler.mjs';

// GLOBAL VARIABLES
// const page = $('body').data('page');
let connected = false;
let cropper;
let onlineUsers = [];
const selectedUsers = [];
const { page } = $('[data-page]')[0].dataset;
const userLoggedIn = $('body').data('uid');
const socket = io('http://localhost:3000');

// DOM ELEMENTS

// GLOBAL
socket.emit('setup', userLoggedIn);

socket.on('connected', () => {
	connected = true;
});

socket.on('message received', (newMessage) => {
	commonFunctions.messageReceived(newMessage);
});

socket.on('notification received', () => {
	$.get(`${notificationRoutesUrl}/latest`, (notificationData) => {
		commonFunctions.showNotificationPopup(notificationData);
		commonFunctions.refreshNotificationsBadge();
	});
});

socket.on('update online users', (users) => {
	onlineUsers = users;

	// TODO: make this a little more elegant without a timer
	setTimeout(() => {
		$('.userStatusBadge').each(function () {
			const elementId = this.id.split('_')[0];
			if (onlineUsers.some((user) => user.userId === elementId)) {
				this.classList.add('active');
			} else {
				this.classList.remove('active');
			}
		});
	}, 1000);
});

const emitNotification = (userId) => {
	if (userId === userLoggedIn) {
		return;
	}
	socket.emit('notification received', userId);
};

const handleFocus = async () => {
	socket.emit('setup', userLoggedIn);
};

const handleBlur = () => {
	setTimeout(() => {
		if (userLoggedIn) {
			socket.emit('offline');
		}
	}, 60000);
};

$(window).on('focus', handleFocus);
$(window).on('blur', handleBlur);

$(document).ready(() => {
	followersAndFollowingHandler.listContacts(userLoggedIn);
	commonFunctions.refreshMessagesBadge();
	commonFunctions.refreshNotificationsBadge();
});

$('#postTextarea, #replyTextarea').keyup((event) => {
	const textbox = $(event.target);
	const value = textbox.val().trim();

	const isModal = textbox.parents('.modal').length === 1;

	const submitButton = isModal ? $('#submitReplyButton') : $('#submitPostButton');

	if (submitButton.length === 0) {
		// eslint-disable-next-line no-alert
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

	const postData = {
		content: textbox.val().trim(),
	};

	if (isModal) {
		const { id } = button.data();
		if (id == null) {
			// eslint-disable-next-line no-alert
			return alert('Button ID is null');
		}
		postData.replyTo = id;
	}

	commonHandler.submitPostOrReply(postData, textbox, button);
});

$('#createChatButton').click(() => {
	const data = JSON.stringify(selectedUsers);
	commonHandler.createChat(data);
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
			// eslint-disable-next-line no-undef
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
			// eslint-disable-next-line no-undef
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
		// eslint-disable-next-line no-alert
		alert('Could not upload image. Make sure it is an image file.');
		return;
	}

	canvas.toBlob((blob) => {
		const formData = new FormData();
		formData.append('croppedImage', blob);
		formData.append('imageType', 'profilePicture');

		commonHandler.uploadImage(formData, 'profilePicture');
	});
});

$('#coverPhotoUploadButton').on('click', () => {
	const canvas = cropper.getCroppedCanvas();

	if (canvas == null) {
		// eslint-disable-next-line no-alert
		alert('Could not upload image. Make sure it is an image file.');
		return;
	}

	canvas.toBlob((blob) => {
		const formData = new FormData();
		formData.append('croppedImage', blob);
		formData.append('imageType', 'coverPhoto');

		commonHandler.uploadImage(formData, 'coverPhoto');
	});
});

$('#userSearchTextbox').keydown((event) => {
	let timer;
	clearTimeout(timer);
	const textbox = $(event.target);
	let value = textbox.val();

	const updateSelectedUsersHtml = () => {
		const elements = [];
		selectedUsers.forEach((user) => {
			const name = `${user.firstName} ${user.lastName}`;
			const userElement = $(`<span class='selectedUser'>${name}</span>`);
			elements.push(userElement);
		});
		$('.selectedUser').remove();
		$('#selectedUsers').prepend(elements);
	};

	const userSelected = (user) => {
		selectedUsers.push(user);
		updateSelectedUsersHtml();
		$('#userSearchTextbox').val('').focus();
		$('.resultsContainer').html('');
		$('#createChatButton').prop('disabled', false);
	};

	const outputSelectableUsers = (results, container) => {
		container.html('');

		results.forEach((result) => {
			if (result._id === userLoggedIn || selectedUsers.some((u) => u._id === result._id)) {
				return;
			}
			const html = commonFunctions.createUserHtml(result, false);
			const element = $(html);

			element.click(() => {
				userSelected(result);
			});

			container.append(element);
		});

		if (results.length === 0) {
			container.append('<span class="noResults">No results found</span>');
		}
	};

	const searchUsers = (searchTerm) => {
		$.get(userRoutesUrl, { search: searchTerm }, (results) => {
			outputSelectableUsers(results, $('.resultsContainer'));
		});
	};

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
	const postId = commonFunctions.getPostIdFromElement(button);

	if (postId === undefined) {
		return;
	}

	commonHandler.likePost(postId, button, userLoggedIn);
});

$(document).on('click', '.shareButton', (event) => {
	const button = $(event.target);
	const postId = commonFunctions.getPostIdFromElement(button);

	if (postId === undefined) {
		return;
	}

	commonHandler.sharePost(postId, button, userLoggedIn);
});

$(document).on('click', '.post', (event) => {
	const element = $(event.target);
	const postId = commonFunctions.getPostIdFromElement(element);

	if (postId !== undefined && !element.is('button')) {
		window.location.href = `/post/${postId}`;
	}
});

$('#replyModalCenter').on('show.bs.modal', (event) => {
	const button = $(event.relatedTarget);
	const postId = commonFunctions.getPostIdFromElement(button);
	$('#submitReplyButton').data('id', postId);

	commonHandler.populateReplyModal(postId);
});

$('#replyModalCenter').on('hidden.bs.modal', () => {
	$('#originalPostContainer').html('');
});

$('#deletePostModalCenter').on('show.bs.modal', (event) => {
	const button = $(event.relatedTarget);
	const postId = commonFunctions.getPostIdFromElement(button);
	$('#deletePostButton').data('id', postId);
});

$('#confirmPinModalCenter').on('show.bs.modal', (event) => {
	const button = $(event.relatedTarget);
	const postId = commonFunctions.getPostIdFromElement(button);
	$('#pinPostButton').data('id', postId);
});

$('#unpinPostModalCenter').on('show.bs.modal', (event) => {
	const button = $(event.relatedTarget);
	const postId = commonFunctions.getPostIdFromElement(button);
	$('#unpinPostButton').data('id', postId);
});

$('#deletePostButton').click((event) => {
	const postId = $(event.target).data('id');

	commonHandler.deletePost(postId);
});

$('#pinPostButton').click((event) => {
	const postId = $(event.target).data('id');

	commonHandler.togglePinnedPost(postId, true);
});

$('#unpinPostButton').click((event) => {
	const postId = $(event.target).data('id');

	commonHandler.togglePinnedPost(postId, false);
});

$(document).on('click', '.followButton', (event) => {
	const button = $(event.target);
	const userId = button.data().user;

	commonHandler.toggleFollowUser(userId, button);
});

$(document).on('click', '.notification.active', (e) => {
	e.preventDefault();
	const container = $(e.target);
	const notificationId = container.data().id;

	const href = container.attr('href');

	const callback = () => {
		window.location = href;
	};
	commonFunctions.markNotificationAsOpened(notificationId, callback);
});

$('#markAllAsRead').click(() => {
	commonFunctions.markNotificationAsOpened();
});

// HOME PAGE
if (page === 'home') {
	$(document).ready(() => {
		homeHandler.getFilteredPosts();
	});

	const updateTabs = () => {
		$('#filteredPostsTab').toggleClass('active');
		$('#allPostsTab').toggleClass('active');
	};

	$('#filteredPostsTab').click((e) => {
		e.preventDefault();
		updateTabs();
		homeHandler.getFilteredPosts(true);
	});
	$('#allPostsTab').click((e) => {
		e.preventDefault();
		updateTabs();
		homeHandler.getFilteredPosts(false);
	});
}

// CHAT PAGE
if (page === 'chat') {
	// VARIABLES
	const { cid } = $('[data-cid]')[0].dataset;
	let typing = false;
	let lastTypingTime;

	// PAGE FUNCTIONS

	const messageSubmitted = () => {
		const content = $('.inputTextbox').val().trim();

		if (content !== '') {
			chatHandler.sendMessage(content, cid, connected, socket);

			$('.inputTextbox').val('');
			socket.emit('stop typing', cid);
			typing = false;
		}
	};

	const updateTyping = () => {
		if (!connected) {
			return;
		}

		if (!typing) {
			typing = true;
			socket.emit('typing', cid);
		}

		lastTypingTime = new Date().getTime();
		const timerLength = 3000;

		setTimeout(() => {
			const timeNow = new Date().getTime();
			const timeDiff = timeNow - lastTypingTime;
			if (timeDiff >= timerLength && typing) {
				socket.emit('stop typing', cid);
				typing = false;
			}
		}, timerLength);
	};

	// EVENT HANDLERS
	$(document).ready(() => {
		$('.pageContentContainer').css({ display: 'flex', height: '100%' });
		socket.emit('join room', cid);
		socket.on('typing', () => {
			$('.typingDots').show();
		});
		socket.on('stop typing', () => {
			$('.typingDots').hide();
		});

		commonFunctions.loadChatName(cid);
		chatHandler.loadChatMessages(cid);
		commonFunctions.markAllMessagesAsRead(cid);
	});

	$('#chatNameButton').click(() => {
		const name = $('#chatNameTextbox').val().trim();
		chatHandler.updateChatName(cid, name);
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
}

// FOLLOWERS AND FOLLOWING
if (page === 'followersAndFollowing') {
	$(document).ready(() => {
		const { pid } = $('[data-pid]')[0].dataset;
		const { tab } = $('[data-tab]')[0].dataset;
		followersAndFollowingHandler.listUsers(pid, tab);
	});
}

// INBOX
if (page === 'inbox') {
	const { mode } = $('[data-mode]')[0].dataset;
	inboxHandler.listChats(mode);
}

// NOTIFICATIONS
if (page === 'notifications') {
	$(document).ready(() => {
		notificationsHandler.listNotifications();
	});
}

// POST
if (page === 'post') {
	$('document').ready(() => {
		const { post } = $('[data-post]')[0].dataset;
		postHandler.getPost(post);
		// commonFunctions.outputPostsWithReplies(data, $('.postsContainer'));
	});
}

// PROFILE
if (page === 'profile') {
	const { pid } = $('[data-pid]')[0].dataset;
	let tab = 'posts';
	if ($('[data-tab]') && $('[data-tab]').length !== 0) {
		// eslint-disable-next-line prefer-destructuring
		tab = $('[data-tab]')[0].dataset.tab;
	}
	// const tab = $('[data-tab]') ? $('[data-tab]')[0].dataset.tab : 'posts';
	// const { tab } = $('[data-tab]')[0].dataset;

	const outputPinnedPost = (results, container) => {
		if (results.length === 0) {
			container.hide();
			return;
		}

		container.html('');

		results.forEach((result) => {
			const html = commonFunctions.createPostHtml(result);
			container.append(html);
		});
	};

	const loadContent = (isReply) => {
		const url = '/api/v1/posts';

		if (isReply === false) {
			$.get(url, { postedBy: pid, pinned: true }, (results) => {
				outputPinnedPost(results, $('.pinnedPostContainer'));
			});
		}

		$.get(url, { postedBy: pid, isReply: isReply }, (results) => {
			commonFunctions.outputPosts(results, $('.postsContainer'));
		});
	};

	$(document).ready(() => {
		const isReply = tab === 'replies';
		loadContent(isReply);
	});
}

// SEARCH
if (page === 'search') {
	let timer;

	const search = (searchTerm, searchType) => {
		const url = searchType === 'users' ? '/api/v1/users' : '/api/v1/posts';

		searchHandler.search(url, searchTerm, searchType);
	};

	$('#searchBox').keyup((event) => {
		clearTimeout(timer);
		const textbox = $(event.target);
		let value = textbox.val();
		const searchType = textbox.data().search;

		timer = setTimeout(() => {
			value = textbox.val().trim();
			if (value === '') {
				$('.resultsContainer').html('');
			} else {
				search(value, searchType);
			}
		}, 1000);
	});
}

// eslint-disable-next-line import/prefer-default-export
export { emitNotification };
