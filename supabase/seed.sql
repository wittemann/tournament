-- Data of the 2025 tournament, exported from the live project on 2026-10-10.
-- Used for local development and as the reference case for computed
-- standings (ADR-0006). Not for production: each edition loads its own data.

insert into public.games
  (id, class, time, hometeam, awayteam, homescore, awayscore, location, scorer, eventname)
overriding system value
values
  (8, 'Schüler', '12:30:00', null, null, null, null, 'Essensraum', null, '📋 Technische Konferenz'),
  (49, 'Schüler', '13:00:00', 'Bretten 2', 'Darmstadt 2', 14, 22, 'Halle 2', 'Mannheim', null),
  (32, 'Schüler', '13:30:00', 'Bretten 1', 'Stuttgart 2', 22, 13, 'Halle 1', 'Heidelberg', null),
  (50, 'Schüler', '13:30:00', 'Schriesheim', 'Karlsruhe', 15, 13, 'Halle 2', 'Darmstadt 1', null),
  (63, 'Schüler', '13:30:00', 'Mannheim', 'Remchingen', 27, 11, 'Halle 3', 'Nagold', null),
  (33, 'Schüler', '14:00:00', 'Heidelberg', 'Herrenberg', 16, 15, 'Halle 1', 'Bretten 1', null),
  (51, 'Schüler', '14:00:00', 'Darmstadt 2', 'Mannheim', 13, 26, 'Halle 2', 'Bretten 2', null),
  (64, 'Schüler', '14:00:00', 'Nagold', 'Bretten 2', 29, 3, 'Halle 3', 'Remchingen', null),
  (34, 'Schüler', '14:30:00', 'Remchingen', 'Nagold', 11, 16, 'Halle 1', 'Bretten', null),
  (52, 'Schüler', '14:30:00', 'Darmstadt 1', 'Stuttgart 1', 25, 8, 'Halle 2', 'Schriesheim', null),
  (65, 'Schüler', '14:30:00', 'Mannheim', 'Bretten 2', 35, 10, 'Halle 3', 'Darmstadt 2', null),
  (35, 'Schüler', '15:00:00', 'Stuttgart 2', 'Heidelberg', 16, 27, 'Halle 1', 'Herrenberg', null),
  (53, 'Schüler', '15:00:00', 'Karlsruhe', 'Darmstadt 1', 15, 16, 'Halle 2', 'Stuttgart 1', null),
  (66, 'Schüler', '15:00:00', 'Remchingen', 'Darmstadt 2', 23, 8, 'Halle 3', 'Bretten 2', null),
  (36, 'Schüler', '15:30:00', 'Herrenberg', 'Bretten 1', 22, 19, 'Halle 1', 'Stuttgart 2', null),
  (54, 'Schüler', '15:30:00', 'Stuttgart 1', 'Schriesheim', 22, 24, 'Halle 2', 'Karlsruhe', null),
  (67, 'Schüler', '15:30:00', 'Nagold', 'Mannheim', 10, 26, 'Halle 3', 'Remchingen', null),
  (37, 'Schüler', '16:00:00', 'Herrenberg', 'Stuttgart 2', 23, 10, 'Halle 1', 'Bretten 1', null),
  (55, 'Schüler', '16:00:00', 'Stuttgart 1', 'Karlsruhe', 18, 10, 'Halle 2', 'Schriesheim', null),
  (68, 'Schüler', '16:00:00', 'Bretten 2', 'Remchingen', 9, 24, 'Halle 3', 'Nagold', null),
  (38, 'Schüler', '16:30:00', 'Bretten 1', 'Heidelberg', 15, 14, 'Halle 1', 'Stuttgart 2', null),
  (56, 'Schüler', '16:30:00', 'Schriesheim', 'Darmstadt 1', 12, 23, 'Halle 2', 'Karlsruhe', null),
  (69, 'Schüler', '16:30:00', 'Darmstadt 2', 'Nagold', 15, 28, 'Halle 3', 'Mannheim', null),
  (39, 'Schüler', '17:00:00', 'Heidelberg', 'Schriesheim', 22, 12, 'Halle 1', 'Remchingen', null),
  (70, 'Schüler', '17:00:00', 'Karlsruhe', 'Stuttgart 2', 20, 4, 'Halle 3', 'Bretten 2', null),
  (40, 'Schüler', '17:30:00', 'Bretten 1', 'Remchingen', 18, 14, 'Halle 1', 'Schriesheim', null),
  (57, 'Schüler', '17:30:00', 'Stuttgart 1', 'Darmstadt 2', 29, 6, 'Halle 2', 'Bretten', null),
  (71, 'Schüler', '17:30:00', 'Stuttgart 2', 'Bretten 2', 23, 9, 'Halle 3', 'Karlsruhe', null),
  (41, 'Schüler', '18:00:00', 'Mannheim', 'Nagold', 15, 20, 'Halle 1', 'Bretten', null),
  (58, 'Schüler', '18:00:00', 'Herrenberg', 'Darmstadt 1', 10, 14, 'Halle 2', 'Bretten', null),
  (72, 'Schüler', '18:00:00', 'Bretten 2', 'Karlsruhe', 3, 21, 'Halle 3', 'Stuttgart 2', null),
  (42, 'Schüler', '18:30:00', 'Nagold', 'Darmstadt 1', 4, 30, 'Halle 1', 'Bretten', null),
  (59, 'Schüler', '18:30:00', 'Mannheim', 'Herrenberg', 15, 14, 'Halle 2', 'Bretten', null),
  (10, 'Schüler', '19:00:00', null, null, null, null, 'Essensraum', null, '🏆 Siegerehrung'),
  (7, 'T-Ball', '09:00:00', null, null, null, null, 'Essensraum', null, '📋 Technische Konferenz'),
  (25, 'T-Ball', '09:30:00', 'Bretten', 'Stuttgart 2', 11, 13, 'Halle 1', 'Karlsruhe', null),
  (43, 'T-Ball', '09:30:00', 'Nagold', 'Schriesheim', 14, 10, 'Halle 2', 'Remchingen', null),
  (26, 'T-Ball', '10:00:00', 'Stuttgart 1', 'Karlsruhe', 13, 20, 'Halle 1', 'Nagold', null),
  (44, 'T-Ball', '10:00:00', 'Schriesheim', 'Bretten', 12, 11, 'Halle 2', 'Stuttgart 2', null),
  (27, 'T-Ball', '10:30:00', 'Stuttgart 2', 'Nagold', 8, 14, 'Halle 1', 'Bretten', null),
  (45, 'T-Ball', '10:30:00', 'Karlsruhe', 'Remchingen', 19, 11, 'Halle 2', 'Schriesheim', null),
  (28, 'T-Ball', '11:00:00', 'Remchingen', 'Stuttgart 1', 20, 19, 'Halle 1', 'Karlsruhe', null),
  (46, 'T-Ball', '11:00:00', 'Bretten', 'Nagold', 7, 15, 'Halle 2', 'Schriesheim', null),
  (29, 'T-Ball', '11:30:00', 'Stuttgart 2', 'Schriesheim', 8, 15, 'Halle 1', 'Stuttgart 1', null),
  (30, 'T-Ball', '12:00:00', 'Nagold', 'Remchingen', 17, 16, 'Halle 1', 'Bretten', null),
  (47, 'T-Ball', '12:00:00', 'Karlsruhe', 'Schriesheim', 8, 4, 'Halle 2', 'Bretten', null),
  (60, 'T-Ball', '12:00:00', 'Stuttgart 2', 'Stuttgart 1', 8, 9, 'Halle 3', 'Bretten', null),
  (31, 'T-Ball', '12:30:00', 'Nagold', 'Karlsruhe', 8, 12, 'Halle 1', 'Bretten', null),
  (48, 'T-Ball', '12:30:00', 'Remchingen', 'Schriesheim', 11, 10, 'Halle 2', 'Bretten', null),
  (61, 'T-Ball', '12:30:00', 'Stuttgart 1', 'Bretten', 16, 11, 'Halle 3', 'Stuttgart 2', null),
  (62, 'T-Ball', '13:00:00', 'Bretten', 'Stuttgart 2', 11, 12, 'Halle 3', 'Stuttgart 1', null),
  (9, 'T-Ball', '13:30:00', null, null, null, null, 'Essensraum', null, '🏆 Siegerehrung');

