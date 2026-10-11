-- faq_tile_check let half-filled tiles through: a CHECK passes on NULL, and NULL <> '' is NULL.
alter table public.faq drop constraint faq_tile_check;
alter table public.faq add constraint faq_tile_check
  check (
    (tile_title is null and tile_value is null and tile_detail is null)
    or (
      tile_title is not null and tile_value is not null
      and btrim(tile_title) <> '' and btrim(tile_value) <> ''
    )
  );
