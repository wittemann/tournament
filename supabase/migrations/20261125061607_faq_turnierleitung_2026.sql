-- 2026: the tournament office moved from the basement of Halle 1 to the control booth.
update public.faq
set answer = 'In der Regiekabine vor dem Foyer, am Durchgang zwischen den beiden Hallen.',
    tile_value = 'Regiekabine',
    tile_detail = 'Vor dem Foyer, Durchgang zwischen den Hallen'
where id = 6;
