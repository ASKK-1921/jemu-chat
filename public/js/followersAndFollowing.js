$(document).ready(() => {
	// const dataType = selectedTab === 'followers';
	// loadData(dataType);
	const url = `/api/users/${profileUserId}/${selectedTab}`;

	$.get(url, (results) => {
		outputUsers(results, $('.resultsContainer'));
	});
});

// function loadContent(dataType) {
//   const url = `/api/users/${profileUserId}/${dataType}`;

//   $.get(url, (results) => {
//     outputUsers(results, $('.resultsContainer'));
//   });
// }
