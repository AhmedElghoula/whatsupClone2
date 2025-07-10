import React, { useState } from "react";
import {
  BackHandler,
  Button,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  Image,
} from "react-native";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  getDatabase,
  ref,
  set,
  onDisconnect,
  serverTimestamp,
} from "firebase/database";
import { app } from "../config"; // Import the initialized Firebase app

const auth = getAuth(app);
const database = getDatabase(app);

export default function Auth(props) {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");

  // Function to update user's status to online in Firebase
  const setUserOnlineStatus = (userId) => {
    const userStatusDatabaseRef = ref(database, `/status/${userId}`);

    // User status data to set online
    const isOnlineForDatabase = {
      state: "online",
      last_changed: serverTimestamp(),
    };

    // Set the user status to online when they sign in
    set(userStatusDatabaseRef, isOnlineForDatabase);

    // Automatically set user to offline when they disconnect or log out
    onDisconnect(userStatusDatabaseRef).set({
      state: "offline",
      last_changed: serverTimestamp(),
    });
  };

  return (
    <ImageBackground
      source={require("../assets/back2.jpg")}
      style={styles.container}
    >
      <View style={styles.authContainer}>
        <Image source={require("../assets/aaad.png")} style={styles.logo} />
        <TextInput
          style={styles.textInputStyle}
          keyboardType="email-address"
          placeholder="Enter your email"
          placeholderTextColor="#BDBDBD"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.textInputStyle}
          secureTextEntry
          placeholder="Enter your password"
          placeholderTextColor="#BDBDBD"
          value={pwd}
          onChangeText={setPwd}
        />
        <View style={styles.buttonContainer}>
          <Button
            color="#25D366" // WhatsApp green color
            onPress={() => {
              signInWithEmailAndPassword(auth, email, pwd)
                .then(() => {
                  const currentId = auth.currentUser.uid;

                  // Set the user's online status when they log in
                  setUserOnlineStatus(currentId);

                  // Navigate to Home screen with currentUserId
                  props.navigation.navigate("Home", { currentId });
                })
                .catch((error) => {
                  Alert.alert("Error", error.message);
                });
            }}
            title="Log In"
          />
          <Button
            onPress={() => {
              BackHandler.exitApp();
            }}
            title="Exit"
            color="#bb0a21" // Red color for exit button
          />
        </View>
        <Text
          style={styles.textStyle}
          onPress={() => {
            props.navigation.navigate("NewUser");
          }}
        >
          Create new account?
        </Text>
      </View>
      <StatusBar style="light" />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)", // Dark overlay for better readability
  },
  authContainer: {
    backgroundColor: "#333", // Dark card-like container
    alignItems: "center",
    justifyContent: "center",
    width: "80%",
    padding: 20,
    borderRadius: 15,
    boxShadow: "0 10px 20px rgba(0, 0, 0, 0.3)",
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  textInputStyle: {
    height: 45,
    width: "100%",
    backgroundColor: "#444", // Dark background for inputs
    color: "#E4E4E4", // Light text color for inputs
    marginBottom: 15,
    borderRadius: 8,
    paddingLeft: 15,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginTop: 20,
  },
  textStyle: {
    color: "#25D366", // WhatsApp green color
    marginTop: 15,
    fontSize: 16,
  },
});
