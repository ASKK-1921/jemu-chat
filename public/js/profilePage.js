$(document).ready(() => {
	const isReply = selectedTab === 'replies';
	loadContent(isReply);
});

function loadContent(isReply) {
	const url = '/api/v1/posts';

	if (isReply === false) {
		$.get(url, { postedBy: profileUserId, pinned: true }, (results) => {
			outputPinnedPost(results, $('.pinnedPostContainer'));
		});
	}

	$.get(url, { postedBy: profileUserId, isReply: isReply }, (results) => {
		outputPosts(results, $('.postsContainer'));
	});
}

function outputPinnedPost(results, container) {
	if (results.length === 0) {
		container.hide();
		return;
	}

	container.html('');

	results.forEach((result) => {
		const html = createPostHtml(result);
		container.append(html);
	});
}
