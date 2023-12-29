import { outputPosts, outputUsers } from './commonFunctions.mjs';

const search = (url, searchTerm, searchType) => {
	$.get(url, { search: searchTerm }, (data) => {
		if (searchType === 'users') {
			outputUsers(data, $('.resultsContainer'));
		} else {
			outputPosts(data, $('.resultsContainer'));
		}
	});
};

// eslint-disable-next-line import/prefer-default-export
export { search };
