-- Seed data: states + cities. Missing from seed_categories.sql on purpose --
-- geography is its own concern -- but required before any page or form that
-- references providers.primary_city_id can work, since that's a foreign key
-- into cities(id). Mirrors src/data/states.json and src/data/cities.json
-- exactly (same slugs/names/coords) so the DB matches the current static
-- site. Safe to re-run (idempotent via ON CONFLICT).

insert into states (name, abbreviation, slug) values
  ('Texas', 'TX', 'texas')
on conflict (abbreviation) do nothing;

-- Houston is the metro hub (metro_id null, is_metro_hub true); every other
-- city here points its metro_id at Houston's id via the slug lookup below.
insert into cities (state_id, name, slug, is_metro_hub, latitude, longitude)
select id, 'Houston', 'houston', true, 29.7604, -95.3698 from states where slug = 'texas'
on conflict (state_id, slug) do nothing;

insert into cities (state_id, name, slug, is_metro_hub, metro_id, latitude, longitude)
select s.id, v.name, v.slug, false, h.id, v.lat, v.lng
from states s
join cities h on h.slug = 'houston' and h.state_id = s.id
cross join (values
  ('Sugar Land', 'sugar-land', 29.6197, -95.6349),
  ('Katy', 'katy', 29.7858, -95.8244),
  ('The Woodlands', 'the-woodlands', 30.1658, -95.4613),
  ('Pearland', 'pearland', 29.5636, -95.286),
  ('Cypress', 'cypress', 29.9691, -95.6972),
  ('Spring', 'spring', 30.0799, -95.4172),
  ('Pasadena', 'pasadena', 29.6911, -95.209),
  ('League City', 'league-city', 29.4996, -95.0947),
  ('Missouri City', 'missouri-city', 29.6186, -95.5377)
) as v(name, slug, lat, lng)
where s.slug = 'texas'
on conflict (state_id, slug) do nothing;
