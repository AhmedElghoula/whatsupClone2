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
  Modal,
  ImageBackground,
} from "react-native";
import { app, supabase } from "../config";
import { getDatabase, ref, push, set, onValue, child } from "firebase/database";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const database = getDatabase(app);

export default function Chat(props) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [location, setLocation] = useState(null);
  const [file, setFile] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const profile = props.route.params.profile;
  const currentId = props.route.params.currentId;
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const openFullScreenImage = (imageUri) => {
    setSelectedImage(imageUri);
    setModalVisible(true);
  };

  const closeFullScreenImage = () => {
    setSelectedImage(null);
    setModalVisible(false);
  };
  const idDiscussion =
    currentId > profile.id ? currentId + profile.id : profile.id + currentId;

  const ref_uneDiscussion = ref(database, `/lesDiscussions/${idDiscussion}`);

  useEffect(() => {
    const messagesListener = onValue(ref_uneDiscussion, (snapshot) => {
      const fetchedMessages = [];
      snapshot.forEach((childSnapshot) => {
        if (childSnapshot.key !== "typing") {
          fetchedMessages.push(childSnapshot.val());
        }
      });
      setMessages(fetchedMessages.reverse());
    });

    const typingListener = onValue(
      child(ref_uneDiscussion, "typing"),
      (snapshot) => {
        if (snapshot.val() && snapshot.val() !== currentId) {
          setIsTyping(true);
        } else {
          setIsTyping(false);
        }
      }
    );

    return () => {
      messagesListener();
      typingListener();
    };
  }, []);

  const handleInputChange = (text) => {
    setInputText(text);
    if (text) {
      set(
        ref(database, `/lesDiscussions/${idDiscussion}/typing`),
        currentId
      ).catch((error) => {
        console.error("Error setting typing status:", error);
      });
    } else {
      set(ref(database, `/lesDiscussions/${idDiscussion}/typing`), null).catch(
        (error) => {
          console.error("Error clearing typing status:", error);
        }
      );
    }
  };

  const sendMessage = async () => {
    if (inputText.trim() === "" && !location && !file) return;

    const newMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: currentId,
      date: new Date().toISOString(),
      receiver: profile.id,
      location: location || null,
      file: file || null,
    };

    const newMessageRef = ref(database, `/lesDiscussions/${idDiscussion}`);
    const newMessageKey = push(newMessageRef).key;

    set(
      ref(database, `/lesDiscussions/${idDiscussion}/${newMessageKey}`),
      newMessage
    )
      .then(() => {
        set(ref(database, `/lesDiscussions/${idDiscussion}/typing`), null);
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
    // Ask for location permissions
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Location permission is required.");
      return;
    }

    // Get user's current location
    const userLocation = await Location.getCurrentPositionAsync({});
    const message = {
      id: Date.now().toString(),
      text: "",
      sender: currentId,
      date: new Date().toISOString(),
      receiver: profile.id,
      location: userLocation.coords,
    };

    setLocation(userLocation.coords); // Save location for sending
    sendMessageWithDetails(message);
  };

  const sendFile = async () => {
    try {
      // Use ImagePicker to select an image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Restrict to images only
        allowsEditing: false,
        aspect: [4, 3],
        quality: 1,
      });

      // Log the result to see what is returned
      console.log("Image picker result:", result);

      // Check if the user canceled the image picker or if the result is invalid
      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.error("Invalid or canceled image selection");
        Alert.alert("Error", "No valid image was selected.");
        return; // Exit if no image was selected or picker was canceled
      }

      // Get the selected image URI
      const uriLocal = result.assets[0].uri;
      const response = await fetch(uriLocal);
      const blob = await response.blob();
      const arraybuffer = await new Response(blob).arrayBuffer();
      // Extract the file extension from the image name (assume it has a proper extension)
      await supabase.storage
        .from("WhatsappCloneStorage")
        .upload(currentId, arraybuffer, {
          upsert: true,
        });

      const { data } = supabase.storage
        .from("WhatsappCloneStorage")
        .getPublicUrl(currentId);
      const publicImageUrl = data.publicUrl;

      // Upload the image and get the public URL

      // Log the public URL
      console.log("Public Image URL:", publicImageUrl);

      // Create the message with the public URL
      const message = {
        id: Date.now().toString(),
        text: "", // You can modify this as needed
        sender: currentId,
        date: new Date().toISOString(),
        receiver: profile.id,
        file: publicImageUrl, // Set the public URL of the image to be sent
      };

      // Log the message object
      console.log("Message object:", message);

      // Send the message with the public URL
      sendMessageWithDetails(message); // Send the message with the image URL
      setFile(publicImageUrl); // Update the state with the image public URL
    } catch (error) {
      console.error("Error sending file:", error);
      Alert.alert("Error", error.message || "Failed to send the file.");
    }
  };

  const sendMessageWithDetails = (message) => {
    const newMessageRef = ref(database, `/lesDiscussions/${idDiscussion}`);
    const newMessageKey = push(newMessageRef).key;

    set(
      ref(database, `/lesDiscussions/${idDiscussion}/${newMessageKey}`),
      message
    )
      .then(() => {
        set(ref(database, `/lesDiscussions/${idDiscussion}/typing`), null);
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

  const renderMessage = ({ item }) => {
    const isMe = item.sender === currentId;
    const formattedDate = new Date(item.date).toLocaleTimeString();

    return (
      <View
        style={[
          styles.messageContainer,
          isMe ? styles.myMessage : styles.otherMessage,
        ]}
      >
        {item.text ? <Text style={styles.messageText}>{item.text}</Text> : null}

        {/* Location Preview */}
        {item.location && (
          <TouchableOpacity
            style={styles.locationContainer}
            onPress={() =>
              openUrl(
                `https://maps.google.com/?q=${item.location.latitude},${item.location.longitude}`
              )
            }
          >
            <MaterialCommunityIcons
              name="map-marker-radius"
              size={24}
              color={isMe ? "#fff" : "#0F52BA"}
            />
            <Text
              style={[
                styles.locationText,
                isMe ? styles.myLocationText : styles.otherLocationText,
              ]}
            >
              Location: {item.location.latitude.toFixed(2)},{" "}
              {item.location.longitude.toFixed(2)}
            </Text>
          </TouchableOpacity>
        )}

        {item.file && (
          <View style={styles.filePreviewContainer}>
            <Image
              source={{ uri: item.file }}
              style={styles.filePreviewImage}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.viewFileButton}
              onPress={() => openFullScreenImage(item.file)}
            >
              <Text style={styles.viewFileButtonText}>View Full</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Full-Screen Image Modal */}
        <Modal
          visible={modalVisible}
          transparent={false}
          animationType="slide"
          onRequestClose={closeFullScreenImage}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeFullScreenImage}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
          </View>
        </Modal>

        <Text style={styles.timestamp}>{formattedDate}</Text>
      </View>
    );
  };

  const handleCallPress = (profile) => {
    if (profile.telephone) {
      const phoneNumber = `tel:${profile.telephone}`;
      Linking.openURL(phoneNumber).catch((err) => {
        console.error("Error opening dialer:", err);
        Alert.alert("Error", "Unable to make a call. Please try again later.");
      });
    } else {
      Alert.alert("No Number", "The user has no phone number available.");
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flexGrow}
      >
        <ImageBackground
          source={require("../assets/chat63.jpg")}
          style={styles.container}
        >
          <View style={styles.userCard}>
            <Image
              source={
                profile.urlImage
                  ? { uri: profile.urlImage }
                  : require("../assets/profil.png")
              }
              style={styles.avatar}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{profile.nom}</Text>
              <TouchableOpacity
                onPress={() => {
                  handleCallPress(profile);
                }}
                style={styles.callButton}
              >
                <Ionicons name="call-outline" size={24} color="green" />
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            inverted
          />
          {isTyping && <Text style={styles.typingIndicator}>Typing...</Text>}

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
                color="#1679AB"
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
                    color="#1679AB"
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={sendFile} style={styles.iconButton}>
                  <MaterialCommunityIcons
                    name="file-outline"
                    size={30}
                    color="#1679AB"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={sendCameraPhoto}
                  style={styles.iconButton}
                >
                  <MaterialCommunityIcons
                    name="camera-outline"
                    size={30}
                    color="#1679AB"
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
    flex: 1,
    backgroundColor: "#E5DDD5", // WhatsApp-like background color
    paddingTop: Platform.OS === "ios" ? 40 : 0, // Extra padding for iOS status bar
  },
  flexGrow: {
    flex: 1,
  },
  userCard: {
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
    zIndex: 1, // Ensure it's above other content
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5, // Circular avatar
    borderWidth: 2,
    borderColor: "#fff", // White border for the avatar
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff", // White text for username
  },
  callButton: {
    padding: 8,
    backgroundColor: "#25D366", // WhatsApp green color
    borderRadius: 30,
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingVertical: 15,
  },
  messageContainer: {
    maxWidth: "75%",
    borderRadius: 20,
    padding: 12,
    marginVertical: 6,
    borderWidth: 1,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#25D366", // WhatsApp green for sent messages
    borderColor: "#128C7E", // Darker green border for contrast
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF", // White background for received messages
    borderColor: "#ECE5DD", // Light border for received messages
  },
  messageText: {
    color: "#000", // Changed text color to black
    fontSize: 16,
  },
  filePreviewContainer: {
    marginTop: 10,
    borderRadius: 10,
    borderColor: "#ddd",
    borderWidth: 1,
    overflow: "hidden", // Rounded corners for the image preview
  },
  filePreviewImage: {
    width: 150,
    height: 150,
    borderRadius: 10,
  },
  viewFileButton: {
    padding: 8,
    backgroundColor: "#25D366", // WhatsApp green button
    borderRadius: 5,
    marginTop: 5,
  },
  viewFileButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#00000070", // Dark semi-transparent background
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  closeButton: {
    position: "absolute",
    top: 30,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 12,
    borderRadius: 50,
    zIndex: 10, // Higher zIndex to make sure it's clickable
    elevation: 5,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  timestamp: {
    fontSize: 10,
    color: "#999", // Light gray color for timestamps
    alignSelf: "flex-end",
    marginTop: 5,
  },
  typingIndicator: {
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 10,
    color: "#25D366", // WhatsApp green for typing indicator
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: "#fff",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  textInput: {
    flex: 1,
    height: Platform.OS === "ios" ? 45 : 50, // Adjust height for iOS
    borderColor: "#ccc",
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  iconButton: {
    marginHorizontal: 8,
  },
  sendButton: {
    backgroundColor: "#25D366", // WhatsApp green send button
    padding: 10,
    borderRadius: 50,
  },
});
