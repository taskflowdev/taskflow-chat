import { CatalogResponse } from '../../api/models/catalog-response';
import { CatalogEntryDto } from '../../api/models/catalog-entry-dto';
import { CategoryWithKeys } from '../../api/models/category-with-keys';

/**
 * Flattened search index item for settings
 * Optimized for fast client-side search
 */
export interface SettingsSearchIndexItem {
  /** Unique identifier for the setting */
  id: string;
  /** Setting key (e.g., 'theme') */
  key: string;
  /** Category key (e.g., 'appearance') */
  categoryKey: string;
  /** Category display name */
  categoryLabel: string;
  /** Group name if available */
  group: string;
  /** Setting label */
  label: string;
  /** Setting summary */
  summary?: string;
  /** Setting description */
  description?: string;
  /** Setting markdown description */
  markdownDescription?: string;
  /** Setting tags */
  tags: string[];
  /** Aliases extracted from options metadata */
  aliases: string[];
  /** Whether the setting is disabled */
  disabled: boolean;
  /** Whether the setting is admin-only */
  adminOnly: boolean;
  /** Whether the setting is deprecated */
  deprecated: boolean;
  /** Combined searchable text (pre-computed for performance) */
  searchableText: string;
}

/**
 * Search result with score
 */
export interface SettingsSearchResult extends SettingsSearchIndexItem {
  /** Match score (higher is better) */
  score: number;
  /** Which fields matched */
  matchedFields: string[];
}

/**
 * Build a search index from catalog data
 * Memoized for performance
 */
export function buildSearchIndex(catalog: CatalogResponse | null): SettingsSearchIndexItem[] {
  if (!catalog || !catalog.categories) {
    return [];
  }

  const index: SettingsSearchIndexItem[] = [];

  for (const category of catalog.categories) {
    if (!category.keys || !category.key) {
      continue;
    }

    const categoryKey = category.key;
    const categoryLabel = category.displayName || category.key;

    for (const setting of category.keys) {
      if (!setting.key) {
        continue;
      }

      // Extract aliases from options metadata
      const aliases: string[] = [];
      if (setting.options) {
        for (const option of setting.options) {
          if (option.meta && option.meta['aliases']) {
            const optionAliases = option.meta['aliases'];
            if (Array.isArray(optionAliases)) {
              aliases.push(...optionAliases);
            } else if (typeof optionAliases === 'string') {
              aliases.push(optionAliases);
            }
          }
        }
      }

      // Build searchable text (lowercase, combined)
      const searchableText = buildSearchableText({
        label: setting.label || '',
        summary: setting.summary || '',
        description: setting.description || '',
        markdownDescription: setting.markdownDescription || '',
        tags: setting.tags || [],
        aliases,
        categoryLabel,
        group: setting.group || ''
      });

      index.push({
        id: `${categoryKey}.${setting.key}`,
        key: setting.key,
        categoryKey,
        categoryLabel,
        group: setting.group || '',
        label: setting.label || setting.key,
        summary: setting.summary || undefined,
        description: setting.description || undefined,
        markdownDescription: setting.markdownDescription || undefined,
        tags: setting.tags || [],
        aliases,
        disabled: setting.disabled || false,
        adminOnly: setting.ui?.adminOnly || false,
        deprecated: setting.deprecated || false,
        searchableText
      });
    }
  }

  return index;
}

/**
 * Build searchable text from setting fields
 * Combines all searchable content into a single lowercase string
 */
function buildSearchableText(fields: {
  label: string;
  summary: string;
  description: string;
  markdownDescription: string;
  tags: string[];
  aliases: string[];
  categoryLabel: string;
  group: string;
}): string {
  const parts = [
    fields.label,
    fields.summary,
    fields.description,
    fields.markdownDescription,
    ...fields.tags,
    ...fields.aliases,
    fields.categoryLabel,
    fields.group
  ];

  return parts
    .filter(p => p && p.trim())
    .join(' ')
    .toLowerCase();
}

/**
 * Search settings index with weighted scoring
 * Returns sorted results by score (highest first)
 */
