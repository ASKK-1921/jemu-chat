$('document').ready(() => {
  const url = `/api/posts/${postId}`;

  $.get(url, (results) => {
    outputPostsWithReplies(results, $('.postsContainer'));
  });
});
