$('#searchBox').keyup((event) => {
  clearTimeout(timer);
  const textbox = $(event.target);
  let value = textbox.val();
  const searchType = textbox.data().search;

  timer = setTimeout(() => {
    value = textbox.val().trim();
    if (value == '') {
      $('.resultsContainer').html('');
    } else {
      search(value, searchType);
    }
  }, 1000);
});

function search(serachTerm, searchType) {
  const url = searchType == 'users' ? '/api/users' : '/api/posts';

  $.get(url, { search: serachTerm }, (results) => {
    if (searchType == 'users') {
      outputUsers(results, $('.resultsContainer'));
    } else {
      outputPosts(results, $('.resultsContainer'));
    }
  });
}
