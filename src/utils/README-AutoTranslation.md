# Auto-Translation System

This system provides automatic translation capabilities for dynamic content in the MooseTickets app.

## Components

### 1. `useAutoTranslate` Hook

A utility hook that provides various translation functions:

```typescript
import useAutoTranslate from '../utils/autoTranslate';

const { 
  translateField, 
  translateStatus, 
  translateObject, 
  smartTranslate,
  currentLanguage 
} = useAutoTranslate();
```

#### Functions:

- **`translateField(fieldKey: string)`** - Translates field names (e.g., "license_plate" → "License Plate")
- **`translateStatus(status: string)`** - Translates status values (e.g., "outstanding" → "Outstanding")
- **`translateObject(obj: Record<string, any>)`** - Translates an entire object's keys and values
- **`smartTranslate(input: string | object)`** - Automatically detects and translates appropriately

### 2. `AutoTranslatedText` Component

A text component that automatically translates its content:

```jsx
import AutoTranslatedText from '../components/AutoTranslatedText';

// Auto-detect type
<AutoTranslatedText text="license_plate" />

// Specify type
<AutoTranslatedText text="outstanding" type="status" />
<AutoTranslatedText text="fine_amount" type="field" />

// With styling
<AutoTranslatedText 
  text="disputed" 
  type="status" 
  weight="bold" 
  variant="primary" 
/>
```

### 3. `MetadataDisplay` Component

A component for displaying dynamic metadata with auto-translation:

```jsx
import MetadataDisplay from '../components/MetadataDisplay';

const ticketData = {
  license_plate: 'ABC1234',
  status: 'outstanding',
  fine_amount: '$85.00',
  violation_type: 'Parking Violation'
};

<MetadataDisplay
  title="Ticket Information"
  data={ticketData}
  excludeFields={['internal_id']}
  customLabels={{
    'license_plate': 'Plate Number'
  }}
/>
```

## How It Works

### Field Name Mapping

The system automatically maps common field names to translation keys:

```typescript
const fieldMappings = {
  'license_plate': 'vehicles.licensePlate',
  'fine_amount': 'tickets.fineAmount',
  'due_date': 'tickets.dueDate',
  'status': 'tickets.ticketStatus',
  // ... more mappings
};
```

### Status Value Mapping

Status values are mapped to their translated equivalents:

```typescript
const statusMappings = {
  'paid': 'tickets.paid',
  'outstanding': 'tickets.outstanding',
  'disputed': 'tickets.disputed',
  'overdue': 'tickets.overdue',
  // ... more mappings
};
```

### Fallback Behavior

If no translation mapping exists, the system:
1. Tries to find a direct translation key
2. Falls back to formatting the original text nicely (camelCase → Title Case)

## Usage Examples

### Simple Field Translation

```jsx
// Before (manual)
<ThemedText>{t('vehicles.licensePlate')}</ThemedText>

// After (auto)
<AutoTranslatedText text="license_plate" type="field" />
```

### Status Translation

```jsx
// Before (manual)
const getStatusLabel = (status) => {
  switch (status) {
    case 'paid': return t('tickets.paid');
    case 'outstanding': return t('tickets.outstanding');
    // ... more cases
  }
};

// After (auto)
<AutoTranslatedText text={ticket.status} type="status" />
```

### Metadata Display

```jsx
// Before (manual)
{Object.entries(ticket.metadata).map(([key, value]) => (
  <View key={key}>
    <Text>{formatKey(key)}</Text>
    <Text>{formatValue(value)}</Text>
  </View>
))}

// After (auto)
<MetadataDisplay data={ticket.metadata} title="Metadata" />
```

### Programmatic Translation

```jsx
const { smartTranslate } = useAutoTranslate();

// Translate individual items
const translatedField = smartTranslate('license_plate', 'field');
const translatedStatus = smartTranslate('outstanding', 'status');

// Translate entire objects
const translatedData = smartTranslate({
  status: 'paid',
  fine_amount: '$50',
  license_plate: 'XYZ789'
});
```

## Adding New Mappings

To add support for new fields or statuses, update the mappings in `autoTranslate.ts`:

```typescript
// Add to fieldMappings
'new_field_name': 'section.translationKey',

// Add to statusMappings  
'new_status': 'section.statusKey',
```

Then add the corresponding translation keys to all language files (en.json, fr.json, ar.json).

## Benefits

1. **Consistency** - All dynamic content uses the same translation logic
2. **Maintainability** - One place to manage field/status translations
3. **Automatic** - No need to manually translate every field
4. **Fallback** - Gracefully handles unknown fields
5. **Flexible** - Works with any dynamic data structure
6. **Multi-language** - Automatically works with all supported languages

## Integration in Existing Components

Replace manual translation logic:

```jsx
// Before
const formatMetadataKey = (key) => {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
};

// After
import useAutoTranslate from '../utils/autoTranslate';
const { translateField } = useAutoTranslate();
// Use translateField(key) instead
```

This system makes the app more maintainable and ensures consistent translations across all dynamic content.