// src/lib/bnDate.js
// bn-BD locale-এর toLocaleDateString month:'short' বাংলায় সংক্ষিপ্ত রূপ
// দেয় ("আগ"), পূর্ণ নাম দেয় না। তাই নিজস্ব পূর্ণ মাসের নামের তালিকা।
const BN_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
];

export function toBnDigits(n) {
  return Number(n).toLocaleString('bn-BD');
}

// বছরের মতো সংখ্যায় হাজার-বিভাজক কমা লাগবে না (২০২৬, না ২,০২৬)
export function toBnDigitsPlain(n) {
  return Number(n).toLocaleString('bn-BD', { useGrouping: false });
}

// dateStr: 'YYYY-MM-DD' | Date. withYear=true -> "২০ আগস্ট ২০২৬", false -> "২০ আগস্ট"
export function formatBnDate(dateStr, withYear = true) {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const day = toBnDigits(d.getDate());
  const month = BN_MONTHS[d.getMonth()];
  if (!withYear) return `${day} ${month}`;
  return `${day} ${month} ${toBnDigitsPlain(d.getFullYear())}`;
}
