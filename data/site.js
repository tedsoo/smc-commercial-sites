// Site-wide settings: brand, contacts, and links.
// Edit here and every page picks up the change on the next build.
// Anything marked `verify: true` shows an amber "Verify" chip on preview links
// (never on the live site) so the team can confirm it before launch.

module.exports = {
  brand: {
    name: 'SMC Commercial',
    wordmarkMain: 'SMC',
    wordmarkSub: ['Commercial', 'Properties'],
    legalName: 'Standard Management Company',
    parentName: 'Standard Asset Management & Investments (SAMI)',
    foundedYear: 1961,
    corporateUrl: 'https://www.standardmanagement.com/',
    privacyUrl: 'https://www.standardmanagement.com/privacy-policy/',
    linkedinUrl: 'https://www.linkedin.com/company/standard-management-company',
  },

  // Netlify sets URL to the production address during builds.
  siteUrl: (process.env.URL || 'https://smc-commercial-sites.netlify.app').replace(/\/$/, ''),

  contacts: {
    mainOffice:       { label: 'Main Office',             phone: '(209) 555-0100', verify: true, note: '555 number carried over from V8 — replace with the real office line.' },
    afterHours:       { label: 'After-Hours Maintenance', phone: '(209) 555-0199', verify: true, note: '555 number carried over from V8 — replace with the real after-hours line.' },
    buildingServices: { label: 'Building Services',       email: 'buildingservices@standardmanagement.com' },
    leasing:          { label: 'Leasing',                 email: 'leasing@standardmanagement.com' },
    corporate: {
      label: 'Corporate Office',
      address: ['2245 Campus Drive', 'El Segundo, CA 90245'],
      phone: '(310) 410-2300',
      email: 'info@standardmanagement.com',
    },
  },
};
