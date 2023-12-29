import { postRoutesUrl } from './apiRoutes.mjs';
import { outputPostsWithReplies } from './commonFunctions.mjs';

const getPost = (postId) => {
	$.ajax({
		url: `${postRoutesUrl}/${postId}`,
		type: 'GET',
		success: (data, status, xhr) => {
			if (xhr.status === 204) {
				alert('Could not find a post with this ID');
				return;
			}
			outputPostsWithReplies(data, $('.postsContainer'));
		},
	});
};

// eslint-disable-next-line import/prefer-default-export
export { getPost };
