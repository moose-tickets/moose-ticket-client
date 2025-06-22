import { useTranslation } from 'react-i18next';

// Auto-translation utility for dynamic content
export const useAutoTranslate = () => {
  const { t, i18n } = useTranslation();
  
  // Common field mappings for auto-translation
  const fieldMappings: Record<string, string> = {
    // Ticket fields
    'ticket_number': 'tickets.ticketNumber',
    'ticketNumber': 'tickets.ticketNumber',
    'license_plate': 'vehicles.licensePlate',
    'licensePlate': 'vehicles.licensePlate',
    'violation_type': 'tickets.violationType',
    'violationType': 'tickets.violationType',
    'fine_amount': 'tickets.fineAmount',
    'fineAmount': 'tickets.fineAmount',
    'due_date': 'tickets.dueDate',
    'dueDate': 'tickets.dueDate',
    'issued_by': 'tickets.issuedBy',
    'issuedBy': 'tickets.issuedBy',
    'issuing_authority': 'tickets.issuedBy',
    'issuingAuthority': 'tickets.issuedBy',
    'location': 'tickets.location',
    'violation_date': 'tickets.violationDate',
    'violationDate': 'tickets.violationDate',
    'status': 'tickets.ticketStatus',
    
    // Common metadata fields
    'officer_id': 'tickets.officerId',
    'officerId': 'tickets.officerId',
    'officer_badge': 'tickets.officerBadge',
    'officerBadge': 'tickets.officerBadge',
    'badge_number': 'tickets.badgeNumber',
    'badgeNumber': 'tickets.badgeNumber',
    'citation_number': 'tickets.citationNumber',
    'citationNumber': 'tickets.citationNumber',
    'court_date': 'tickets.courtDate',
    'courtDate': 'tickets.courtDate',
    'court_location': 'tickets.courtLocation',
    'courtLocation': 'tickets.courtLocation',
    'zone': 'tickets.zone',
    'meter_number': 'tickets.meterNumber',
    'meterNumber': 'tickets.meterNumber',
    'permit_required': 'tickets.permitRequired',
    'permitRequired': 'tickets.permitRequired',
    'time_issued': 'tickets.timeIssued',
    'timeIssued': 'tickets.timeIssued',
    'vehicle_type': 'tickets.vehicleType',
    'vehicleType': 'tickets.vehicleType',
    'speed_limit': 'tickets.speedLimit',
    'speedLimit': 'tickets.speedLimit',
    'actual_speed': 'tickets.actualSpeed',
    'actualSpeed': 'tickets.actualSpeed',
    'recorded_speed': 'tickets.recordedSpeed',
    'recordedSpeed': 'tickets.recordedSpeed',
    
    // Status values
    'paid': 'tickets.paid',
    'outstanding': 'tickets.outstanding',
    'disputed': 'tickets.disputed',
    'overdue': 'tickets.overdue',
    'pending': 'dispute.pending',
    'approved': 'dispute.approved',
    'rejected': 'dispute.rejected',
    
    // Vehicle fields
    'make': 'vehicles.make',
    'model': 'vehicles.model',
    'year': 'vehicles.year',
    'color': 'vehicles.color',
    
    // Payment fields
    'card_number': 'payments.cardNumber',
    'cardNumber': 'payments.cardNumber',
    'expiry_date': 'payments.expiryDate',
    'expiryDate': 'payments.expiryDate',
    'cardholder_name': 'payments.cardholderName',
    'cardholderName': 'payments.cardholderName',
    'billing_address': 'payments.billingAddress',
    'billingAddress': 'payments.billingAddress',
    
    // Profile fields
    'full_name': 'profile.fullName',
    'fullName': 'profile.fullName',
    'street_address': 'profile.streetAddress',
    'streetAddress': 'profile.streetAddress',
    'city': 'profile.city',
    'postal_code': 'profile.postalCode',
    'postalCode': 'profile.postalCode',
    'country': 'profile.country',
    'state_province': 'profile.stateProvince',
    'stateProvince': 'profile.stateProvince',
    
    // Common fields
    'date': 'common.date',
    'time': 'common.time',
    'amount': 'common.amount',
    'description': 'common.description',
    'notes': 'tickets.notes',
  };

  // Status value mappings
  const statusMappings: Record<string, string> = {
    'paid': 'tickets.paid',
    'outstanding': 'tickets.outstanding',
    'disputed': 'tickets.disputed',
    'overdue': 'tickets.overdue',
    'pending': 'dispute.pending',
    'approved': 'dispute.approved',
    'rejected': 'dispute.rejected',
    'submitted': 'dispute.submitted',
    'in_review': 'dispute.inReview',
    'resolved': 'dispute.resolved',
  };

  /**
   * Auto-translate a field name or key
   */
  const translateField = (fieldKey: string): string => {
    if (!fieldKey) return '';
    
    // Try exact match first (handles both camelCase and snake_case)
    if (fieldMappings[fieldKey]) {
      const translationKey = fieldMappings[fieldKey];
      // If it's a direct string, return it; if it's a translation key, translate it
      if (translationKey.includes('.')) {
        const translated = t(translationKey);
        return translated !== translationKey ? translated : translationKey;
      }
      return translationKey;
    }
    
    // Try lowercase version
    const lowerKey = fieldKey.toLowerCase();
    if (fieldMappings[lowerKey]) {
      const translationKey = fieldMappings[lowerKey];
      if (translationKey.includes('.')) {
        const translated = t(translationKey);
        return translated !== translationKey ? translated : translationKey;
      }
      return translationKey;
    }
    
    // Try converting camelCase to snake_case
    const snakeCase = fieldKey.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
    if (fieldMappings[snakeCase]) {
      const translationKey = fieldMappings[snakeCase];
      if (translationKey.includes('.')) {
        const translated = t(translationKey);
        return translated !== translationKey ? translated : translationKey;
      }
      return translationKey;
    }
    
    // Try converting snake_case to camelCase
    const camelCase = fieldKey.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    if (fieldMappings[camelCase]) {
      const translationKey = fieldMappings[camelCase];
      if (translationKey.includes('.')) {
        const translated = t(translationKey);
        return translated !== translationKey ? translated : translationKey;
      }
      return translationKey;
    }
    
    // Try direct translation key (in case the field is already a translation key)
    const directTranslation = t(fieldKey);
    if (directTranslation !== fieldKey) {
      return directTranslation;
    }
    
    // Last resort: format the field name nicely
    return fieldKey
      .replace(/([A-Z])/g, ' $1')  // camelCase to spaces
      .replace(/_/g, ' ')          // snake_case to spaces
      .replace(/\s+/g, ' ')        // multiple spaces to single
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();
  };

  /**
   * Auto-translate a status value
   */
  const translateStatus = (status: string): string => {
    const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_');
    
    if (statusMappings[normalizedStatus]) {
      return t(statusMappings[normalizedStatus]);
    }
    
    // Fallback to formatted status
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  /**
   * Auto-translate an object's field names and values
   */
  const translateObject = (obj: Record<string, any>): Record<string, any> => {
    const translated: Record<string, any> = {};
    
    Object.entries(obj).forEach(([key, value]) => {
      const translatedKey = translateField(key);
      
      // If value looks like a status, try to translate it
      if (typeof value === 'string' && statusMappings[value.toLowerCase()]) {
        translated[translatedKey] = translateStatus(value);
      } else {
        translated[translatedKey] = value;
      }
    });
    
    return translated;
  };

  /**
   * Smart translate function that handles different types of input
   */
  const smartTranslate = (input: string | Record<string, any>, type?: 'field' | 'status' | 'object'): any => {
    if (typeof input === 'string') {
      switch (type) {
        case 'field':
          return translateField(input);
        case 'status':
          return translateStatus(input);
        default:
          // Try status first, then field
          const statusResult = translateStatus(input);
          if (statusResult !== input) return statusResult;
          return translateField(input);
      }
    } else if (typeof input === 'object' && input !== null) {
      return translateObject(input);
    }
    
    return input;
  };

  return {
    translateField,
    translateStatus,
    translateObject,
    smartTranslate,
    currentLanguage: i18n.language,
  };
};

// Hook for component use
export default useAutoTranslate;