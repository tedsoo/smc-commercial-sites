// The three SMC commercial centers. One object per property.
//
// Photos: drop files into src/img/<slug>/ using these names (jpg, png or webp):
//   hero      2400 x 1350  wide exterior / signature view (also used on cards)
//   feature   1600 x 1200  secondary shot for the Overview section
//   site-plan 1600 x 1200  leasing site plan image
// Brochure: put a PDF at src/docs/<slug>-brochure.pdf and a download button appears.
// Until a file exists, the site shows a branded placeholder.
//
// GLA, addresses, anchors and available suites were reviewed against property
// management records on Oct 29, 2026.
//
// Availability rows: { suite, sf, use, available, placeholder }
//   sf: number or null ("Contact leasing" is shown when null)
//   placeholder: true marks a row leasing still needs to fill in.
// Keep only public-facing facts here; this repo is public.

const RETAIL = 'Retail / service';

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
    address: ['1700 McHenry Avenue', 'Modesto, CA 95350'],
    mapQuery: '1700 McHenry Ave, Modesto, CA 95350',
    glaSF: 275401,
    anchors: ['Sprouts Farmers Market', 'CVS Pharmacy'],
    description: [
      'McHenry Village is an open-air lifestyle center on McHenry Avenue, serving the north Modesto corridor. Sprouts Farmers Market and CVS Pharmacy anchor a mix of dining, wellness, fashion, and personal services.',
      'A longtime Modesto landmark, the center is where neighbors run weekly errands, meet for a meal, and gather for community events.',
    ],
    highlights: [
      'Grocery-anchored by Sprouts Farmers Market',
      'CVS Pharmacy and everyday services',
      'Dining from Togo’s to Verona Cucina Italiana',
      'Family fun at Sky Zone, Color Me Mine, and Juline School of Dance',
    ],
    hours: [
      ['Monday – Saturday', '9:00 AM – 9:00 PM'],
      ['Sunday', '10:00 AM – 7:00 PM'],
    ],
    availability: [
      { suite: '0013', sf: 2750, use: RETAIL, available: 'Now' },
      { suite: '0019', sf: 1700, use: RETAIL, available: 'Now' },
      { suite: '002E', sf: 2550, use: RETAIL, available: 'Now' },
      { suite: '0043', sf: 1152, use: RETAIL, available: 'Now' },
      { suite: '0061', sf: 6566, use: RETAIL, available: 'Now' },
      { suite: '0062', sf: 2060, use: RETAIL, available: 'Now' },
      { suite: '0079', sf: 1125, use: RETAIL, available: 'Now' },
      { suite: '0091', sf: 2008, use: RETAIL, available: 'Now' },
      { suite: '0110', sf: 6394, use: RETAIL, available: 'Now' },
      { suite: '016A', sf: 2252, use: RETAIL, available: 'Now' },
      { suite: '028C', sf: 6205, use: RETAIL, available: 'Now' },
      { suite: '054A', sf: 1342, use: RETAIL, available: 'Now' },
      { suite: '062F', sf: 1873, use: RETAIL, available: 'Now' },
      { suite: '080A', sf: 920,  use: RETAIL, available: 'Now' },
    ],
    tint: ['#123E63', '#051D35'],
  },

  {
    id: 'northgate',
    slug: 'northgate-plaza',
    name: 'Northgate Plaza',
    city: 'Carson City',
    state: 'NV',
    postalCode: '89706',
    type: 'Neighborhood Center',
    tagline: 'Daily needs, done right.',
    cardLine: 'Neighborhood center on North Carson Street, anchored by Harbor Freight Tools and Dollar Tree.',
    address: ['2523–2749 N. Carson Street', 'Carson City, NV 89706'],
    mapQuery: '2523 N Carson St, Carson City, NV 89706',
    glaSF: 151629,
    anchors: ['Harbor Freight Tools', 'Dollar Tree'],
    description: [
      'Northgate Plaza is a neighborhood center on North Carson Street, anchored by Harbor Freight Tools and Dollar Tree.',
      'Quick-service dining, fitness, and State of Nevada service offices bring steady weekday traffic, making the center a convenient stop for Carson City residents.',
    ],
    highlights: [
      'Anchored by Harbor Freight Tools and Dollar Tree',
      'Frontage along North Carson Street',
      'Quick-service dining from KFC and Wendy’s',
      'Anytime Fitness, Talents Athletic Center, and State of Nevada offices on site',
    ],
    hours: [
      ['Monday – Saturday', '8:00 AM – 9:00 PM'],
      ['Sunday', '9:00 AM – 7:00 PM'],
    ],
    availability: [
      { suite: '190',   sf: 6144,  use: RETAIL, available: 'Now' },
      { suite: '2527',  sf: 6388,  use: RETAIL, available: 'Now' },
      { suite: '2527A', sf: 1829,  use: RETAIL, available: 'Now' },
      { suite: '2531',  sf: 5326,  use: RETAIL, available: 'Now' },
      { suite: '2567',  sf: 1313,  use: RETAIL, available: 'Now' },
      { suite: '2571',  sf: 14750, use: RETAIL, available: 'Now' },
      { suite: '2571A', sf: 8000,  use: RETAIL, available: 'Now' },
      { suite: '2575',  sf: 1534,  use: RETAIL, available: 'Now' },
      { suite: '2589',  sf: 730,   use: RETAIL, available: 'Now' },
      { suite: '2591',  sf: 1170,  use: RETAIL, available: 'Now' },
      { suite: '275',   sf: 4729,  use: RETAIL, available: 'Now' },
      { suite: '280',   sf: 1894,  use: RETAIL, available: 'Now' },
    ],
    tint: ['#0E3B60', '#031522'],
  },

  {
    id: 'lakeside',
    slug: 'lakeside-shopping-center',
    name: 'Lakeside Shopping Center',
    city: 'Burbank',
    state: 'CA',
    postalCode: '91505',
    type: 'Neighborhood Center',
    tagline: 'Dining and everyday retail in the heart of Burbank.',
    cardLine: 'Vons-anchored neighborhood center with dining and services.',
    address: ['257–353 N. Pass Avenue', 'Burbank, CA 91505'],
    mapQuery: '257 N Pass Ave, Burbank, CA 91505',
    glaSF: 70100,
    anchors: ['Vons'],
    description: [
      'Lakeside Shopping Center is a grocery-anchored neighborhood center in Burbank. Vons anchors a lineup of local restaurants, personal services, and everyday essentials.',
      'Neighbors stop in for coffee at Starbucks, dinner at Ma’s Italian Kitchen or Lotus & Light, and a scoop at Handel’s Homemade Ice Cream.',
    ],
    highlights: [
      'Grocery-anchored by Vons',
      'Bank of America, PostalAnnex, and Flair Cleaners',
      'Local dining from Ma’s Italian Kitchen to Emon Japanese Restaurant',
      'Starbucks, Panda Express, and Handel’s Homemade Ice Cream',
    ],
    hours: [
      ['Monday – Saturday', '9:00 AM – 9:00 PM'],
      ['Sunday', '10:00 AM – 6:00 PM'],
    ],
    availability: [
      { suite: '0259', sf: 2060, use: RETAIL, available: 'Now' },
    ],
    tint: ['#0D3754', '#031220'],
  },
];
