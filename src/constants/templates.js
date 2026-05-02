/**
 * Invoice PDF Templates
 * HTML/CSS templates for PDF generation
 */

export const TEMPLATE_IDS = {
  MODERN: 'modern',
  CLASSIC: 'classic',
  MINIMAL: 'minimal',
};

export const TEMPLATES = [
  {
    id: TEMPLATE_IDS.MODERN,
    name: 'Modern',
    description: 'Clean, contemporary design with accent colors',
    preview: 'modern_preview',
  },
  {
    id: TEMPLATE_IDS.CLASSIC,
    name: 'Classic',
    description: 'Traditional professional invoice layout',
    preview: 'classic_preview',
  },
  {
    id: TEMPLATE_IDS.MINIMAL,
    name: 'Minimal',
    description: 'Simple, elegant design with minimal elements',
    preview: 'minimal_preview',
  },
];

export const DEFAULT_TEMPLATE = TEMPLATE_IDS.MODERN;
