// Checks a CSV exactly the way the admin page does, so you find problems before Barnabas uploads it.
//
//   npm run check:csv -- content/csv/scholarships.csv scholarships
//
// The second argument is one of: scholarships, fellowships, grants, courses, events, student-offers,
// opportunities (mixed, needs a category column), blog.
// Exit code 0 = every row is ready to import, 1 = there are problems, 2 = wrong usage.

import { readFileSync } from 'node:fs';
import { isKind } from '../lib/admin/kinds';
import { checkOpportunities, checkPosts, templateFor } from '../lib/admin/validate';

const [file, kind] = process.argv.slice(2);

if (!file || !kind || !isKind(kind)) {
  console.error('Usage: npm run check:csv -- <file.csv> <scholarships|fellowships|grants|courses|events|student-offers|opportunities|blog>');
  process.exit(2);
}

const text = readFileSync(file, 'utf8');
const result = kind === 'blog' ? checkPosts(text) : checkOpportunities(text, kind);

console.log(`Template columns for ${kind}: ${templateFor(kind).headers.join(', ')}`);
if (result.fileError) {
  console.error(`\nFILE PROBLEM: ${result.fileError}`);
  process.exit(1);
}
console.log(`\nRows read: ${result.total}   ready: ${result.rows.length}   with problems: ${result.issues.length}`);
if (result.unknownColumns.length) console.log(`Columns the importer will IGNORE: ${result.unknownColumns.join(', ')}`);
for (const i of result.issues.slice(0, 100)) console.log(`  row ${i.line}: ${i.message}`);
if (result.issues.length > 100) console.log(`  ...and ${result.issues.length - 100} more`);
const drafts = result.rows.filter((r) => ('published' in r.data ? r.data.published === false : false)).length;
if (drafts) console.log(`${drafts} ready row(s) are marked published = no (drafts).`);
process.exit(result.issues.length === 0 ? 0 : 1);
