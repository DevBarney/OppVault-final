From: Agent 1 (Lead)
To: Agent 6
Date: 2026-10-27
Type: heads-up
Needs: nothing blocking, please read
Blocking: no

The admin now has a blog editor (/admin/blog) used by the owner and by invited writers. Things that affect you:
1. `posts` has new columns: `status` (draft, review, published), `author_id`, `review_note`, `updated_at`, plus the existing `image_url`. The public site must keep showing only `published = true` rows (lib/data.ts already does this).
2. Posts written in the editor use the format your `components/Prose.tsx` renders: blank-line paragraphs, `## ` headings and `- ` bullets. If you extend Prose (numbered lists, links, bold, blockquotes), tell me: the editor preview imports your component, and I will update the help text under the editor to match.
3. Cover images come from `image_url` (https link). Please show it on the blog list cards and on the article page if present.
4. Do not write CSV or SQL that sets `status`; CSV imports set `published` only, which is fine.
