// Simple test file to verify auto-translation mappings
// Run with: node src/utils/testAutoTranslate.js

const testCases = [
  'licensePlate',
  'license_plate', 
  'violationType',
  'violation_type',
  'fineAmount',
  'fine_amount',
  'issuingAuthority',
  'issuing_authority',
  'officerBadge',
  'officer_badge',
  'officerId',
  'officer_id',
  'badgeNumber',
  'badge_number',
  'citationNumber',
  'citation_number',
  'zone',
  'meterNumber',
  'meter_number',
  'someUnknownField',
  'another_unknown_field'
];

// Mock translation function
const mockT = (key) => {
  const translations = {
    'vehicles.licensePlate': 'License Plate',
    'tickets.violationType': 'Violation Type',
    'tickets.fineAmount': 'Fine Amount',
    'tickets.issuedBy': 'Issued By',
    'tickets.officerId': 'Officer ID',
    'tickets.officerBadge': 'Officer Badge',
    'tickets.badgeNumber': 'Badge Number',
    'tickets.citationNumber': 'Citation Number',
    'tickets.zone': 'Zone',
    'tickets.meterNumber': 'Meter Number',
    'tickets.permitRequired': 'Permit Required',
    'tickets.timeIssued': 'Time Issued',
    'tickets.vehicleType': 'Vehicle Type'
  };
  return translations[key] || key;
};

// Simulate the translateField function
const fieldMappings = {
  'license_plate': 'vehicles.licensePlate',
  'licensePlate': 'vehicles.licensePlate',
  'violation_type': 'tickets.violationType',
  'violationType': 'tickets.violationType',
  'fine_amount': 'tickets.fineAmount',
  'fineAmount': 'tickets.fineAmount',
  'issued_by': 'tickets.issuedBy',
  'issuedBy': 'tickets.issuedBy',
  'issuing_authority': 'tickets.issuedBy',
  'issuingAuthority': 'tickets.issuedBy',
  'officer_badge': 'tickets.officerBadge',
  'officerBadge': 'tickets.officerBadge',
  'officer_id': 'tickets.officerId',
  'officerId': 'tickets.officerId',
  'badge_number': 'tickets.badgeNumber',
  'badgeNumber': 'tickets.badgeNumber',
  'citation_number': 'tickets.citationNumber',
  'citationNumber': 'tickets.citationNumber',
  'zone': 'tickets.zone',
  'meter_number': 'tickets.meterNumber',
  'meterNumber': 'tickets.meterNumber',
};

const translateField = (fieldKey) => {
  if (!fieldKey) return '';
  
  // Try exact match first
  if (fieldMappings[fieldKey]) {
    const translationKey = fieldMappings[fieldKey];
    if (translationKey.includes('.')) {
      const translated = mockT(translationKey);
      return translated !== translationKey ? translated : translationKey;
    }
    return translationKey;
  }
  
  // Try lowercase version
  const lowerKey = fieldKey.toLowerCase();
  if (fieldMappings[lowerKey]) {
    const translationKey = fieldMappings[lowerKey];
    if (translationKey.includes('.')) {
      const translated = mockT(translationKey);
      return translated !== translationKey ? translated : translationKey;
    }
    return translationKey;
  }
  
  // Try converting camelCase to snake_case
  const snakeCase = fieldKey.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  if (fieldMappings[snakeCase]) {
    const translationKey = fieldMappings[snakeCase];
    if (translationKey.includes('.')) {
      const translated = mockT(translationKey);
      return translated !== translationKey ? translated : translationKey;
    }
    return translationKey;
  }
  
  // Try converting snake_case to camelCase
  const camelCase = fieldKey.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  if (fieldMappings[camelCase]) {
    const translationKey = fieldMappings[camelCase];
    if (translationKey.includes('.')) {
      const translated = mockT(translationKey);
      return translated !== translationKey ? translated : translationKey;
    }
    return translationKey;
  }
  
  // Last resort: format the field name nicely
  return fieldKey
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
};

console.log('Auto-Translation Test Results:');
console.log('==============================');

testCases.forEach(testCase => {
  const result = translateField(testCase);
  console.log(`"${testCase}" → "${result}"`);
});

console.log('\nField Mappings Available:');
console.log('========================');
Object.entries(fieldMappings).forEach(([key, value]) => {
  console.log(`"${key}" → "${value}"`);
});