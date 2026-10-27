#!/usr/bin/env python3
"""Convert a StudentOffers snapshot CSV into the OppVault admin upload format.

    python3 content/csv/convert-student-offers.py [snapshot.csv] [--snapshot-at 2026-10-27T02:10:28Z]

Default input:  content/csv/source/student-offers-original.csv
Writes:         content/csv/student-offers.csv                (upload this on /admin, type "Student offers")
                content/csv/student-offers-missing-links.csv  (rows with no link: fill in, see below)
                content/csv/student-offers-notes.md           (read this first)
                content/csv/student-offers.meta.json          (snapshot_at and counts)

Policy (decided by Barnabas, 2026-10-27):
1. The original snapshot is kept untouched in content/csv/source/. In the upload, `link` has affiliate and
   tracking parameters removed (ref, aff, affiliate, referral, partner, utm_*, and similar). Product codes
   such as code= stay. No link is ever invented: a cleaned link is the same address minus those parameters.
2. A row with no link stays out of the upload and goes to student-offers-missing-links.csv. To add one, put an
   official link in content/csv/source/student-offers-curated-links.csv (columns: opportunity_id, link) and
   re-run. Those links go through the same checks.
3. "Credit" is not forced into Free. For rows tagged Credit, `funding` comes from the offer text: "trial" ->
   Free trial; "free" or credit given "on signup" -> Free; anything else stays empty.
4. snapshot_at is recorded in the notes and the meta file.
5. Student Beans and UNiDAYS pages are kept. Instagram pages are not claim links and are left out.
   Redirects through workers.dev are left out until someone resolves them to the final address.

Other rules: nothing is invented, a missing value stays empty. A row is a draft (published = no) when the snapshot
does not mark it "verified", when its end date cannot be worked out, or when removing an affiliate code may change
what the visitor gets. Ids stay the same, so a re-upload updates listings.

Owner: Agent 5. Standard library only.
"""
import csv
import json
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
from urllib.parse import parse_qsl, urlparse, urlunparse

HERE = Path(__file__).resolve().parent
args = [a for a in sys.argv[1:]]
SNAPSHOT_AT = ''
if '--snapshot-at' in args:
    i = args.index('--snapshot-at')
    SNAPSHOT_AT = args[i + 1]
    del args[i:i + 2]
SRC = Path(args[0]) if args else HERE / 'source' / 'student-offers-original.csv'
CURATED = HERE / 'source' / 'student-offers-curated-links.csv'
OUT = HERE / 'student-offers.csv'
MISSING = HERE / 'student-offers-missing-links.csv'
NOTES = HERE / 'student-offers-notes.md'
META = HERE / 'student-offers.meta.json'

# Exact column order of the admin template (see `npm run check:csv` output, "Template columns").
HEADERS = ['opportunity_id', 'title', 'provider', 'summary', 'description', 'link', 'image_url', 'coupon_code',
           'location', 'level', 'funding', 'deadline', 'eligibility', 'benefits', 'how_to_apply', 'featured', 'published']

# Parameters that identify who gets paid or what campaign sent you. Removed from `link`.
AFFILIATE_KEY = re.compile(r'^(aff|affiliate|ref|referral|referrer|partner|pid|c|is_retargeting|deep_link_value|af_.*)$', re.I)
TRACKER_KEY = re.compile(r'^(utm_.*|source)$', re.I)
REDIRECT_HOSTS = ('workers.dev',)
SOCIAL_HOSTS = ('instagram.com',)
KEPT_DISCOUNT_SITES = ('studentbeans.com', 'myunidays.com', 'unidays.com')
OTHER_THIRD_PARTY = ('studentappcentre.com',)


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
    """YYYY-MM-DD only when the text holds a full 'Mon D, YYYY' date."""
    m = re.search(r'([A-Za-z]{3,9})\.?\s+(\d{1,2}),\s*(\d{4})', text)
    if not m:
        return None
    for fmt in ('%B %d %Y', '%b %d %Y'):
        try:
            return datetime.strptime(f'{m.group(1)} {m.group(2)} {m.group(3)}', fmt).strftime('%Y-%m-%d')
        except ValueError:
            continue
    return None


def strip_params(url: str):
    """Return (cleaned_url, affiliate_keys_removed, tracker_keys_removed). Keeps every other parameter as written."""
    p = urlparse(url)
    kept, aff, trk = [], [], []
    for part in p.query.split('&') if p.query else []:
        key = part.split('=', 1)[0]
        if AFFILIATE_KEY.match(key):
            aff.append(key)
        elif TRACKER_KEY.match(key):
            trk.append(key)
        else:
            kept.append(part)
    cleaned = urlunparse(p._replace(query='&'.join(kept)))
    return cleaned, aff, trk


