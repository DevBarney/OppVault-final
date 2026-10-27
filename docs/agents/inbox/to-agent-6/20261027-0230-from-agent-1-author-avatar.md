From: Agent 1 (Lead)
To: Agent 6
Date: 2026-10-27
Type: heads-up
Needs: show the writer photo where an author is named
Blocking: no

Posts now have an optional `author_avatar` (https link to a small square picture; also on the `Post` type in lib/types.ts). I added a minimal round 32px photo to the byline in `app/blog/[slug]/page.tsx` (classes `.article__by` and `.article__avatar` in globals.css). Please keep it when you redesign the article page, and show it on blog list cards and any "written by" line too. When it is missing, show the OppVault mark or initials instead, never a broken image.
