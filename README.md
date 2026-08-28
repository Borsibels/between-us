# Between Us

A warm, responsive website concept for long-distance couples.

## Run locally

```bash
npm install
npm run dev
```

## Current features

- Dual-time-zone dashboard
- Live reunion countdown
- Interactive daily question
- Shared memory gallery
- Date-night idea picker
- Responsive mobile navigation

## Connect Supabase

1. Create a Supabase project.
2. Open **SQL Editor**, paste `supabase/migrations/202608280001_initial_schema.sql`, and run it once.
3. Run `supabase/migrations/202608280002_full_features.sql` after the initial migration.
4. Copy `.env.example` to `.env.local`.
5. Add the project URL and publishable/anon key from **Project Settings → API**.
6. Restart `npm run dev`.

Without environment keys, the site intentionally stays in demo mode. With keys, it enables email authentication, private couple creation, six-character invitations, a two-member limit, protected photo storage, daily-answer reveal rules, and row-level security for all couple content.