-- As entered by hand in 2025. Note: B1 Herrenberg diff was entered as 14;
-- the game results give 15.
insert into public.standings
  (id, class, position, team, wins, losses, diff)
overriding system value
values
  (46, 'Schüler', '01', 'Darmstadt 1', 5, 0, 59),
  (40, 'Schüler', '02', 'Nagold', 4, 2, 7),
  (36, 'Schüler', '03', 'Mannheim', 5, 1, 65),
  (44, 'Schüler', '04', 'Herrenberg', 2, 3, 11),
  (43, 'Schüler', '05', 'Heidelberg', 3, 1, 21),
  (47, 'Schüler', '06', 'Schriesheim', 2, 2, -17),
  (45, 'Schüler', '07', 'Bretten 1', 3, 1, 11),
  (41, 'Schüler', '08', 'Remchingen', 2, 3, 5),
  (39, 'Schüler', '09', 'Stuttgart 1', 2, 2, 12),
  (42, 'Schüler', '10', 'Darmstadt 2', 1, 4, -56),
  (48, 'Schüler', '11', 'Karlsruhe', 2, 3, 23),
  (38, 'Schüler', '12', 'Stuttgart 2', 1, 4, -35),
  (37, 'Schüler', '13', 'Bretten 2', 0, 6, -106),
  (18, 'Schüler', 'A1', 'Mannheim', 4, 0, 71),
  (20, 'Schüler', 'A2', 'Nagold', 3, 1, 28),
  (19, 'Schüler', 'A3', 'Remchingen', 2, 2, 9),
  (17, 'Schüler', 'A4', 'Darmstadt 2', 1, 3, -33),
  (16, 'Schüler', 'A5', 'Bretten 2', 0, 4, -74),
  (24, 'Schüler', 'B1', 'Herrenberg', 2, 1, 14),
  (23, 'Schüler', 'B2', 'Heidelberg', 2, 1, 11),
  (21, 'Schüler', 'B3', 'Bretten 1', 2, 1, 7),
  (22, 'Schüler', 'B4', 'Stuttgart 2', 0, 3, -33),
  (27, 'Schüler', 'C1', 'Darmstadt 1', 3, 0, 29),
  (25, 'Schüler', 'C2', 'Schriesheim', 2, 1, -7),
  (28, 'Schüler', 'C3', 'Stuttgart 1', 1, 2, -11),
  (26, 'Schüler', 'C4', 'Karlsruhe', 0, 3, -11),
  (30, 'T-Ball', '1', 'Karlsruhe', 4, 0, 0),
  (29, 'T-Ball', '2', 'Nagold', 4, 1, 0),
  (31, 'T-Ball', '3', 'Remchingen', 2, 2, 0),
  (34, 'T-Ball', '4', 'Schriesheim', 2, 3, 0),
  (33, 'T-Ball', '5', 'Stuttgart 1', 2, 2, 0),
  (35, 'T-Ball', '6', 'Stuttgart 2', 2, 3, 0),
  (32, 'T-Ball', '7', 'Bretten', 0, 5, 0),
  (11, 'T-Ball', 'A1', 'Nagold', 3, 0, 18),
  (12, 'T-Ball', 'A2', 'Schriesheim', 2, 1, 4),
  (10, 'T-Ball', 'A3', 'Stuttgart 2', 1, 2, -11),
  (9, 'T-Ball', 'A4', 'Bretten', 0, 3, -11),
  (14, 'T-Ball', 'B1', 'Karlsruhe', 2, 0, 15),
  (15, 'T-Ball', 'B2', 'Remchingen', 1, 1, -7),
  (13, 'T-Ball', 'B3', 'Stuttgart 1', 0, 2, -8);