def funding_from_tags(tags: set, offer: str):
    found = [w for w in ('Free', 'Discount', 'Trial') if w in tags]
    if len(found) == 1:
        return {'Free': 'Free', 'Discount': 'Discount', 'Trial': 'Free trial'}[found[0]], ''
    if len(found) > 1:
        return '', 'more than one of Free/Discount/Trial in the tags'
    if 'Credit' in tags:
        if re.search(r'\btrial\b', offer, re.I):
            return 'Free trial', ''
        if re.search(r'\bfree\b', offer, re.I) or re.search(r'\b(on|at|upon)\s+sign\s?-?up\b', offer, re.I):
            return 'Free', ''
        return '', 'Credit offer whose text does not say free, trial or on signup'
    return '', 'no Free/Discount/Trial/Credit tag'


def norm_url(u: str) -> str:
    return u.strip().lower().rstrip('/')


rows = list(csv.DictReader(open(SRC, newline='', encoding='utf-8-sig')))
curated = {}
if CURATED.exists():
    for c in csv.DictReader(open(CURATED, newline='', encoding='utf-8-sig')):
        if clean(c.get('link', '')):
            curated[clean(c['opportunity_id'])] = clean(c['link'])

held = defaultdict(list)       # reason -> [(id, name, detail)]
drafts = defaultdict(list)
flags = defaultdict(list)
funding_blank = defaultdict(list)
cleaned_links = []             # (id, name, original, cleaned)
missing_rows = []

# Pass 1: rows that cannot be uploaded.
candidates = []
for r in rows:
    rid, name = clean(r['id']), clean(r['name'])
    link = clean(r['claim_url']) or curated.get(rid, '')
    from_curated = bool(not clean(r['claim_url']) and link)
    if not link:
        held['No link in the snapshot (link_status = missing)'].append((rid, name, clean(r['offer'])))
        missing_rows.append({'opportunity_id': rid, 'provider': name, 'offer': clean(r['offer']), 'tags': clean(r['tags']),
                             'snapshot_status': clean(r['verification_status']), 'link_status': 'missing', 'link': '', 'where_the_link_came_from': ''})
        continue
    p = urlparse(link)
    if p.scheme != 'https' or not p.netloc:
        held['Link is not a full https:// address'].append((rid, name, link))
        continue
    host = p.netloc.lower().replace('www.', '')
    if any(host.endswith(h) for h in SOCIAL_HOSTS):
        held['Instagram page, not a claim link (link_type = social)'].append((rid, name, link))
        continue
    if any(host.endswith(h) for h in REDIRECT_HOSTS):
        held['Third-party redirect: needs resolving to the final address'].append((rid, name, link))
        continue
    cleaned, aff, trk = strip_params(link)
    r = dict(r)
    r['_link'], r['_aff'], r['_trk'], r['_orig'], r['_curated'] = cleaned, aff, trk, link, from_curated
    candidates.append(r)

# Pass 2: exact duplicates (same name and same cleaned link). Keep the lowest id.
seen = {}
kept = []
for r in sorted(candidates, key=lambda x: int(x['id'])):
    key = (clean(r['name']).lower(), norm_url(r['_link']))
    if key in seen:
        held['Duplicate of another row (same name and same link)'].append((clean(r['id']), clean(r['name']), f'kept id {seen[key]}'))
        continue
    seen[key] = clean(r['id'])
    kept.append(r)

