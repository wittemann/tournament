-- Info page: quick-fact tiles and link buttons come from faq rows.
-- A row with a tile_title also shows as a tile (value is required, detail optional).
alter table public.faq
  add column tile_title text,
  add column tile_value text,
  add column tile_detail text,
  add constraint faq_tile_check
    check (
      (tile_title is null and tile_value is null and tile_detail is null)
      or (tile_title <> '' and tile_value <> '')
    );

-- Move the 2025 content into the new columns. Link answers become plain text.
update public.faq
set tile_title = 'Ende', tile_value = 'ca. 19:15', tile_detail = 'Uhr'
where id = 1;
update public.faq
set tile_title = 'Turnierleitung', tile_value = 'Halle 1', tile_detail = 'Aufsichtsraum, Untergeschoss'
where id = 6;
update public.faq
set answer = 'Alle Regeln findest du im PDF.',
    link_url = 'https://bretten-kangaroos.net/wp-content/uploads/2025/12/Regeln-X-Mas-Ball-2025.pdf',
    link_label = 'Regeln PDF'
where id = 3;
update public.faq
set answer = 'In der Sporthalle „Im Grüner“ in Bretten.',
    link_url = 'https://bretten-kangaroos.net/wp-content/uploads/2025/12/Anfahrt_Parken.pdf',
    link_label = 'Anfahrt PDF'
where id = 5;
