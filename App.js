import { View, Text } from "react-native";
import React, { useEffect } from "react";
import Auth from "./screens/Auth";
import NewUser from "./screens/NewUser";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "./screens/Home";
import Chat from "./screens/Chat";

const Stack = createNativeStackNavigator();
import * as SplashScreen from "expo-splash-screen";

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function App() {
  useEffect(() => {
    const hideSplashScreen = async () => {
      // Wait for some asynchronous tasks, like loading data or setting up resources
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Simulate delay

      // Hide the splash screen after 3 seconds
      SplashScreen.hideAsync();
    };

    hideSplashScreen();
  }, []);
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={Auth}></Stack.Screen>
        <Stack.Screen
          name="NewUser"
          component={NewUser}
          options={{ headerShown: true }}
        ></Stack.Screen>
        <Stack.Screen name="Home" component={Home}></Stack.Screen>
        <Stack.Screen name="Chat" component={Chat}></Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
