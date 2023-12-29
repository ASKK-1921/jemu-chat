import { postRoutesUrl } from './apiRoutes.mjs';
import { outputPosts } from './commonFunctions.mjs';

const getFilteredPosts = () => {
	$.get(postRoutesUrl, { followingOnly: true }, (results) => {
		outputPosts(results, $('.postsContainer'));
	});
};

// eslint-disable-next-line import/prefer-default-export
export { getFilteredPosts };
