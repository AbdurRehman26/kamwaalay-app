# Installation Guide for New Components

## Required Dependencies

The new UI components (GradientButton) require `expo-linear-gradient`. Install it with:

```bash
npx expo install expo-linear-gradient
```

## New Components Created

### 1. GradientButton (`components/ui/gradient-button.tsx`)
A premium button component with gradient backgrounds and multiple variants.

**Usage:**
```typescript
import { GradientButton } from '@/components/ui/gradient-button';

// Primary gradient button
<GradientButton
  title="Get Started"
  onPress={() => console.log('Pressed')}
  variant="primary"
  size="large"
  fullWidth
/>

// Secondary button
<GradientButton
  title="Learn More"
  onPress={() => console.log('Pressed')}
  variant="secondary"
/>

// Outline button
<GradientButton
  title="Cancel"
  onPress={() => console.log('Pressed')}
  variant="outline"
/>

// With loading state
<GradientButton
  title="Submit"
  onPress={handleSubmit}
  loading={isSubmitting}
/>
```

### 2. Card (`components/ui/card.tsx`)
A flexible card component with multiple variants.

**Usage:**
```typescript
import { Card } from '@/components/ui/card';

// Default card
<Card>
  <Text>Card content</Text>
</Card>

// Elevated card with shadow
<Card variant="elevated">
  <Text>Elevated card</Text>
</Card>

// Outlined card
<Card variant="outlined">
  <Text>Outlined card</Text>
</Card>

// Pressable card
<Card onPress={() => console.log('Card pressed')}>
  <Text>Tap me</Text>
</Card>

// Custom padding
<Card padding={24}>
  <Text>More padding</Text>
</Card>
```

### 3. Badge (`components/ui/badge.tsx`)
A status badge component with color-coded variants.

**Usage:**
```typescript
import { Badge } from '@/components/ui/badge';

// Success badge
<Badge text="Active" variant="success" />

// Warning badge
<Badge text="Pending" variant="warning" />

// Error badge
<Badge text="Failed" variant="error" />

// Info badge
<Badge text="New" variant="info" />

// Primary badge
<Badge text="Featured" variant="primary" />

// Different sizes
<Badge text="Small" size="small" />
<Badge text="Medium" size="medium" />
<Badge text="Large" size="large" />
```

## Component Export

Add these to your component exports for easier imports:

Create or update `components/ui/index.ts`:
```typescript
export { GradientButton } from './gradient-button';
export { Card } from './card';
export { Badge } from './badge';
export { IconSymbol } from './icon-symbol';
```

Then you can import like:
```typescript
import { GradientButton, Card, Badge } from '@/components/ui';
```

## Integration Examples

### Login Screen
```typescript
import { GradientButton } from '@/components/ui/gradient-button';
import { Card } from '@/components/ui/card';

<Card variant="elevated" padding={24}>
  <TextInput placeholder="Email" />
  <TextInput placeholder="Password" secureTextEntry />
  <GradientButton
    title="Sign In"
    onPress={handleLogin}
    loading={isLoading}
    fullWidth
  />
</Card>
```

### Profile Card
```typescript
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

<Card variant="elevated" onPress={() => navigate('profile')}>
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Image source={{ uri: user.avatar }} />
    <View>
      <Text>{user.name}</Text>
      <Badge text={user.status} variant="success" size="small" />
    </View>
  </View>
</Card>
```

### Service Listing
```typescript
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GradientButton } from '@/components/ui/gradient-button';

<Card variant="elevated">
  <Image source={{ uri: service.image }} />
  <Text>{service.title}</Text>
  <Badge text={service.category} variant="primary" />
  <Text>{service.price}</Text>
  <GradientButton
    title="Book Now"
    onPress={() => bookService(service.id)}
    size="medium"
  />
</Card>
```

## Styling Tips

### Consistent Spacing
Use these spacing values throughout the app:
- 4px: Minimal gap
- 8px: Small gap
- 12px: Medium gap
- 16px: Standard padding
- 20px: Screen padding
- 24px: Large padding
- 32px: Section spacing

### Color Usage
Always use theme colors:
```typescript
import { useThemeColor } from '@/hooks/use-theme-color';

const primaryColor = useThemeColor({}, 'primary');
const backgroundColor = useThemeColor({}, 'background');
const textColor = useThemeColor({}, 'text');
```

### Shadow Consistency
Use these shadow presets:
```typescript
// Light shadow
shadowColor: shadowColor,
shadowOffset: { width: 0, height: 1 },
shadowOpacity: 1,
shadowRadius: 3,
elevation: 1,

// Medium shadow
shadowColor: shadowColor,
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 1,
shadowRadius: 8,
elevation: 3,

// Heavy shadow
shadowColor: shadowColor,
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 1,
shadowRadius: 12,
elevation: 6,
```

## Next Steps

1. Install expo-linear-gradient
2. Test the new components in your screens
3. Replace existing buttons with GradientButton
4. Wrap content in Card components
5. Add Badge components for status indicators
6. Update remaining screens to use theme colors
