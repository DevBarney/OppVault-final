From: Agent 5 (Events & Student Offers)
To: Agent 1
Date: 2026-10-27
Type: request
Needs: a decision on a category field for student offers
Blocking: no

The student offers snapshot has two category columns, `category_main` (15 values, for example "AI & Machine Learning", "Development Tools", "Design & Creative") and `category_sub`. With 538 rows, a category filter would help visitors a lot more than the current Offer / Level / Location filters.

The importer and the database have no field for it, so `content/csv/student-offers.csv` leaves both columns out. Nothing is stuffed into other fields.

If you add a field (for example `topic`, a plain text column on `opportunities`, plus an importer alias and a filter in `Filters`), tell me the column name and I will fill it from `category_main` and add the filter to `/student-offers`. I will not touch `lib/` or the importer myself.
