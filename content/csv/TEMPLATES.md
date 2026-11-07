# CSV templates for the admin upload

One file per category lives in `content/csv/templates/`. Each has the header row and one example row marked `published = no`, so a forgotten example never goes live. Delete the example row before you upload.

Files: `scholarships.csv`, `fellowships.csv`, `grants.csv`, `courses.csv`, `events.csv`, `student-offers.csv`, `opportunities-mixed.csv` (one file with a `category` column) and `blog.csv`.

## Columns

| Column | Needed | What to put |
| --- | --- | --- |
| opportunity_id | Recommended | A short unique ID per row, for example SCH-001. Used to update a row later instead of duplicating it. |
| title | Yes | Up to 200 characters. |
| provider | Recommended | Who runs it. |
| summary | Recommended | One or two sentences, up to 400 characters. If empty, the start of the description is used. |
| description | Optional | Longer text, up to 6000 characters. A blank line starts a new paragraph. |
| link | Yes | The official page. Must start with https://. |
| image_url | Optional | A thumbnail. Must start with https://. |
| coupon_code | Courses and student offers only | The code, exactly as the provider gives it. |
| location | Optional | A country, a city or Online. |
| level | Optional | For example Undergraduate, Early career, Beginner. |
| funding | Optional | For example Full tuition, Stipend, Up to $5,000, Free, Discount. |
| deadline | Optional | YYYY-MM-DD or DD/MM/YYYY. Leave empty for rolling or no deadline. For events, use the event date. |
| eligibility | Optional | Several items separated by the pipe character, for example First\|Second. Up to 12 items. |
| benefits | Optional | Same pipe format. |
| how_to_apply | Optional | Same pipe format, one step per item. |
| featured | Optional | yes or no. Empty means no. |
| published | Optional | yes or no. Empty means yes. Use no to save a draft. |
| category | Mixed file only | scholarships, fellowships, grants, courses, events or student-offers. |

## Rules

- Save as CSV with UTF-8 encoding. In Excel, choose "CSV UTF-8". In Google Sheets, choose File, Download, Comma-separated values.
- Maximum 1000 rows and 1 MB per file.
- Wrap any cell that contains a comma or a line break in double quotes. Spreadsheet programs do this for you.
- Only add verified listings from official sources, and always link to the official page.
- Check a file before uploading with `npm run check:csv -- content/csv/yourfile.csv scholarships`.

## Blog posts

Columns: slug, title, excerpt, body, author, tags (pipe separated), read_minutes, published_at, image_url, published. The body can use Markdown headings such as `## Heading`.
