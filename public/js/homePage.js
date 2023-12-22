$('document').ready(() => {
	const url = '/api/posts';

	$.get(url, { followingOnly: true }, (results) => {
		outputPosts(results, $('.postsContainer'));
	});
});
