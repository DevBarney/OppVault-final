import Link from 'next/link';
import { SearchIcon } from './Icons';
import type { Category } from '../lib/categories';

type Props = {
  category: Category;
  levels: string[];
  locations: string[];
  values: { q?: string; funding?: string; level?: string; location?: string };
};

/** A plain GET form, so searching and filtering work without any JavaScript. */
export default function Filters({ category, levels, locations, values }: Props) {
  const active = Boolean(values.q || values.funding || values.level || values.location);
  return (
    <form className="filters" method="get" action={`/${category.slug}`} role="search" aria-label={`Search ${category.label}`}>
      <label className="filters__search">
        <span className="visually-hidden">Search {category.label}</span>
        <SearchIcon className="filters__icon" />
        <input type="search" name="q" defaultValue={values.q ?? ''} placeholder={`Search ${category.label.toLowerCase()}`} maxLength={60} />
      </label>
      <Select name="funding" label={category.fundingLabel} options={category.fundingOptions} value={values.funding} />
      <Select name="level" label="Level" options={levels} value={values.level} />
      <Select name="location" label="Location" options={locations} value={values.location} />
      <div className="filters__actions">
        <button className="btn btn--primary btn--sm" type="submit">
          <span>Apply</span>
        </button>
        {active ? (
          <Link className="filters__clear" href={`/${category.slug}`}>
            Clear
          </Link>
        ) : null}
      </div>
    </form>
  );
}

function Select({ name, label, options, value }: { name: string; label: string; options: string[]; value?: string }) {
  return (
    <label className="filters__select">
      <span className="filters__label">{label}</span>
      <select name={name} defaultValue={value ?? ''}>
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