export function searchSettings(
  query: string,
  index: SettingsSearchIndexItem[],
  maxResults: number = 20
): SettingsSearchResult[] {
  if (!query || !query.trim()) {
    return [];
  }

  const normalizedQuery = query.trim().toLowerCase();
  const queryTerms = normalizedQuery.split(/\s+/);

  const results: SettingsSearchResult[] = [];

  for (const item of index) {
    const { score, matchedFields } = calculateScore(item, normalizedQuery, queryTerms);

    if (score > 0) {
      results.push({
        ...item,
        score,
        matchedFields
      });
    }
  }

  // Sort by score (descending)
  results.sort((a, b) => b.score - a.score);

  // Return top N results
  return results.slice(0, maxResults);
}

/**
 * Calculate match score for a setting
 * Uses weighted scoring based on field importance
 */
function calculateScore(
  item: SettingsSearchIndexItem,
  query: string,
  queryTerms: string[]
): { score: number; matchedFields: string[] } {
  let score = 0;
  const matchedFields: string[] = [];

  // Weight priorities:
  // 1. Label (highest)
  // 2. Tags / Aliases
  // 3. Summary
  // 4. Description / MarkdownDescription
  // 5. Category / Group (lowest)

  const labelLower = item.label.toLowerCase();
  const summaryLower = (item.summary || '').toLowerCase();
  const descriptionLower = (item.description || '').toLowerCase();
  const markdownDescriptionLower = (item.markdownDescription || '').toLowerCase();
  const categoryLabelLower = item.categoryLabel.toLowerCase();
  const groupLower = item.group.toLowerCase();

  // Check if the full query matches anywhere
  const queryMatchesLabel = labelLower.includes(query);
  const queryMatchesSummary = summaryLower.includes(query);
  const queryMatchesDescription = descriptionLower.includes(query);
  const queryMatchesMarkdownDescription = markdownDescriptionLower.includes(query);
  const queryMatchesCategoryLabel = categoryLabelLower.includes(query);
  const queryMatchesGroup = groupLower.includes(query);

  // Label matches (highest weight: 100)
  if (labelLower === query) {
    score += 100; // Exact match
    matchedFields.push('label-exact');
  } else if (labelLower.startsWith(query)) {
    score += 80; // Starts with
    matchedFields.push('label-prefix');
  } else if (queryMatchesLabel) {
    score += 60; // Contains
    matchedFields.push('label');
  }

  // Tags / Aliases (weight: 70)
  for (const tag of item.tags) {
    const tagLower = tag.toLowerCase();
    if (tagLower === query) {
      score += 70;
      matchedFields.push('tag-exact');
      break;
    } else if (tagLower.includes(query)) {
      score += 50;
      matchedFields.push('tag');
      break;
    }
  }

  for (const alias of item.aliases) {
    const aliasLower = alias.toLowerCase();
    if (aliasLower === query) {
      score += 70;
      matchedFields.push('alias-exact');
      break;
    } else if (aliasLower.includes(query)) {
      score += 50;
      matchedFields.push('alias');
      break;
    }
  }

  // Summary (weight: 40)
  if (summaryLower === query) {
    score += 40;
    matchedFields.push('summary-exact');
  } else if (queryMatchesSummary) {
    score += 30;
    matchedFields.push('summary');
  }

  // Description (weight: 20)
  if (queryMatchesDescription) {
    score += 20;
    matchedFields.push('description');
  }

  // Markdown Description (weight: 20)
  if (queryMatchesMarkdownDescription) {
    score += 20;
    matchedFields.push('markdownDescription');
  }

  // Category / Group (weight: 10)
  if (categoryLabelLower === query) {
    score += 15;
    matchedFields.push('category-exact');
  } else if (queryMatchesCategoryLabel) {
    score += 10;
    matchedFields.push('category');
  }

  if (groupLower === query) {
    score += 15;
    matchedFields.push('group-exact');
  } else if (queryMatchesGroup) {
    score += 10;
    matchedFields.push('group');
  }

  // Multi-term matching: all terms must match somewhere
  if (queryTerms.length > 1) {
    const allTermsMatch = queryTerms.every(term =>
      item.searchableText.includes(term)
    );

    if (!allTermsMatch) {
      // If not all terms match, reduce score significantly or return 0
      score = 0;
      matchedFields.length = 0;
    } else {
      // Bonus for matching all terms
      score += 5;
    }
  }

  return { score, matchedFields };
}