insert into public.items
  (id, category, item, price, "soldOut")
overriding system value
values
  (4, 'Getränke', 'Mineralwasser Medium', 2.5, false),
  (5, 'Getränke', 'Cola', 2.5, false),
  (6, 'Getränke', 'Fanta', 2.5, false),
  (7, 'Getränke', 'Mezzo Mix', 2.5, false),
  (8, 'Getränke', 'Bier', 3, false),
  (9, 'Getränke', 'Natur Radler', 3, false),
  (10, 'Getränke', 'Kaffee', 1.5, false),
  (11, 'Getränke', 'Glühwein', 2.5, false),
  (12, 'Getränke', 'Kinderpunsch', 1.5, true),
  (13, 'Essen', 'Hot Dog', 2.5, true),
  (14, 'Essen', 'Pommes', 3, true),
  (15, 'Essen', 'Bretzel', 1.5, false),
  (16, 'Essen', 'Käselaugenstangen', 2.5, false),
  (17, 'Essen', 'Kuchen', 2, false),
  (18, 'Essen', 'Süßigkeiten / Chips / Erdnüsse ', 1.5, false),
  (19, 'Essen', 'Fleischkäsebrötchen', 3.5, false),
  (20, 'Essen', 'Corny Riegel', 1, false),
  (21, 'Getränke', 'Schokodrink', 1, false),
  (22, 'Merchandise', 'Kleiner Baseball', 1, false),
  (23, 'Merchandise', 'Schlüsselanhänger', 1, false),
  (25, 'Merchandise', 'Bleistift und Notizblock', 1.5, false),
  (26, 'Merchandise', 'Schnapp-Armband', 1, false),
  (27, 'Merchandise', 'Kids Play Box (6-teilig + Sticker)', 5, false),
  (28, 'Merchandise', 'Silikon-Armband', 1.5, false),
  (29, 'Merchandise', 'Sticker (10 Stück, freie Auswahl)', 2, false);