link_use = Counter(norm_url(r['_link']) for r in kept)
out_rows = []
for r in kept:
    rid, name, offer = clean(r['id']), clean(r['name']), clean(r['offer'])
    link = r['_link']
    host = urlparse(link).netloc.lower().replace('www.', '')
    tags = {t.strip() for t in r['tags'].split(';') if t.strip()}
    funding, why = funding_from_tags(tags, offer)
    if not funding:
        funding_blank[why].append((rid, name, offer))

    eligibility = []
    loc = clean(r['location']) or 'Global'
    if loc == 'Limited Countries':
        eligibility.append('Available in selected countries only. Check the provider\u2019s page for the list.')
    if loc == 'Limited Universities':
        eligibility.append('Available at selected universities only. Check the provider\u2019s page for the list.')
    description = 'Also listed in the GitHub Student Developer Pack.' if r['github_offer'].strip().lower() == 'true' else ''

    draft_reasons = []
    vs = clean(r['verification_status'])
    if vs != 'verified':
        draft_reasons.append(('Snapshot status is not "verified"', vs or 'blank'))
    deadline = ''
    u = urgency_text(r['urgency_badge'])
    if u:
        d = explicit_date(u)
        if d:
            deadline = d
        elif re.search(r'closed', u, re.I):
            draft_reasons.append((f'Snapshot says "{u}"', u))
        elif re.search(r'\b(ends|expires)\b', u, re.I):
            draft_reasons.append((f'End date "{u}" has no full date (day, month and year)', u))
    if r['_link'] != r['_orig']:
        cleaned_links.append((rid, name, r['_orig'], r['_link'], r['_aff'], r['_trk']))
        if r['_aff']:
            draft_reasons.append(('Affiliate or referral code removed from the link: check the offer still works without it', ', '.join(sorted(set(r['_aff'])))))
    if r['_curated']:
        flags['Link came from your curated list'].append((rid, name, host))
    for why_, detail in draft_reasons:
        drafts[why_].append((rid, name, detail))
    published = 'no' if draft_reasons else 'yes'

    if host.endswith(KEPT_DISCOUNT_SITES):
        flags['Student Beans or UNiDAYS page (kept, as decided)'].append((rid, name, host))
    if host.endswith(OTHER_THIRD_PARTY):
        flags['Link is on another third-party student site (not decided yet)'].append((rid, name, host))
    if link_use[norm_url(link)] > 1:
        flags['Link is shared with other rows (not specific to this offer)'].append((rid, name, host))
    path = urlparse(link).path.strip('/')
    if r['_link'] != r['_orig'] and not path:
        flags['Cleaned link is now just a homepage'].append((rid, name, link))

    out_rows.append({
        'opportunity_id': rid,
        'title': f'{name}: {offer}' if offer else name,
        'provider': name, 'summary': clean(r['description']), 'description': description,
        'link': link, 'image_url': '', 'coupon_code': '',
        'location': loc, 'level': '', 'funding': funding, 'deadline': deadline,
        'eligibility': ' | '.join(eligibility), 'benefits': offer, 'how_to_apply': '',
        'featured': 'no', 'published': published,
    })

with open(OUT, 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=HEADERS, lineterminator='\n')
    w.writeheader()
    w.writerows(out_rows)
with open(MISSING, 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=['opportunity_id', 'provider', 'offer', 'tags', 'snapshot_status', 'link_status', 'link', 'where_the_link_came_from'], lineterminator='\n')
    w.writeheader()
    w.writerows(missing_rows)

n_in, n_held = len(rows), sum(len(v) for v in held.values())
n_pub = sum(1 for r in out_rows if r['published'] == 'yes')
n_draft = len(out_rows) - n_pub
ids = sorted(int(r['id']) for r in rows)
gaps = len(set(range(ids[0], ids[-1] + 1)) - set(ids))
fund_counts = Counter(r['funding'] or '(empty)' for r in out_rows)
META.write_text(json.dumps({'snapshot_at': SNAPSHOT_AT or None, 'source_file': SRC.name, 'rows_in_snapshot': n_in,
                            'rows_in_upload': len(out_rows), 'published': n_pub, 'drafts': n_draft, 'left_out': n_held,
                            'missing_links': len(missing_rows)}, indent=2) + '\n', encoding='utf-8')


def table(items, third='Detail'):
    lines = [f'| id | name | {third} |', '|---|---|---|']
    for i, n, x in items:
        lines.append(f'| {i} | {n} | {str(x).replace("|", "/")} |')
    return '\n'.join(lines)


md = ['# Student offers: conversion notes\n',
      f'Generated by `content/csv/convert-student-offers.py` from `{SRC.name}`. Re-run it on any new snapshot; ids stay the same, so a re-upload updates listings.\n',
      f'**Snapshot taken:** {SNAPSHOT_AT or "not recorded"} (as given by Barnabas, from the file timestamps when `/api/offers` was pulled).\n',
      '## Numbers\n',
      f'- Rows in the snapshot: {n_in}',
      f'- Rows left out of the upload: {n_held} (reasons below)',
      f'- Rows in `student-offers.csv`: {len(out_rows)} ({n_pub} published = yes, {n_draft} published = no)',
      f'- Funding in the upload: ' + ', '.join(f'{k} {v}' for k, v in fund_counts.most_common()),
      f'- Snapshot ids run from {ids[0]} to {ids[-1]} with {gaps} numbers missing. Nothing was done about that.\n',
      '## Rows left out of the upload\n',
      'These are not in `student-offers.csv`. Nothing was guessed to rescue them.\n']
