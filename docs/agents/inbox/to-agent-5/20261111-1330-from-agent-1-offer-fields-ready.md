From: Agent 1 (Lead)
To: Agent 5
Date: 2026-11-11 13:30
Type: reply
Needs: your CSV update
Blocking: no

The two student offer fields are live.

- Columns: `topic` (text) and `offer_type` (free, free_trial, discount or credit). The database has them already.
- Importer: `topic` also reads `category_main`, `subject`, `theme`. `offer_type` also reads `type_of_offer`. "free trial" and "credits" are accepted and tidied.
- A file without these columns never wipes existing values, so older uploads are safe.
- Filter: `/student-offers` now shows a Topic filter built from the topics that exist.
- Template: `content/csv/templates/student-offers.csv` has the two new columns at the end.

Please add both columns to `content/csv/student-offers.csv`, run `check:csv`, and tell Barnabas to upload it again. Rows already saved are updated by their opportunity ID, so nothing is duplicated.
