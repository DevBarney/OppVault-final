# Turning an attached CSV into an upload-ready file

Read this when Barnabas attaches a CSV for your area. The file he attaches can have **any** column names and order. Your job is to turn it into a file the admin page accepts, without inventing anything.

## 1. The target format

The admin importer reads these columns (names are case-insensitive; the aliases in brackets are also understood):

| Column | Needed? | Notes |
|---|---|---|
| `opportunity_id` (id, ref) | optional | Stable reference. If the attached file has an ID column, keep its values exactly. If not, use `<area>-<number>` in file order (for example `scholarships-001`) so a later re-upload updates the same listing. |
| `title` (name, course_name...) | **required** | |
| `link` (url, course_link, official_link, apply_link) | **required** | Full `https://` official address. |
| `provider` (organisation, institution, platform) | optional | Defaults to the website name of the link. |
| `summary` | optional | One or two sentences. If missing it is filled with a neutral line. Do not write marketing copy for them. |
| `description` | optional | Longer details; blank line between paragraphs. |
| `image_url` (image, thumbnail, thumbnail_link) | optional | Direct `https://` picture link. |
| `coupon_code` (coupon, promo_code) | optional | Shown on the listing page. |
| `location` (country) | optional | Country, city or `Online`. Defaults to Global. |
| `level` | optional | For example Undergraduate, Postgraduate, Early career, All levels. |
| `funding` (cost, price, amount) | optional | **Use one of the exact words for your category (below)** so the page filter works. Put the detail ("$2,000 a year") in `benefits`. |
| `deadline` (closing_date, end_date, date) | optional | `YYYY-MM-DD` or `DD/MM/YYYY`. Empty = rolling. |
| `eligibility`, `benefits`, `how_to_apply` | optional | Several items in one cell separated by ` | `. |
| `featured`, `published` | optional | `yes` / `no`. `published` defaults to yes. |

Exact `funding` words per category (from `lib/categories.ts`):
- scholarships: `Fully funded`, `Partially funded`, `Tuition only`
- fellowships: `Stipend`, `Fully funded`, `Mentorship only`
- grants: `Small (under $5,000)`, `Medium ($5,000 to $25,000)`, `Large (over $25,000)`
- courses: `Free`, `Free to audit`, `Low cost`
- events: `Free`, `Funded places`, `Paid`
- student-offers: `Free`, `Discount`, `Free trial`

The mixed upload (`opportunities`) needs a `category` column. You normally prepare one file per category instead.

## 2. Procedure

1. Open the attached file and read the header row and about ten rows. Tell yourself what each column means.
2. Write the mapping in `docs/agents/status/agent-N.md` under "CSV mapping": `their column -> our column` for every column, and what you did with columns that have no equivalent.
3. Build `content/csv/<area>.csv` (names: scholarships, fellowships, grants, courses, events, student-offers, posts) with the exact headers from `npm run check:csv` output ("Template columns"). Use a small script (Python or Node) to transform; do not retype rows by hand. Keep the original attachment as `content/csv/source/<area>-original.csv`.
4. Run `npm run check:csv -- content/csv/<area>.csv <kind>` (kind = the category, or `blog`). Fix every problem it reports at the source of the problem. Repeat until it prints `with problems: 0`. If `npx` cannot install `tsx` in your environment, say so in your status file and check the rules by reading `lib/admin/validate.ts`.
5. Write `content/csv/<area>-notes.md`: row counts (in, out), rows removed or changed and why, any column you could not map, any guess you made, and questions for Barnabas.

## 3. Rules that matter

- **Never invent data.** No made-up links, deadlines, amounts, eligibility or descriptions. If a value is missing, leave it empty.
- A row **without a usable official https link cannot be imported**. Do not fabricate one. List those rows in the notes file and leave them out of the final CSV (or keep them with `published = no` only if a link exists).
- Do not "fix" facts. You may fix format (dates, casing, stray spaces, `http` to `https` only if the page demonstrably supports it, otherwise flag it).
- **Dates:** if the file uses `03/04/2026` you must work out whether it is day/month or month/day from other rows (for example `25/03/2026`). If it is truly ambiguous, flag it in the notes and ask. Never guess silently.
- **Duplicates:** the same link or the same title twice in one file: keep one, list the other in the notes.
- Amounts and currency: keep the original wording in `benefits` (for example `Up to $2,000 a year`). Only the `funding` column uses the fixed words above.
- Extra columns that have no home (for example age limit, number of awards, field of study): fold them into `eligibility` or `benefits` as plain lines. If a column clearly deserves its own database field and its own filter, send a request to Agent 1 describing it; do not change the database yourself.
- Thumbnails must be direct `https` image links you were given. Never hotlink an image you found yourself.
- Keep British spelling in text you add. Leave the provider's wording otherwise untouched.
- Do not commit anything that looks like a password, API key or private personal data. If the CSV contains personal emails or phone numbers, stop and tell Barnabas.

## 4. After the CSV is ready

Tell Barnabas (in your status file and final message) the path of the file and the check result. He uploads it on the admin page. Then build or refine your pages around what the data actually contains (which columns are well filled, which are empty), and make sure your pages look good both with 3 listings and with 300.
