import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Hide splash after 2.5 seconds
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onFinish();
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, onFinish]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Background - Solid Blue */}
      <View style={styles.background} />

      {/* Main Content */}
      <View style={styles.content}>
        {/* Icons around the woman */}
        <View style={styles.iconsContainer}>
          {/* Spatula - Upper Left */}
          <View style={[styles.iconPosition, styles.iconUpperLeft]}>
            <Text style={styles.iconEmoji}>🍳</Text>
          </View>

          {/* House - Lower Left */}
          <View style={[styles.iconPosition, styles.iconLowerLeft]}>
            <Text style={styles.iconEmoji}>🏠</Text>
          </View>

          {/* Baby - Below House */}
          <View style={[styles.iconPosition, styles.iconBaby]}>
            <Text style={styles.iconEmoji}>👶</Text>
          </View>

          {/* Sparkle/Star - Upper Right */}
          <View style={[styles.iconPosition, styles.iconUpperRight]}>
            <View style={styles.sparkleContainer}>
              <Text style={styles.sparkleEmoji}>✨</Text>
            </View>
          </View>

          {/* Mop - Lower Right */}
          <View style={[styles.iconPosition, styles.iconLowerRight]}>
            <Text style={styles.iconEmoji}>🧹</Text>
          </View>

          {/* Iron - Middle Left */}
          <View style={[styles.iconPosition, styles.iconIron]}>
            <Text style={styles.iconEmoji}>🧺</Text>
          </View>

          {/* Dishwasher - Upper Middle Right */}
          <View style={[styles.iconPosition, styles.iconDishwasher]}>
            <Text style={styles.iconEmoji}>🍽️</Text>
          </View>

          {/* Vacuum - Lower Middle Right */}
          <View style={[styles.iconPosition, styles.iconVacuum]}>
            <Text style={styles.iconEmoji}>🧽</Text>
          </View>

          {/* Laundry - Middle Left Below */}
          <View style={[styles.iconPosition, styles.iconLaundry]}>
            <Text style={styles.iconEmoji}>👕</Text>
          </View>

          {/* Shopping - Upper Middle Left */}
          <View style={[styles.iconPosition, styles.iconShopping]}>
            <Text style={styles.iconEmoji}>🛒</Text>
          </View>
        </View>

        {/* Woman Illustration - Center */}
        <View style={styles.womanContainer}>
          <Text style={styles.womanEmoji}>👩‍🍳</Text>
        </View>
      </View>

      {/* Title Text - Below everything */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Hire Househelps</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#2563EB', // Solid blue background
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  titleContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconsContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  iconPosition: {
    position: 'absolute',
  },
  // Icons positioned in a circle around the center woman
  // Circular pattern: 10 icons evenly distributed (every ~36 degrees)
  iconShopping: {
    top: '18%',      // Top (12 o'clock)
    left: '48%',     // Centered horizontally
  },
  iconDishwasher: {
    top: '25%',      // Top-right (1-2 o'clock)
    right: '22%',
  },
  iconUpperRight: {
    top: '35%',      // Right (3 o'clock)
    right: '8%',
  },
  iconVacuum: {
    top: '45%',      // Bottom-right (4-5 o'clock)
    right: '18%',
  },
  iconLowerRight: {
    top: '58%',      // Bottom-right (5-6 o'clock)
    right: '25%',
  },
  iconBaby: {
    top: '68%',      // Bottom (6 o'clock)
    left: '48%',     // Centered horizontally
  },
  iconLaundry: {
    top: '58%',      // Bottom-left (7-8 o'clock)
    left: '25%',
  },
  iconLowerLeft: {
    top: '45%',      // Left (9 o'clock)
    left: '8%',
  },
  iconIron: {
    top: '35%',      // Top-left (10-11 o'clock)
    left: '18%',
  },
  iconUpperLeft: {
    top: '25%',      // Top-left (11-12 o'clock)
    left: '22%',
  },
  sparkleContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#60A5FA', // Light blue circle
    justifyContent: 'center',
    alignItems: 'center',
  },
  womanContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  womanEmoji: {
    fontSize: 120,
  },
  iconEmoji: {
    fontSize: 40,
  },
  sparkleEmoji: {
    fontSize: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'System',
  },
});

