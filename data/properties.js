// The three SMC commercial centers. One object per property.
//
// Photos: drop files into src/img/<slug>/ using these names (jpg, png or webp):
//   hero      2400 x 1350  wide exterior / signature view (also used on cards)
//   feature   1600 x 1200  secondary shot for the Overview section
//   site-plan 1600 x 1200  leasing site plan image
// Brochure: put a PDF at src/docs/<slug>-brochure.pdf and a download button appears.
// Until a file exists, the site shows a branded placeholder.
//
// Availability rows: { suite, sf, use, available, placeholder }
//   sf: number or null ("Contact leasing" is shown when null)
//   placeholder: true marks a row leasing still needs to fill in.
// Keep only public-facing facts here; this repo is public.

module.exports = [
  {
    id: 'mchenry',
    slug: 'mchenry-village',
    name: 'McHenry Village',
    city: 'Modesto',
    state: 'CA',
    postalCode: '95350',
    type: 'Lifestyle Center',
    tagline: 'Where community and commerce come together.',
    cardLine: 'Grocery-anchored lifestyle center serving north Modesto.',
    address: ['McHenry Avenue & Roseburg Avenue', 'Modesto, CA 95350'],
    addressVerify: true, // public listings show 1700 McHenry Ave — confirm which to publish
    mapQuery: 'McHenry Village, McHenry Ave & Roseburg Ave, Modesto, CA 95350',
    glaSF: 150000,
    glaApprox: true,
    glaVerify: true,
    anchors: ['Sprouts Farmers Market', 'CVS Pharmacy'],
    description: [
      'McHenry Village is an open-air lifestyle center on McHenry Avenue, serving the north Modesto corridor. Sprouts Farmers Market and CVS Pharmacy anchor a mix of dining, wellness, fashion, and personal services.',
      'A longtime Modesto landmark, the center is where neighbors run weekly errands, meet for a meal, and gather for community events.',
    ],
    highlights: [
      'Grocery-anchored by Sprouts Farmers Market',
      'CVS Pharmacy, national banks, and everyday services',
      'Dining from quick-service to sit-down',
      'Open-air layout with landscaped walkways',
    ],
    hours: [
      ['Monday – Saturday', '9:00 AM – 9:00 PM'],
      ['Sunday', '10:00 AM – 7:00 PM'],
    ],
    availability: [
      // A public broker listing shows a junior anchor space plus inline shops — confirm suites and sizes.
      { suite: 'TBD', sf: null, use: 'Junior anchor', available: 'Now', placeholder: true },
      { suite: 'TBD', sf: null, use: 'Inline retail', available: 'Now', placeholder: true },
    ],
    tint: ['#123E63', '#051D35'],
  },

  {
    id: 'northgate',
    slug: 'northgate-plaza',
    name: 'Northgate Plaza',
    city: 'Carson City',
    state: 'NV',
    postalCode: '89701',
    type: 'Neighborhood Center',
    tagline: 'Daily needs, done right.',
    cardLine: 'Convenience center on North Carson Street, anchored by Smith’s.',
    address: ['2523–2749 N. Carson Street', 'Carson City, NV 89701'],
    mapQuery: '2523 N Carson St, Carson City, NV 89701',
    glaSF: 85000,
    glaApprox: true,
    glaVerify: true,
    anchors: ['Smith’s Food & Drug'],
    description: [
      'Northgate Plaza is a neighborhood convenience center on North Carson Street, anchored by Smith’s Food & Drug.',
      'Quick-service dining, banking, automotive services, and medical offices make it a one-stop destination for the everyday errands of Carson City residents.',
    ],
    highlights: [
      'Grocery-anchored by Smith’s Food & Drug',
      'Frontage along North Carson Street',
      'Quick-service dining from Starbucks to Panda Express',
      'Auto, medical, and financial services on site',
    ],
    hours: [
      ['Monday – Saturday', '8:00 AM – 9:00 PM'],
      ['Sunday', '9:00 AM – 7:00 PM'],
    ],
    availability: [
      { suite: 'TBD', sf: null, use: 'Inline retail / service', available: 'Now', placeholder: true },
    ],
    tint: ['#0E3B60', '#031522'],
  },

  {
    id: 'lakeside',
    slug: 'lakeside-shopping-center',
    name: 'Lakeside Shopping Center',
    city: 'Burbank',
    state: 'CA',
    postalCode: '91502',
    type: 'Neighborhood Center',
    tagline: 'Dining and everyday retail in the heart of Burbank.',
    cardLine: 'Vons-anchored neighborhood center with dining and services.',
    address: ['257 N. Pass Avenue', 'Burbank, CA 91502'],
    addressVerify: true, // ZIP for N. Pass Ave is usually 91505 — confirm
    mapQuery: '257 N Pass Ave, Burbank, CA',
    glaSF: 120000,
    glaApprox: true,
    glaVerify: true,
    anchors: ['Vons', 'CVS Pharmacy'],
    description: [
      'Lakeside Shopping Center is a grocery-anchored neighborhood center in Burbank. Vons and CVS Pharmacy anchor a lineup of local restaurants, personal services, and everyday essentials.',
      'A new regional dining concept has signed on at the center, with an opening expected in early 2027.',
    ],
    highlights: [
      'Grocery-anchored by Vons',
      'CVS Pharmacy, Bank of America, and Wells Fargo',
      'Local dining from Ma’s Italian Kitchen to Sushi Koo',
      'New regional restaurant opening in 2027',
    ],
    hours: [
      ['Monday – Saturday', '9:00 AM – 9:00 PM'],
      ['Sunday', '10:00 AM – 6:00 PM'],
    ],
    availability: [
      { suite: 'TBD', sf: null, use: 'Inline retail', available: 'Now', placeholder: true },
    ],
    tint: ['#0D3754', '#031220'],
  },
];
