import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { TouchableOpacity, Platform } from 'react-native';

export function HapticTab(props: BottomTabBarButtonProps) {
  if (!props) {
    return null;
  }

  // Safely handle props - only use what we need
  const { children, onPress, onPressIn, style, accessibilityState, accessibilityRole, testID } = props;

  const handlePressIn = (ev: any) => {
    try {
      if (Platform.OS === 'ios') {
        // Add a soft haptic feedback when pressing down on the tabs.
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPressIn?.(ev);
    } catch (error) {
      console.error('HapticTab error:', error);
      onPressIn?.(ev);
    }
  };

  // Use TouchableOpacity directly to avoid navigation control issues
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      style={style}
      activeOpacity={0.7}
      accessibilityState={accessibilityState}
      accessibilityRole={accessibilityRole}
      testID={testID}
    >
      {children}
    </TouchableOpacity>
  );
}
