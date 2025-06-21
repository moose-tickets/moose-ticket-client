// src/components/ImageViewer.tsx

import React, { useState } from 'react';
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView, ThemedText } from './ThemedComponents';
import { useTheme } from '../wrappers/ThemeProvider';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ImageViewerProps {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export default function ImageViewer({
  visible,
  images,
  initialIndex = 0,
  onClose,
}: ImageViewerProps) {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);

  // Animation values
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const resetImageTransform = () => {
    'worklet';
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const nextImage = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetImageTransform();
      setIsLoading(true);
    }
  };

  const previousImage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      resetImageTransform();
      setIsLoading(true);
    }
  };

  // Reset loading when modal opens or image changes
  React.useEffect(() => {
    if (visible) {
      setIsLoading(true);
      setCurrentIndex(initialIndex);
    }
  }, [visible, initialIndex]);

  React.useEffect(() => {
    setIsLoading(true);
  }, [currentIndex]);

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      // Limit zoom between 0.5x and 3x
      if (scale.value < 0.5) {
        scale.value = withSpring(0.5);
      } else if (scale.value > 3) {
        scale.value = withSpring(3);
      }
      savedScale.value = scale.value;
    });

  // Pan gesture for moving
  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      // Only allow panning when zoomed in
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
      }
    })
    .onEnd(() => {
      // Apply boundary constraints to prevent panning too far
      const maxTranslateX = (screenWidth * 0.9 * (scale.value - 1)) / 2;
      const maxTranslateY = (screenHeight * 0.6 * (scale.value - 1)) / 2;
      
      if (translateX.value > maxTranslateX) {
        translateX.value = withSpring(maxTranslateX);
      } else if (translateX.value < -maxTranslateX) {
        translateX.value = withSpring(-maxTranslateX);
      }
      
      if (translateY.value > maxTranslateY) {
        translateY.value = withSpring(maxTranslateY);
      } else if (translateY.value < -maxTranslateY) {
        translateY.value = withSpring(-maxTranslateY);
      }
      
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Combine gestures to work simultaneously
  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  // Double tap to zoom
  const handleDoubleTap = () => {
    if (scale.value > 1) {
      resetImageTransform();
    } else {
      scale.value = withSpring(2);
      savedScale.value = 2;
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar hidden />
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Header */}
        <View
          style={{
            position: 'absolute',
            top: 60,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            zIndex: 10,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            paddingVertical: 15,
            borderRadius: 8,
            marginHorizontal: 20,
          }}
        >
          <TouchableOpacity 
            onPress={onClose}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 20,
              padding: 8,
            }}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          
          <ThemedText
            style={{ color: 'white', fontSize: 16, fontWeight: '600' }}
          >
            {currentIndex + 1} of {images.length}
          </ThemedText>

          <TouchableOpacity 
            onPress={() => resetImageTransform()}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 20,
              padding: 8,
            }}
          >
            <Ionicons name="refresh" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Image Container */}
        <View
          style={{
            width: screenWidth * 0.9,
            height: screenHeight * 0.6,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: 12,
          }}
        >
          <GestureDetector gesture={composedGesture}>
            <Animated.View style={{ width: '100%', height: '100%', justifyContent: 'center' }}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={handleDoubleTap}
                delayLongPress={200}
              >
                <Animated.View style={animatedStyle}>
                  <Image
                    source={{ uri: images[currentIndex] }}
                    style={{
                      width: screenWidth * 0.9,
                      height: screenHeight * 0.6,
                    }}
                    resizeMode="contain"
                  />
                </Animated.View>
              </TouchableOpacity>
            </Animated.View>
          </GestureDetector>
        </View>

        {/* Navigation Controls */}
        {images.length > 1 && (
          <>
            {/* Previous Button */}
            {currentIndex > 0 && (
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  left: 30,
                  top: '50%',
                  marginTop: -25,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  borderRadius: 25,
                  width: 50,
                  height: 50,
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 5,
                }}
                onPress={previousImage}
              >
                <Ionicons name="chevron-back" size={24} color="white" />
              </TouchableOpacity>
            )}

            {/* Next Button */}
            {currentIndex < images.length - 1 && (
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  right: 30,
                  top: '50%',
                  marginTop: -25,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  borderRadius: 25,
                  width: 50,
                  height: 50,
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 5,
                }}
                onPress={nextImage}
              >
                <Ionicons name="chevron-forward" size={24} color="white" />
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Bottom Info */}
        <ThemedView
          style={{
            position: 'absolute',
            bottom: 50,
            left: 20,
            right: 20,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            borderRadius: 8,
            padding: 12,
          }}
        >
          <ThemedText
            style={{ color: 'white', fontSize: 12, textAlign: 'center' }}
          >
            Double tap to zoom • Pinch to zoom • Drag to pan
          </ThemedText>
        </ThemedView>
      </View>
    </Modal>
  );
}