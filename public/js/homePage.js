$('document').ready(() => {
	const url = '/api/v1/posts';

	$.get(url, { followingOnly: true }, (results) => {
		outputPosts(results, $('.postsContainer'));
	});
});
