import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Image,
  ImageBackground,
} from "react-native";
import { app, supabase } from "../../config";
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  child,
  get,
} from "firebase/database";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Buffer } from "buffer";

const database = getDatabase(app);

export default function ChatGroup(props) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [location, setLocation] = useState(null);
  const [file, setFile] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showOptions, setShowOptions] = useState(false);

  const GROUP_DISCUSSION_ID = "group_chat_general";
  const ref_les_profils = ref(database, "/lesProfils");
  const ref_group_discussion = ref(
    database,
    `/lesDiscussions/${GROUP_DISCUSSION_ID}`
  );

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const snapshot = await get(ref_les_profils);
        const profiles = [];
        snapshot.forEach((unProfil) => {
          const user = unProfil.val();
          if (user.id !== props.route.params.currentId) {
            const userStatusRef = ref(database, `/status/${user.id}`);
            get(userStatusRef).then((statusSnapshot) => {
              const status = statusSnapshot.val();
              user.isOnline = status && status.state === "online";
              profiles.push(user);
              if (profiles.length === snapshot.size - 1) {
                setGroupMembers(profiles);
              }
            });
          } else {
            setCurrentUser(user);
          }
        });
      } catch (error) {
        console.error("Error fetching profiles:", error);
      }
    };

    const messagesListener = onValue(ref_group_discussion, (snapshot) => {
      const fetchedMessages = [];
      snapshot.forEach((childSnapshot) => {
        if (childSnapshot.key !== "typing") {
          fetchedMessages.push(childSnapshot.val());
        }
      });
      setMessages(fetchedMessages.reverse());
    });

    const typingListener = onValue(
      child(ref_group_discussion, "typing"),
      (snapshot) => {
        if (snapshot.val() && snapshot.val() !== props.route.params.currentId) {
          setIsTyping(true);
        } else {
          setIsTyping(false);
        }
      }
    );

    fetchProfiles();

    return () => {
      messagesListener();
      typingListener();
    };
  }, [props.route.params.currentId]);

  const handleInputChange = (text) => {
    setInputText(text);
    if (text) {
      set(
        ref(database, `/lesDiscussions/${GROUP_DISCUSSION_ID}/typing`),
        props.route.params.currentId
      ).catch((error) => {
        console.error("Error setting typing status:", error);
      });
    } else {
      set(
        ref(database, `/lesDiscussions/${GROUP_DISCUSSION_ID}/typing`),
        null
      ).catch((error) => {
        console.error("Error clearing typing status:", error);
      });
    }
  };
  const sendCameraPhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Camera permission is required to take photos."
        );
        return;
      }

      // Launch the camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true, // Allow basic photo editing
        aspect: [4, 3],
        quality: 1,
      });

      // Check if the user canceled the action
      if (result.canceled || !result.assets || result.assets.length === 0) {
        Alert.alert("Action Canceled", "No photo was taken.");
        return;
      }

      const uriLocal = result.assets[0].uri;
      const response = await fetch(uriLocal);
      const blob = await response.blob();
      const arraybuffer = await new Response(blob).arrayBuffer();

      // Upload the image to storage
      await supabase.storage
        .from("WhatsappCloneStorage")
        .upload(currentId + "-camera", arraybuffer, {
          upsert: true,
        });

      const { data } = supabase.storage
        .from("WhatsappCloneStorage")
        .getPublicUrl(currentId + "-camera");
      const publicImageUrl = data.publicUrl;

      // Create the message object
      const message = {
        id: Date.now().toString(),
        text: "", // No text for the image message
        sender: currentId,
        date: new Date().toISOString(),
        receiver: profile.id,
        file: publicImageUrl,
      };

      sendMessageWithDetails(message); // Send the image message
      setFile(publicImageUrl); // Update the state with the image URL
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", error.message || "Failed to take a photo.");
    }
  };

  const sendMessage = async () => {
    if (inputText.trim() === "" && !location && !file) return;

    const newMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: props.route.params.currentId,
      date: new Date().toISOString(),
      location: location || null,
      file: file || null,
    };

    const newMessageRef = ref(
      database,
      `/lesDiscussions/${GROUP_DISCUSSION_ID}`
    );
    const newMessageKey = push(newMessageRef).key;

    set(
      ref(database, `/lesDiscussions/${GROUP_DISCUSSION_ID}/${newMessageKey}`),
      newMessage
    )
      .then(() => {
        set(
          ref(database, `/lesDiscussions/${GROUP_DISCUSSION_ID}/typing`),
          null
        );
        setInputText("");
        setLocation(null);
        setFile(null);
      })
      .catch((error) => {
        console.error("Error sending message:", error);
        Alert.alert("Error", "Failed to send the message.");
      });
  };

  const sendLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Location permission is required.");
      return;
    }

    const userLocation = await Location.getCurrentPositionAsync({});
    const message = {
      id: Date.now().toString(),
      text: "Shared Location",
      sender: props.route.params.currentId,
      date: new Date().toISOString(),
      location: userLocation.coords,
    };

    setLocation(userLocation.coords);
    sendMessageWithDetails(message);
  };

  const sendFile = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 1,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.error("Invalid or canceled image selection");
        Alert.alert("Error", "No valid image was selected.");
        return;
      }

      const uriLocal = result.assets[0].uri;
      const response = await fetch(uriLocal);
      const blob = await response.blob();
      const arraybuffer = await new Response(blob).arrayBuffer();

      await supabase.storage
        .from("WhatsappCloneStorage")
        .upload(props.route.params.currentId, arraybuffer, {
          upsert: true,
        });

      const { data } = supabase.storage
        .from("WhatsappCloneStorage")
        .getPublicUrl(props.route.params.currentId);
      const publicImageUrl = data.publicUrl;

      const message = {
        id: Date.now().toString(),
        text: "Shared Image",
        sender: props.route.params.currentId,
        date: new Date().toISOString(),
        file: publicImageUrl,
      };

      sendMessageWithDetails(message);
      setFile(publicImageUrl);
    } catch (error) {
      console.error("Error sending file:", error);
      Alert.alert("Error", error.message || "Failed to send the file.");
    }
  };

  const sendMessageWithDetails = (message) => {
    const newMessageRef = ref(
      database,
      `/lesDiscussions/${GROUP_DISCUSSION_ID}`
    );
    const newMessageKey = push(newMessageRef).key;

    set(
      ref(database, `/lesDiscussions/${GROUP_DISCUSSION_ID}/${newMessageKey}`),
      message
    )
      .then(() => {
        set(
          ref(database, `/lesDiscussions/${GROUP_DISCUSSION_ID}/typing`),
          null
        );
        setInputText("");
        setLocation(null);
        setFile(null);
      })
      .catch((error) => {
        console.error("Error sending message:", error);
        Alert.alert("Error", "Failed to send the message.");
      });
  };

  const openUrl = (url) => {
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open URL", err)
    );
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender === props.route.params.currentId;
    const formattedDate = new Date(item.date).toLocaleTimeString();

    return (
      <View
        style={[
          styles.messageContainer,
          isMe ? styles.myMessage : styles.otherMessage,
        ]}
      >
        {!isMe && <Text style={styles.senderName}>{item.senderName}</Text>}
        <Text style={styles.messageText}>{item.text}</Text>
        {item.location && (
          <TouchableOpacity
            onPress={() =>
              openUrl(
                `https://maps.google.com/?q=${item.location.latitude},${item.location.longitude}`
              )
            }
          >
            <Text style={styles.messageText}>
              Location: {item.location.latitude}, {item.location.longitude}
            </Text>
          </TouchableOpacity>
        )}
        {item.file && (
          <TouchableOpacity onPress={() => openUrl(item.file)}>
            <Text style={styles.messageText}>View File</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.timestamp}>{formattedDate}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ImageBackground
        source={require("../../assets/chat63.jpg")}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.headerText}>Group Chat</Text>
        </View>
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          inverted
        />
        {isTyping && <Text style={styles.typing}>Someone is typing...</Text>}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={handleInputChange}
          />

          <TouchableOpacity
            onPress={() => setShowOptions(!showOptions)}
            style={styles.iconButton}
          >
            <MaterialCommunityIcons
              name="dots-vertical"
              size={30}
              color="#444"
            />
          </TouchableOpacity>
          {showOptions && (
            <>
              <TouchableOpacity
                onPress={sendLocation}
                style={styles.iconButton}
              >
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={30}
                  color="#444"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={sendFile} style={styles.iconButton}>
                <MaterialCommunityIcons
                  name="file-outline"
                  size={30}
                  color="#444"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={sendCameraPhoto}
                style={styles.iconButton}
              >
                <MaterialCommunityIcons
                  name="camera-outline"
                  size={30}
                  color="#444"
                />
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            {/* <Text style={styles.sendButtonText}>Send</Text> */}
            <MaterialCommunityIcons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7", // Light background
    paddingTop: Platform.OS === "ios" ? 40 : 0,
  },
  header: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff", // Light header background
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0", // Subtle border
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#075E54", // WhatsApp header background color
    borderRadius: 15,
    marginVertical: 8,
    shadowColor: "#000", // Shadow for depth
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5, // Android shadow effect
    position: "absolute", // Absolute positioning
    top: Platform.OS === "ios" ? 0 : 0, // Adjust for iOS status bar
    left: 0,
    right: 0,
    zIndex: 1,
  },
  headerText: {
    color: "#fff", // Darker text for better readability
    fontSize: 18,
    fontWeight: "bold",
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  messageContainer: {
    marginVertical: 5,
    padding: 10,
    borderRadius: 10,
    maxWidth: "80%",
    backgroundColor: "#E8F5E9", // Soft green for messages
    elevation: 1, // Small elevation for depth
  },
  myMessage: {
    backgroundColor: "#C8E6C9", // Light green for sent messages
    alignSelf: "flex-end",
  },
  otherMessage: {
    backgroundColor: "#FFF", // White for received messages
    alignSelf: "flex-start",
    borderColor: "#E0E0E0",
    borderWidth: 1,
  },
  senderName: {
    color: "#388E3C", // Green for sender name
    fontWeight: "bold",
  },
  messageText: {
    color: "#333", // Dark text for messages
    marginVertical: 5,
  },
  timestamp: {
    color: "#666", // Subtle timestamp color
    fontSize: 10,
    alignSelf: "flex-end",
  },
  typing: {
    color: "#777",
    textAlign: "center",
    marginVertical: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#DDD", // Lighter border
    backgroundColor: "#FFF", // White input background
  },
  textInput: {
    flex: 1,
    backgroundColor: "#F2F2F2", // Light gray input background
    color: "#333", // Dark text in input
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  iconButton: {
    marginHorizontal: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButton: {
    backgroundColor: "#4CAF50", // Green send button
    padding: 10,
    borderRadius: 20,
  },
  sendButtonText: {
    color: "#FFF", // White text
    fontWeight: "bold",
  },
});
