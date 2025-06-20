import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedView, ThemedText, ThemedButton } from "../../components/ThemedComponents";
import { useTheme } from "../../wrappers/ThemeProvider";

const { width } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    title: "Welcome to MooseTicket",
    description: "Never miss a ticket—stay in control",
    image: require("../../../assets/onboarding/ticket.png"), // Replace with your image
    imageStyle: { width: 170, height: 170 },
  },
  {
    id: "2",
    title: "Pay or dispute instantly",
    description: "Handle tickets right away with secure payments or start a dispute",
    image: require("../../../assets/onboarding/pay.png"),
    imageStyle: { width: 170, height: 170 },
  },
  {
    id: "3",
    title: "Manage vehicles & history",
    description: "Keep track of all your vehicles and ticket history in one place",
    image: require("../../../assets/onboarding/car.png"),
    imageStyle: { width: 170, height: 170 },
  },
];

export default function OnboardingCarousel() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = async () => {
  if (currentIndex < slides.length - 1) {
    flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
  } else {
    await AsyncStorage.setItem("onboarding_shown", "true");
    navigation.reset({ index: 0, routes: [{ name: "Auth", params: { screen: "SignIn" } }] });
  }
};


  const renderItem = ({ item }: any) => (
    <View style={{ width }} className='flex-1 items-center justify-center'>
      <ThemedView className="items-center justify-center px-6">
        <Image source={item.image} style={item.imageStyle} resizeMode="contain" className="mb-8" />
        <ThemedText size="xl" weight="semibold" className="text-center mb-2">{item.title}</ThemedText>
        <ThemedText variant="secondary" className="text-center" size="base">{item.description}</ThemedText>
      </ThemedView>
    </View>
  );

  return (
    <ThemedView className="flex-1 border">
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={renderItem}
        onScroll={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      {/* Dots */}
      <ThemedView className="flex-row justify-center mt-6 mb-4">
        {slides.map((_, i) => (
          <ThemedView
            key={i}
            className={`h-2 w-2 rounded-full mx-1`}
            style={{
              backgroundColor: i === currentIndex 
                ? (theme === 'dark' ? '#3B82F6' : '#2563EB')
                : (theme === 'dark' ? '#4A5158' : '#E5E7EB')
            }}
          />
        ))}
      </ThemedView>

      {/* Next / Get Started */}
      <ThemedView className="items-center mb-10">
        {currentIndex === slides.length - 1 ? (
          <ThemedButton
            onPress={handleNext}
            variant="primary"
            size="lg"
            className="w-10/12"
          >
            Get Started
          </ThemedButton>
        ) : (
          <TouchableOpacity
            onPress={handleNext}
            className="px-6 py-2"
          >
            <ThemedText 
              size="base" 
              weight="medium"
              style={{
                color: theme === 'dark' ? '#3B82F6' : '#2563EB'
              }}
            >
              Next →
            </ThemedText>
          </TouchableOpacity>
        )}
      </ThemedView>
    </ThemedView>
  );
}
