-- Drop the unused GraphQL extension (TODO section 2). The app reads via
-- PostgREST and Realtime only; nothing in this project depends on
-- pg_graphql (checked 2026-10-11). Own migration so a privilege problem here
-- can't roll back the 2026 edition schema migration.
drop extension if exists pg_graphql;
