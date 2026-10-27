#!/usr/bin/env python3
"""Convert a StudentOffers snapshot CSV into the OppVault admin upload format.

    python3 content/csv/convert-student-offers.py [snapshot.csv]

Default input:  content/csv/source/student-offers-original.csv
Writes:         content/csv/student-offers.csv        (upload this on /admin, type "Student offers")
                content/csv/student-offers-notes.md   (read this first)

Rules, in short (details are printed in the notes file):
- Nothing is invented. A value that is missing in the snapshot stays empty.
- A row without a usable https link is left out. So are rows whose link carries a referral, affiliate or
  tracking code, rows that go through a third-party redirect, and exact duplicates.
- A row is a draft (published = no) when the snapshot does not mark it "verified", or when its end date
  cannot be worked out safely.
- Re-running on a newer snapshot keeps the same opportunity_id (the snapshot id), so a re-upload updates
  listings instead of duplicating them.

Owner: Agent 5. Standard library only.
"""
import csv
import json
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
from urllib.parse import parse_qsl, urlparse

HERE = Path(__file__).resolve().parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / 'source' / 'student-offers-original.csv'
OUT = HERE / 'student-offers.csv'
NOTES = HERE / 'student-offers-notes.md'

# Exact column order of the admin template (see `npm run check:csv` output, "Template columns").
HEADERS = ['opportunity_id', 'title', 'provider', 'summary', 'description', 'link', 'image_url', 'coupon_code',
           'location', 'level', 'funding', 'deadline', 'eligibility', 'benefits', 'how_to_apply', 'featured', 'published']

TRACKING_KEY = re.compile(r'^(aff|affiliate|ref|referral|referrer|pid|utm_.*|af_.*)$', re.I)
REDIRECT_HOSTS = ('workers.dev',)
NOT_PROVIDER_SITE = ('studentbeans.com', 'myunidays.com', 'unidays.com', 'studentappcentre.com', 'instagram.com')


def clean(s: str) -> str:
    return re.sub(r'\s+', ' ', (s or '').replace('\u00a0', ' ')).strip()


def urgency_text(raw: str) -> str:
    raw = (raw or '').strip()
    if not raw:
        return ''
    try:
        data = json.loads(raw)
        if isinstance(data, dict):
            return clean(str(data.get('text', '')))
    except ValueError:
        pass
    return clean(re.sub(r'[^\w\s,.\-]', '', raw, flags=re.U))


def explicit_date(text: str):
    """Return YYYY-MM-DD only when the text holds a full 'Mon D, YYYY' date."""
    m = re.search(r'([A-Za-z]{3,9})\.?\s+(\d{1,2}),\s*(\d{4})', text)
    if not m:
        return None
    for fmt in ('%B %d %Y', '%b %d %Y'):
        try:
            return datetime.strptime(f'{m.group(1)} {m.group(2)} {m.group(3)}', fmt).strftime('%Y-%m-%d')
        except ValueError:
            continue
    return None


def funding_from_tags(tags: set):
    found = [w for w in ('Free', 'Discount', 'Trial') if w in tags]
    if len(found) == 1:
        return {'Free': 'Free', 'Discount': 'Discount', 'Trial': 'Free trial'}[found[0]], ''
    if len(found) > 1:
        return '', 'more than one of Free/Discount/Trial'
    if 'Credit' in tags:
        return '', 'tag is "Credit", which is not one of Free, Discount, Free trial'
    return '', 'no Free/Discount/Trial/Credit tag'


def norm_url(u: str) -> str:
    return u.strip().lower().rstrip('/')


rows = list(csv.DictReader(open(SRC, newline='', encoding='utf-8-sig')))
held = defaultdict(list)       # reason -> [(id, name, extra)]
drafts = defaultdict(list)     # reason -> [(id, name, extra)]
kept = []
flags = defaultdict(list)
funding_blank = defaultdict(list)

