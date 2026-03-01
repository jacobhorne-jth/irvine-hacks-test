export type FlagType = 'urgent' | 'watch' | 'opportunity' | 'negotiate';

export interface PropertyAnnotation {
  flag?: { type: FlagType; reason: string; timestamp: string };
  note?: { text: string; timestamp: string };
}

export type PortfolioAnnotations = Record<string, PropertyAnnotation>;

export const ANNOTATIONS_KEY = 'prop_intel_ai_annotations';

export const FLAG_COLORS: Record<FlagType, string> = {
  urgent:      '#EF4444',
  watch:       '#F97316',
  opportunity: '#22C55E',
  negotiate:   '#F5A11C',
};

export const FLAG_LABELS: Record<FlagType, string> = {
  urgent:      'URGENT',
  watch:       'WATCH',
  opportunity: 'OPPORTUNITY',
  negotiate:   'NEGOTIATE',
};
