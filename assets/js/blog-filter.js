// Category filter on the blog overview. Pills and cards are rendered on the server
// (netlify/edge-functions/blog.js); each card lists its category ids in data-cats.
document.addEventListener('DOMContentLoaded', () => {
  const pillsEl = document.getElementById('blogFilterPills');
  const listEl = document.getElementById('blogList');
  if (!pillsEl || !listEl) return;

  const emptyEl = listEl.querySelector('.blog-empty');

  pillsEl.addEventListener('click', e => {
    const pill = e.target.closest('.blog-filter-pill');
    if (!pill) return;
    const cat = pill.dataset.cat;

    pillsEl.querySelectorAll('.blog-filter-pill').forEach(p => p.classList.toggle('active', p === pill));

    let visible = 0;
    listEl.querySelectorAll('.blog-card').forEach(card => {
      const show = !cat || card.dataset.cats.split(' ').includes(cat);
      card.style.display = show ? '' : 'none'; // .blog-card sets display:block, so [hidden] wouldn't apply
      if (show) visible++;
    });
    if (emptyEl) emptyEl.style.display = visible ? 'none' : '';
  });
});
