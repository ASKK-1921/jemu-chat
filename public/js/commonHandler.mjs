import { chatRoutesUrl, postRoutesUrl, userRoutesUrl } from './apiRoutes.mjs';
import { createPostHtml, outputPosts } from './commonFunctions.mjs';
// eslint-disable-next-line import/no-cycle
import { emitNotification } from './index.mjs';

const submitPostOrReply = (postData, textbox, button) => {
	$.post(postRoutesUrl, postData, (data) => {
		if (data.replyTo) {
			emitNotification(data.replyTo.postedBy);
			// eslint-disable-next-line no-restricted-globals
			location.reload();
		} else {
			const html = createPostHtml(data);
			$('.postsContainer').prepend(html);
			textbox.val('');
			button.prop('disabled', true);
		}
	});
};

const createChat = (data) => {
	$.post(chatRoutesUrl, { users: data }, (chat) => {
		if (!chat || !chat._id) {
			// eslint-disable-next-line no-alert
			return alert('Invalid server response');
		}
		window.location.href = `/messages/${chat._id}`;
	});
};

const uploadImage = (formData, imageType) => {
	$.ajax({
		url: `${userRoutesUrl}/${imageType}`,
		type: 'POST',
		data: formData,
		processData: false,
		contentType: false,
		success: () => {
			// eslint-disable-next-line no-restricted-globals
			location.reload();
		},
	});
};

const likePost = (postId, button, userLoggedIn) => {
	$.ajax({
		url: `${postRoutesUrl}/${postId}/like`,
		type: 'PUT',
		success: (data) => {
			button.next('.likeButtonCount').text(data.likes.length || '');
			if (data.likes.includes(userLoggedIn)) {
				button.addClass('active');
				emitNotification(data.postedBy);
			} else {
				button.removeClass('active');
			}
		},
	});
};

const sharePost = (postId, button, userLoggedIn) => {
	$.ajax({
		url: `${postRoutesUrl}/${postId}/share`,
		type: 'POST',
		success: (data) => {
			button.find('span').text(data.shareUsers.length || '');
			if (data.shareUsers.includes(userLoggedIn)) {
				button.addClass('active');
				emitNotification(data.postedBy);
			} else {
				button.removeClass('active');
			}
		},
	});
};

const populateReplyModal = (postId) => {
	$.get(`${postRoutesUrl}/${postId}`, (data) => {
		outputPosts(data.postData, $('#originalPostContainer'));
	});
};

const deletePost = (postId) => {
	$.ajax({
		url: `${postRoutesUrl}/${postId}`,
		type: 'DELETE',
		success: (data, status, xhr) => {
			if (xhr.status !== 202) {
				// eslint-disable-next-line no-alert
				alert('Could not delete post');
				return;
			}
			// eslint-disable-next-line no-restricted-globals
			location.reload();
		},
	});
};

const togglePinnedPost = (postId, pin) => {
	$.ajax({
		url: `${postRoutesUrl}/${postId}`,
		type: 'PUT',
		data: { pinned: pin },
		success: (data, status, xhr) => {
			if (xhr.status !== 204) {
				// eslint-disable-next-line no-alert
				alert('Could not pin post');
				return;
			}
			// eslint-disable-next-line no-restricted-globals
			location.reload();
		},
	});
};

const toggleFollowUser = (userId, button) => {
	let difference = 1;
	$.ajax({
		url: `${userRoutesUrl}/${userId}/follow`,
		type: 'PUT',
		success: (data, status, xhr) => {
			if (xhr.status === 404) {
				// TODO: handle error
				// ADD A BOOTSTRAP MODAL FOR THIS LATER
			}

			if (data.following && data.following.includes(userId)) {
				button.addClass('following');
				button.text('Following');
				emitNotification(userId);
			} else {
				button.removeClass('following');
				button.text('Follow');
				difference = -1;
			}
		},
	});

	const followersLabel = $('#followersValue');
	if (followersLabel.length !== 0) {
		let followersText = followersLabel.text();
		followersText = parseInt(followersText, 10);
		followersLabel.text(followersText + difference);
	}
};

// eslint-disable-next-line import/prefer-default-export
export {
	submitPostOrReply,
	createChat,
	uploadImage,
	likePost,
	sharePost,
	populateReplyModal,
	deletePost,
	togglePinnedPost,
	toggleFollowUser,
};
