import { Machinery, MachineryType } from '@/types';

/**
 * Verified high-quality agricultural machinery imagery for each equipment category.
 * Strictly features actual agricultural tractors, combine harvesters, power tillers, and implements.
 */
export const MACHINERY_FALLBACK_IMAGES: Record<string, string> = {
  'Tractor': 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80',
  'Paddy Harvester': 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=800&q=80',
  'Power Tiller': 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80',
  'Rotavator': 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80',
  'Sprayer': 'https://images.unsplash.com/photo-1584679109597-c656b19974c9?auto=format&fit=crop&w=800&q=80',
  'Laser Leveller': 'https://images.unsplash.com/photo-1617576683096-00fc8eecb3af?auto=format&fit=crop&w=800&q=80',
  'Transplanter': 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80',
  'Rotary Slasher': 'https://images.unsplash.com/photo-1590682680695-43b964a3ae17?auto=format&fit=crop&w=800&q=80',
  'Groundnut Harvester': 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80',
  'Thresher': 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=800&q=80',
  'Other': 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=800&q=80'
};

/**
 * List of known invalid / incorrect image URLs that previously showed people, suits, produce, or empty fields
 */
const INVALID_LEGACY_URLS = new Set([
  'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1589923188651-268a9f65e321?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80', // Tomato photo previously on tractors
  'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=600&q=80', // Empty landscape field
  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80', // Desk/books
  'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&w=600&q=80'
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

  // Check specific model names and equipment types
  if (name.includes('harvester') || name.includes('kubota') || name.includes('claas') || type === 'Paddy Harvester') {
    return MACHINERY_FALLBACK_IMAGES['Paddy Harvester'];
  }
  if (name.includes('power tiller') || name.includes('tiller') || name.includes('vst') || type === 'Power Tiller') {
    return MACHINERY_FALLBACK_IMAGES['Power Tiller'];
  }
  if (name.includes('sprayer') || type === 'Sprayer') {
    return MACHINERY_FALLBACK_IMAGES['Sprayer'];
  }
  if (name.includes('transplanter') || name.includes('yanmar') || type === 'Transplanter') {
    return MACHINERY_FALLBACK_IMAGES['Transplanter'];
  }
  if (name.includes('leveller') || name.includes('laser') || type === 'Laser Leveller') {
    return MACHINERY_FALLBACK_IMAGES['Laser Leveller'];
  }
  if (name.includes('slasher') || type === 'Rotary Slasher') {
    return MACHINERY_FALLBACK_IMAGES['Rotary Slasher'];
  }
  if (name.includes('thresher') || type === 'Thresher') {
    return MACHINERY_FALLBACK_IMAGES['Thresher'];
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