insert into public.faq
  (id, question, answer)
overriding system value
values
  (1, 'Wann ist die Veranstaltung zu Ende?', 'ca. 19:15 Uhr'),
  (2, 'Gibt es Pokale und Medallien?', 'Jeder Spieler bekommt eine Medaille und für die ersten 4 Mannschaften gibt es auch einen Pokal.'),
  (3, 'Wie sind die Regeln?', 'Her findest du die Regeln: <a href="https://bretten-kangaroos.net/wp-content/uploads/2025/12/Regeln-X-Mas-Ball-2025.pdf">Regeln.pdf</a>'),
  (5, 'Wo findet das Turnier statt?', 'In der Sporthall "im Grüner" in Bretten. Hier findest du die Anfahrtsbeschreibung: <a href="https://bretten-kangaroos.net/wp-content/uploads/2025/12/Anfahrt_Parken.pdf">Anfahrt.pdf</a>'),
  (6, 'Wo ist die Turnierleitung zu finden?', 'Im Aufsichtsraum von Halle 1 (Untergeschoss).');

-- Continue ids after the explicit values above.
select setval(pg_get_serial_sequence('public.games', 'id'), (select max(id) from public.games));
select setval(pg_get_serial_sequence('public.standings', 'id'), (select max(id) from public.standings));
select setval(pg_get_serial_sequence('public.items', 'id'), (select max(id) from public.items));
select setval(pg_get_serial_sequence('public.faq', 'id'), (select max(id) from public.faq));
