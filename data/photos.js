// Licensed stock photos used until real property photos are added.
//
// Every photo here is free for commercial use under the Unsplash License
// (https://unsplash.com/license). Attribution isn't required, but the site credits each
// photographer on /photo-credits.html. Stock images show a small "Representative photo"
// tag, so visitors aren't led to think they show our centers.
//
// The build downloads each photo and serves it from our own site (no hotlinking).
// To replace one with a real photo, add a file with the same name to src/img/
// (for example src/img/mchenry-village/hero.jpg). The real photo always wins.
//
// Keys match the photo slots: <property-slug>/hero, <property-slug>/feature, home/leasing, about/story.
// alt describes what is actually in the picture.

const UNSPLASH = { source: 'Unsplash', license: 'Unsplash License', licenseUrl: 'https://unsplash.com/license' };
const HERO = { w: 2000, h: 1125 };
const FEATURE = { w: 1400, h: 1050 };
const SPLIT = { w: 1400, h: 1120 };

module.exports = {
  'mchenry-village/hero': {
    ...UNSPLASH, ...HERO, crop: 'top',
    src: 'https://images.unsplash.com/photo-1762926627710-6143e653a7d4',
    page: 'https://unsplash.com/photos/outdoor-seating-area-with-plants-and-buildings-NnAG2eV3gyo',
    credit: 'shawn kim',
    alt: 'Wood pergola with string lights over a landscaped garden patio',
  },
  'mchenry-village/feature': {
    ...UNSPLASH, ...FEATURE,
    src: 'https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0',
    page: 'https://unsplash.com/photos/assorted-fruits-on-brown-wooden-rack-ZpIskW1Tuvc',
    credit: 'Raul Gonzalez Escobar',
    alt: 'Fresh fruit and vegetables on wooden market shelves',
  },
  'northgate-plaza/hero': {
    ...UNSPLASH, ...HERO,
    src: 'https://images.unsplash.com/photo-1654064615170-dad3abf83914',
    page: 'https://unsplash.com/photos/a-dirt-road-in-the-middle-of-a-field-with-mountains-in-the-background-8Bu0TwQ2CHU',
    credit: 'Anna Goncharova',
    alt: 'High-desert valley with the Sierra Nevada in the distance',
  },
  'northgate-plaza/feature': {
    ...UNSPLASH, ...FEATURE,
    src: 'https://images.unsplash.com/photo-1567306295427-94503f8300d7',
    page: 'https://unsplash.com/photos/fresh-produce-in-wooden-market-crate-kuR1Kwo4my4',
    credit: 'Shelley Pauls',
    alt: 'Fresh produce in a wooden farmers market crate',
  },
  'lakeside-shopping-center/hero': {
    ...UNSPLASH, ...HERO,
    src: 'https://images.unsplash.com/photo-1509702864936-dca41bfe0bc2',
    page: 'https://unsplash.com/photos/seven-coconut-trees-at-daytime-egip6alyp0c',
    credit: 'Jörg Angeli',
    alt: 'Palm trees against a blue Southern California sky',
  },
  'lakeside-shopping-center/feature': {
    ...UNSPLASH, ...FEATURE,
    src: 'https://images.unsplash.com/photo-1761426202710-8e4a2e8738b7',
    page: 'https://unsplash.com/photos/outdoor-patio-with-string-lights-at-dusk-a0Kow0P_Mq4',
    credit: 'Blake Wisz',
    alt: 'Restaurant patio with string lights at dusk',
  },
  'home/leasing': {
    ...UNSPLASH, ...SPLIT,
    src: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc',
    page: 'https://unsplash.com/photos/gray-and-blue-open-signage-c9FQyqIECds',
    credit: 'Mike Petrucci',
    alt: 'An “Open” sign hanging in a shop window',
  },
  'about/story': {
    ...UNSPLASH, ...SPLIT,
    src: 'https://images.unsplash.com/photo-1760565030346-4b947220fe3a',
    page: 'https://unsplash.com/photos/hand-holding-colorful-shopping-bags-against-a-light-background-uaWMyAIpF2g',
    credit: 'Iuliia Pilipeichenko',
    alt: 'A hand holding colorful shopping bags',
  },
};
