export const formatPrice = (price, currency = 'INR') => {
  const currencyFormats = {
    USD: { locale: 'en-US', currency: 'USD', symbol: '$' },
    EUR: { locale: 'de-DE', currency: 'EUR', symbol: '€' },
    GBP: { locale: 'en-GB', currency: 'GBP', symbol: '£' },
    JPY: { locale: 'ja-JP', currency: 'JPY', symbol: '¥' },
    CAD: { locale: 'en-CA', currency: 'CAD', symbol: 'C$' },
    AUD: { locale: 'en-AU', currency: 'AUD', symbol: 'A$' },
    INR: { locale: 'en-IN', currency: 'INR', symbol: '₹' },
  };
  
  const format = currencyFormats[currency] || currencyFormats.INR;
  
  return new Intl.NumberFormat(format.locale, {
    style: 'currency',
    currency: format.currency,
    minimumFractionDigits: 0
  }).format(price || 0);
};