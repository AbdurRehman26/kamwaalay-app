// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'magnifyingglass': 'search',
  'list.bullet': 'list',
  'message.fill': 'message',
  'message.circle.fill': 'message',
  'person.fill': 'person',
  'bell.fill': 'notifications',
  'plus.circle.fill': 'add-circle',
  'location.fill': 'location-on',
  'star.fill': 'star',
  'clock.fill': 'access-time',
  'dollarsign.circle.fill': 'attach-money',
  'trash.fill': 'delete',
  'gearshape.fill': 'settings',
  'questionmark.circle.fill': 'help',
  'arrow.right.square.fill': 'logout',
  'creditcard.fill': 'credit-card',
  'lock.fill': 'lock',
  'info.circle.fill': 'info',
  'doc.text.fill': 'description',
  'hand.raised.fill': 'privacy-tip',
  'envelope.fill': 'email',
  'phone.fill': 'phone',
  'arrow.up.circle.fill': 'arrow-upward',
  'checkmark.circle.fill': 'check-circle',
  'xmark.circle.fill': 'cancel',
  'chevron.left': 'chevron-left',
  'chevron.up': 'keyboard-arrow-up',
  'chevron.down': 'keyboard-arrow-down',
  'camera.fill': 'camera-alt',
  'calendar': 'calendar-today',
  'eye.fill': 'visibility',
  'eye.slash.fill': 'visibility-off',
  'slider.horizontal.3': 'tune',
  'xmark': 'close',
  'building.2.fill': 'business',
  'building.2': 'business',
  'person': 'person-outline',
  'mappin.circle.fill': 'location-on',
  'phone': 'phone',
  'briefcase.fill': 'work',
  'person.2.fill': 'people',
  'globe': 'public',
  'checkmark': 'check',
  'arrow.right': 'arrow-forward',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
