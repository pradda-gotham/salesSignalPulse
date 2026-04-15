import { DealDossier, AuditablePrice, PriceSource, CostEstimation, CostLineItem } from '../types';

/**
 * Extract the numeric value from a field that may be a plain number (legacy)
 * or an AuditablePrice object (new format).
 */
export function priceValue(field: number | AuditablePrice | undefined): number {
  if (field === undefined || field === null) return 0;
  if (typeof field === 'number') return field;
  return field.value;
}

/**
 * Extract the source from a field that may be a plain number or AuditablePrice.
 */
export function priceSource(field: number | AuditablePrice | undefined): PriceSource {
  if (field === undefined || field === null) return 'ai_estimate';
  if (typeof field === 'number') return 'ai_estimate';
  return field.source;
}

/**
 * Extract the confidence from a field that may be a plain number or AuditablePrice.
 */
export function priceConfidence(field: number | AuditablePrice | undefined): number {
  if (field === undefined || field === null) return 0;
  if (typeof field === 'number') return 30;
  return field.confidence;
}

/**
 * Extract the sourceDetail from a field that may be a plain number or AuditablePrice.
 */
export function priceDetail(field: number | AuditablePrice | undefined): string {
  if (field === undefined || field === null) return '';
  if (typeof field === 'number') return 'Legacy AI-generated estimate';
  return field.sourceDetail || '';
}

/**
 * Wrap a plain number into an AuditablePrice with ai_estimate source.
 */
export function wrapAsAiEstimate(value: number, detail?: string): AuditablePrice {
  return {
    value,
    source: 'ai_estimate',
    confidence: 40,
    sourceDetail: detail || 'AI-generated estimate',
  };
}

/**
 * Wrap a catalog price into an AuditablePrice.
 */
export function wrapAsCatalog(value: number, sku: string, unit: string): AuditablePrice {
  return {
    value,
    source: 'catalog',
    confidence: 100,
    sourceDetail: `Catalog SKU ${sku} @ $${value}/${unit}`,
  };
}

/**
 * Wrap a rate card price into an AuditablePrice.
 */
export function wrapAsRateCard(value: number, description: string, unit: string): AuditablePrice {
  return {
    value,
    source: 'rate_card',
    confidence: 95,
    sourceDetail: `Rate card: ${description} @ $${value}/${unit}`,
  };
}

/**
 * Normalize a dossier loaded from DB (which may be in legacy format)
 * to ensure all pricing fields are consistently accessible.
 * This does NOT convert plain numbers to AuditablePrice objects —
 * it only ensures the structure is valid. Use priceValue() to read values.
 */
export function normalizeDossier(raw: any): DealDossier {
  if (!raw) return raw;

  // Ensure recommendedBundle items have lineTotal
  if (raw.recommendedBundle) {
    raw.recommendedBundle = raw.recommendedBundle.map((item: any) => ({
      ...item,
      lineTotal: item.lineTotal ?? (item.quantity * (
        typeof item.unitPrice === 'object' ? item.unitPrice.value :
        typeof item.unitPrice === 'number' ? item.unitPrice : 0
      )),
    }));
  }

  // Ensure pricingStrategy exists
  if (!raw.pricingStrategy) {
    raw.pricingStrategy = { logic: '', discount: 0, estimatedValue: 0 };
  } else {
    // FIX: AI occasionally hallucinates an absolute scalar discount dollar amount instead of a percentage %
    // If the discount value is absurdly large (e.g. > 100), convert it properly before UI tries to render it.
    let currentDiscount = 0;
    if (typeof raw.pricingStrategy.discount === 'number') {
      currentDiscount = raw.pricingStrategy.discount;
    } else if (raw.pricingStrategy.discount?.value) {
      currentDiscount = raw.pricingStrategy.discount.value;
    }

    if (currentDiscount > 100) {
      const subtotal = raw.recommendedBundle?.reduce((s: number, b: any) => s + (b.lineTotal || 0), 0) || 0;
      const truePercent = subtotal > 0 ? (currentDiscount / subtotal) * 100 : 0;
      const trueEst = subtotal - currentDiscount;

      if (typeof raw.pricingStrategy.discount === 'number') {
        raw.pricingStrategy.discount = truePercent;
      } else if (raw.pricingStrategy.discount && raw.pricingStrategy.discount.value !== undefined) {
        raw.pricingStrategy.discount.value = truePercent;
      }

      if (typeof raw.pricingStrategy.estimatedValue === 'number') {
        raw.pricingStrategy.estimatedValue = trueEst;
      } else if (raw.pricingStrategy.estimatedValue && raw.pricingStrategy.estimatedValue.value !== undefined) {
        raw.pricingStrategy.estimatedValue.value = trueEst;
      }
    }
  }

  return raw as DealDossier;
}

/**
 * Get the unitRate numeric value from a CostLineItem,
 * handling both legacy (number) and new (AuditablePrice) formats.
 */
export function lineItemRate(item: CostLineItem): number {
  return typeof item.unitRate === 'number' ? item.unitRate : item.unitRate.value;
}
