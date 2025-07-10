import React, { useState } from "react";
import {
  Button,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { app } from "../config";

const auth = getAuth(app);

export default function NewUser(props) {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  return (
    <ImageBackground
      source={require("../assets/back2.jpg")}
      style={styles.container}
    >
      <View style={styles.container2}>
        <Text style={styles.headerText}>Create account</Text>

        <TextInput
          style={styles.textInputStyle}
          keyboardType="email-address"
          placeholder="Enter your email"
          placeholderTextColor="#BDBDBD"
          value={email}
          onChangeText={(text) => setEmail(text)}
        />

        <TextInput
          style={styles.textInputStyle}
          secureTextEntry
          placeholder="Enter your password"
          placeholderTextColor="#BDBDBD"
          value={pwd}
          onChangeText={(text) => setPwd(text)}
        />

        <TextInput
          style={styles.textInputStyle}
          secureTextEntry
          placeholder="Confirm your password"
          placeholderTextColor="#BDBDBD"
          value={confirmPwd}
          onChangeText={(text) => setConfirmPwd(text)}
        />

        <View style={styles.buttonContainer}>
          <Button
            title="Submit"
            color="#25D366" // WhatsApp green color
            onPress={() => {
              if (pwd !== confirmPwd) {
                alert("Passwords do not match!");
                return;
              }

              createUserWithEmailAndPassword(auth, email, pwd)
                .then(() => {
                  const currentId = auth.currentUser.uid;
                  // Navigate to MyProfile with cameFromNewUser flag
                  props.navigation.replace("Home", {
                    screen: "MyProfile",
                    currentId: currentId,
                    cameFromNewUser: true, // Flag indicating the user came from NewUser
                  });
                })
                .catch((error) => {
                  alert(error.message);
                });
            }}
          />
          <Button
            title="Exit"
            color="#bb0a21" // Exit button with red color
            onPress={() => props.navigation.goBack()}
          />
        </View>
      </View>
      <StatusBar style="light" />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#333", // Dark background
    justifyContent: "center",
    alignItems: "center",
  },
  container2: {
    backgroundColor: "#212738", // Dark card-like container
    alignItems: "center",
    justifyContent: "center",
    height: 350,
    width: "80%",
    borderRadius: 15,
    padding: 20,
  },
  headerText: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#E4E4E4", // Light text color for header
    marginBottom: 15,
  },
  textInputStyle: {
    height: 45,
    width: "90%",
    paddingLeft: 15,
    backgroundColor: "#444", // Dark background for inputs
    color: "#E4E4E4", // Light text color for inputs
    marginTop: 10,
    marginBottom: 5,
    borderRadius: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginTop: 20,
  },
});
