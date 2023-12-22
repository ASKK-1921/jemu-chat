$('document').ready(() => {
	const url = `/api/posts/${postId}`;

	$.ajax({
		url: url,
		type: 'GET',
		success: (results, status, xhr) => {
			if (xhr.status === 204) {
				alert('Could not find a post with this ID');
				return;
			}
			outputPostsWithReplies(results, $('.postsContainer'));
		},
	});
});