# Pass 1: hold-outs that look at one row only.
candidates = []
for r in rows:
    rid, name, link = clean(r['id']), clean(r['name']), clean(r['claim_url'])
    if not link:
        held['No link in the snapshot'].append((rid, name, clean(r['offer'])))
        continue
    p = urlparse(link)
    if p.scheme != 'https' or not p.netloc:
        held['Link is not a full https:// address'].append((rid, name, link))
        continue
    if any(p.netloc.lower().endswith(h) for h in REDIRECT_HOSTS):
        held['Link goes through a third-party redirect, not the provider'].append((rid, name, link))
        continue
    bad = [k for k, _ in parse_qsl(p.query, keep_blank_values=True) if TRACKING_KEY.match(k)]
    if bad:
        held['Link carries a referral, affiliate or tracking code'].append((rid, name, f'{", ".join(sorted(set(bad)))} in {p.netloc}'))
        continue
    candidates.append(r)

# Pass 2: exact duplicates (same name and same link). Keep the lowest id.
seen = {}
for r in sorted(candidates, key=lambda x: int(x['id'])):
    key = (clean(r['name']).lower(), norm_url(r['claim_url']))
    if key in seen:
        held['Duplicate of another row (same name and same link)'].append((clean(r['id']), clean(r['name']), f'kept id {seen[key]}'))
        continue
    seen[key] = clean(r['id'])
    kept.append(r)
kept.sort(key=lambda x: int(x['id']))

link_use = Counter(norm_url(r['claim_url']) for r in kept)
out_rows = []
for r in kept:
    rid, name, offer = clean(r['id']), clean(r['name']), clean(r['offer'])
    link = clean(r['claim_url'])
    host = urlparse(link).netloc.lower().replace('www.', '')
    tags = {t.strip() for t in r['tags'].split(';') if t.strip()}
    funding, why = funding_from_tags(tags)
    if not funding:
        funding_blank[why].append((rid, name, offer))

    eligibility = []
    loc = clean(r['location']) or 'Global'
    if loc == 'Limited Countries':
        eligibility.append('Available in selected countries only. Check the provider\u2019s page for the list.')
    if loc == 'Limited Universities':
        eligibility.append('Available at selected universities only. Check the provider\u2019s page for the list.')

    description = 'Also listed in the GitHub Student Developer Pack.' if r['github_offer'].strip().lower() == 'true' else ''

    # Draft rules
    draft_reasons = []
    vs = clean(r['verification_status'])
    if vs != 'verified':
        draft_reasons.append('Snapshot status is "%s", not "verified"' % (vs or 'blank'))
    deadline = ''
    u = urgency_text(r['urgency_badge'])
    if u:
        d = explicit_date(u)
        if d:
            deadline = d
        elif re.search(r'closed', u, re.I):
            draft_reasons.append(f'Snapshot says "{u}"')
        elif re.search(r'\b(ends|expires)\b', u, re.I):
            draft_reasons.append(f'End date "{u}" has no full date (day, month and year)')
    published = 'no' if draft_reasons else 'yes'
    for why in draft_reasons:
        drafts['Snapshot status is not "verified"' if why.startswith('Snapshot status') else why].append((rid, name, vs or 'blank'))

    if host.endswith(NOT_PROVIDER_SITE):
        flags['Link is a student-discount site or social page, not the provider\u2019s own site'].append((rid, name, host))
    if link_use[norm_url(link)] > 1:
        flags['Link is shared with other rows (not specific to this offer)'].append((rid, name, host))
    if u and not explicit_date(u) and not re.search(r'closed|ends|expires', u, re.I):
        flags['Urgency badge carries no date (left out)'].append((rid, name, u))

    out_rows.append({
        'opportunity_id': rid,
        'title': f'{name}: {offer}' if offer else name,
        'provider': name,
        'summary': clean(r['description']),
        'description': description,
        'link': link,
        'image_url': '',
        'coupon_code': '',
        'location': loc,
        'level': '',
        'funding': funding,
        'deadline': deadline,
        'eligibility': ' | '.join(eligibility),
        'benefits': offer,
        'how_to_apply': '',
        'featured': 'no',
        'published': published,
    })

with open(OUT, 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=HEADERS, lineterminator='\n')
    w.writeheader()
    w.writerows(out_rows)

# ---------------- notes ----------------
def table(items, third='Detail'):
    lines = [f'| id | name | {third} |', '|---|---|---|']
    for i, n, x in items:
        lines.append(f'| {i} | {n} | {x.replace("|", "/")} |')
    return '\n'.join(lines)


n_in = len(rows)
n_held = sum(len(v) for v in held.values())
n_pub = sum(1 for r in out_rows if r['published'] == 'yes')
n_draft = len(out_rows) - n_pub
ids = sorted(int(r['id']) for r in rows)
gaps = len(set(range(ids[0], ids[-1] + 1)) - set(ids))

