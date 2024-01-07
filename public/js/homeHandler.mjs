import { postRoutesUrl } from './apiRoutes.mjs';
import { outputPosts } from './commonFunctions.mjs';

const getFilteredPosts = (followingOnly) => {
	$('.loadingSpinnerContainer').css('display', 'flex');
	$('.postsContainer').css('display', 'none');
	$.get(postRoutesUrl, { followingOnly: followingOnly }, (results) => {
		// $.get(postRoutesUrl, (results) => {
		// $('.loadingSpinnerContainer').remove();
		$('.loadingSpinnerContainer').css('display', 'none');
		$('.postsContainer').css('display', 'block');
		outputPosts(results, $('.postsContainer'));
	});
};

// eslint-disable-next-line import/prefer-default-export
export { getFilteredPosts };
