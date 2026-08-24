import { Machinery, MachineryType } from '@/types';

/**
 * Verified high-quality agricultural machinery imagery for each equipment category.
 * Strictly features actual agricultural tractors, combine harvesters, power tillers, and implements.
 */
export const MACHINERY_FALLBACK_IMAGES: Record<string, string> = {
  'Tractor': 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80',
  'Paddy Harvester': 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80',
  'Power Tiller': 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80',
  'Rotavator': 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80',
  'Sprayer': 'https://images.unsplash.com/photo-1584441405886-bc91be61e56a?auto=format&fit=crop&w=800&q=80',
  'Other': 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=800&q=80'
};

/**
 * List of known invalid / incorrect image URLs that previously showed people, suits, or dumplings
 */
const INVALID_LEGACY_URLS = new Set([
  'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?auto=format&fit=crop&w=600&q=80'
]);

/**
 * Resolves the accurate machinery photo URL.
 * If machinery.image_url is missing or points to a known broken legacy URL,
 * it returns the dedicated image for the machinery's type/name.
 */
export function getMachineryImageUrl(machinery?: Partial<Machinery> | null): string {
  if (!machinery) {
    return MACHINERY_FALLBACK_IMAGES['Tractor'];
  }

  // If a valid custom image_url is provided and not one of the old broken placeholders
  if (machinery.image_url && !INVALID_LEGACY_URLS.has(machinery.image_url)) {
    return machinery.image_url;
  }

  const name = (machinery.name || '').toLowerCase();
  const type = machinery.type || 'Tractor';

  // Check specific model names
  if (name.includes('harvester') || name.includes('kubota') || type === 'Paddy Harvester') {
    return MACHINERY_FALLBACK_IMAGES['Paddy Harvester'];
  }
  if (name.includes('power tiller') || name.includes('tiller') || name.includes('vst') || type === 'Power Tiller') {
    return MACHINERY_FALLBACK_IMAGES['Power Tiller'];
  }
  if (name.includes('john deere') || name.includes('cultivator')) {
    return 'https://images.unsplash.com/photo-1584441405886-bc91be61e56a?auto=format&fit=crop&w=800&q=80';
  }
  if (name.includes('mahindra') || name.includes('rotavator') || type === 'Tractor') {
    return 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80';
  }

  return MACHINERY_FALLBACK_IMAGES[type] || MACHINERY_FALLBACK_IMAGES['Tractor'];
}

/**
 * Generates descriptive alt text matching the machinery
 */
export function getMachineryAltText(machinery?: Partial<Machinery> | null): string {
  if (!machinery) return 'Agricultural machinery';
  if (machinery.name) return machinery.name;
  return `${machinery.type || 'Farm'} equipment`;
}