md = []
md.append('# Student offers: conversion notes\n')
md.append(f'Generated by `content/csv/convert-student-offers.py` from `{SRC.name}`. Re-run it on any new snapshot; ids stay the same, so a re-upload updates listings.\n')
md.append('## Numbers\n')
md.append(f'- Rows in the snapshot: {n_in}')
md.append(f'- Rows left out of the upload: {n_held} (reasons below)')
md.append(f'- Rows in `student-offers.csv`: {len(out_rows)} ({n_pub} published = yes, {n_draft} published = no)')
md.append(f'- Snapshot ids run from {ids[0]} to {ids[-1]} with {gaps} numbers missing. Nothing was done about that.\n')

md.append('## Rows left out of the upload\n')
md.append('These are not in the CSV. Nothing was guessed to rescue them.\n')
for reason, items in held.items():
    md.append(f'### {reason} ({len(items)})\n')
    md.append(table(items, 'Detail') + '\n')

md.append('## Rows in the upload as drafts (published = no)\n')
md.append('They are in the file so you can review them on the admin page and switch them on. Nothing shows to the public until published is yes.\n')
for reason, items in drafts.items():
    md.append(f'### {reason} ({len(items)})\n')
    md.append(table(items, 'Status') + '\n')

md.append('## Rows published = yes, but worth a look\n')
for reason, items in flags.items():
    md.append(f'### {reason} ({len(items)})\n')
    md.append(table(items, 'Detail') + '\n')

md.append('## Funding left empty\n')
md.append('The `funding` column only accepts Free, Discount or Free trial. It is filled from the snapshot tags (Free, Discount, Trial). When the tags do not give exactly one of those, it stays empty and the page says "See official source". These rows will not appear under the Offer filter.\n')
for reason, items in funding_blank.items():
    md.append(f'### {reason} ({len(items)})\n')
    md.append('First 15 shown.\n')
    md.append(table(items[:15], 'Offer') + '\n')

md.append('## Column mapping\n')
md.append('''| Snapshot column | Upload column | What was done |
|---|---|---|
| `id` | `opportunity_id` | Kept exactly. |
| `name` | `provider`, and start of `title` | Title is `name: offer`, because the offer text alone does not say who it is from. |
| `offer` | `benefits`, and end of `title` | Wording untouched. |
| `description` | `summary` | Wording untouched. |
| `claim_url` | `link` | Kept exactly, after the checks above. |
| `location` | `location` | Kept exactly. "Limited Countries" and "Limited Universities" also add one eligibility line. |
| `tags` | `funding` | Free -> Free, Discount -> Discount, Trial -> Free trial. Nothing else is mapped. |
| `github_offer` | `description` | True adds the line "Also listed in the GitHub Student Developer Pack." The snapshot says so; it was not checked. |
| `verification_status` | `published` | Only "verified" rows are published = yes. |
| `urgency_badge` | `deadline` | Only a full date (day, month and year) becomes a deadline. Anything else is flagged, never guessed. |
| `category_main`, `category_sub`, `categories` | not used | No matching field. A category filter needs a new database field (request sent to Agent 1). |
| `slug` | not used | The importer makes its own slug from the title. |
| `source` | not used | Always "StudentOffers". |
| (none) | `image_url`, `coupon_code`, `level`, `how_to_apply`, `featured` | Empty or "no": the snapshot has no such data. |
''')
md.append('## Questions for Barnabas\n')
md.append('''1. Referral and affiliate links: should any of the held-out rows go in with the code removed? The code belongs to whoever earns from it, and visitors would not know. I did not strip anything.
2. Rows with no link: do you have the official links? There are many well-known names among them.
3. "Credit" rows have no matching funding word. Should they be "Free", "Free trial", or stay empty?
4. The snapshot has no "last checked" date. The honesty rules ask for one on real listings. Is there a date for the snapshot I can record?
5. Student-discount sites (Student Beans, UNiDAYS) and Instagram pages are not the provider's own site. Keep them, or hold them out?
''')
NOTES.write_text('\n'.join(md), encoding='utf-8')

print(f'in={n_in} held={n_held} out={len(out_rows)} published={n_pub} drafts={n_draft}')
for reason, items in held.items():
    print(f'  held: {reason}: {len(items)}')
