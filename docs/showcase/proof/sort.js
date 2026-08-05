/* Column sort for the runs table — progressive enhancement only.
   The table ships already ordered the way the floor reads it (still-to-come ascending, then
   already-out newest first). Sorting overrides that order; it never gates visibility, so with
   scripting off the table is complete and correctly ordered. Direction is shown with a rule under
   or over the label rather than an arrow glyph: the vendored Plex subset is latin-only and would
   render an arrow as tofu. */
(() => {
  const table = document.getElementById('runs-table');
  if (!table) return;
  const body = table.tBodies[0];
  const buttons = [...table.querySelectorAll('.sortb')];

  const sortBy = btn => {
    const col = +btn.dataset.col;
    const numeric = btn.dataset.num === '1';
    const dir = btn.dataset.dir === 'asc' ? -1 : 1;

    for (const b of buttons) {
      delete b.dataset.dir;
      b.closest('th').removeAttribute('aria-sort');
    }
    btn.dataset.dir = dir === 1 ? 'asc' : 'desc';
    btn.closest('th').setAttribute('aria-sort', dir === 1 ? 'ascending' : 'descending');

    const key = tr => tr.cells[col].textContent.trim();
    const rows = [...body.rows].sort((a, b) =>
      (numeric ? key(a) - key(b) : key(a).localeCompare(key(b))) * dir);
    body.append(...rows);
  };

  for (const btn of buttons) btn.addEventListener('click', () => sortBy(btn));
})();