for reason, items in held.items():
    md.append(f'### {reason} ({len(items)})\n')
    if reason.startswith('No link'):
        md.append('Listed in `student-offers-missing-links.csv` with an empty `link` column. Fill it from an official student page, copy the file to `content/csv/source/student-offers-curated-links.csv` (keep only `opportunity_id` and `link`), and re-run. Do not use a vendor homepage unless you have checked it.\n')
        md.append('| id | name | offer |\n|---|---|---|\n' + '\n'.join(f'| {i} | {n} | {x.replace("|", "/")} |' for i, n, x in items) + '\n')
    else:
        if reason.startswith('Third-party redirect'):
            md.append('This sandbox cannot reach these addresses, so I could not resolve them. Open each in a browser and send me the final address.\n')
        md.append(table(items) + '\n')

md.append('## Links cleaned\n')
md.append('`link` has these parameters removed. The original is in `source/student-offers-original.csv`. A `code=` parameter was kept.\n')
md.append('| id | name | original | in the upload | removed |\n|---|---|---|---|---|')
for i, n, o, c, aff, trk in cleaned_links:
    md.append(f'| {i} | {n} | `{o}` | `{c}` | {", ".join(sorted(set(aff + trk)))} |')
md.append('')

md.append('## Rows in the upload as drafts (published = no)\n')
md.append('They are in the file so you can review them on the admin page and switch them on. Nothing shows to the public until published is yes.\n')
for reason, items in drafts.items():
    md.append(f'### {reason} ({len(items)})\n')
    md.append(table(items, 'Detail') + '\n')

md.append('## Published = yes, but worth a look\n')
for reason, items in flags.items():
    md.append(f'### {reason} ({len(items)})\n')
    md.append(table(items) + '\n')

md.append('## Funding left empty\n')
md.append('The `funding` column accepts Free, Discount or Free trial. It comes from the snapshot tags (Free, Discount, Trial). For rows tagged Credit it comes from the offer text: "trial" gives Free trial, "free" or "on signup" gives Free. Anything else stays empty and the page says "See official source". These rows will not appear under the Offer filter. `offer_type` (free, free trial, discount, credit) would keep Credit as its own value; a request is with Agent 1.\n')
for reason, items in funding_blank.items():
    md.append(f'### {reason} ({len(items)})\n')
    md.append(table(items, 'Offer') + '\n')

md.append('## Column mapping\n')
md.append('''| Snapshot column | Upload column | What was done |
|---|---|---|
| `id` | `opportunity_id` | Kept exactly. |
| `name` | `provider`, and start of `title` | Title is `name: offer`, because the offer text alone does not say who it is from. |
| `offer` | `benefits`, and end of `title` | Wording untouched. |
| `description` | `summary` | Wording untouched. |
| `claim_url` | `link` | Affiliate and tracking parameters removed (see "Links cleaned"). Nothing else changed. |
| `location` | `location` | Kept exactly. "Limited Countries" and "Limited Universities" also add one eligibility line. |
| `tags`, `offer` | `funding` | Free -> Free, Discount -> Discount, Trial -> Free trial. Credit rows use the offer text (see above). |
| `github_offer` | `description` | True adds "Also listed in the GitHub Student Developer Pack." The snapshot says so; it was not checked. |
| `verification_status` | `published` | Only "verified" rows are published = yes. |
| `urgency_badge` | `deadline` | Only a full date (day, month and year) becomes a deadline. Anything else is flagged, never guessed. |
| `category_main`, `category_sub`, `categories` | not used | No matching field (request with Agent 1). |
| `slug`, `source` | not used | The importer makes its own slug. `source` is always "StudentOffers". |
| (none) | `image_url`, `coupon_code`, `level`, `how_to_apply`, `featured` | Empty or "no": the snapshot has no such data. |
''')
md.append('## Decisions recorded (Barnabas, 2026-10-27)\n')
md.append('''1. Strip affiliate and tracking parameters, keep product codes (for example MiniMax `code=`). Do not invent links.
2. Rows with no link stay empty until someone verifies a link from a second source.
3. "Credit" is not forced into Free. Funding comes from the offer text; `offer_type` is the proper fix.
4. Every export carries the snapshot time (this file and `student-offers.meta.json`).
5. Keep Student Beans and UNiDAYS pages. Instagram pages are not claim links. Redirects should be resolved to the final address.

Still open: the MiniMax `code=` value looks like it could be an invite code rather than a deal code. It was kept under rule 1. Please confirm.
''')
NOTES.write_text('\n'.join(md), encoding='utf-8')

print(f'in={n_in} held={n_held} out={len(out_rows)} published={n_pub} drafts={n_draft}')
for reason, items in held.items():
    print(f'  held: {reason}: {len(items)}')
print('  funding:', dict(fund_counts))
