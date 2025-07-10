import React, { useState, useEffect } from "react";
import {
  BackHandler,
  Alert,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { app, supabase } from "../../config";
import { getDatabase, get, ref, set, serverTimestamp } from "firebase/database"; // Firebase v9+ imports
import { getAuth, signOut } from "firebase/auth";

const database = getDatabase(app);
const auth = getAuth(app);

export default function MyProfile(props) {
  const currentId = props.route.params.currentId;
  const cameFromNewUser = props.route.params.cameFromNewUser;
  const isProfileSaved = props.route.params.isProfileSaved;

  const [nom, setNom] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [telephone, setTelephone] = useState("");
  const [isDefaultImage, setIsDefaultImage] = useState(true);
  const [uriLocalImage, setUriLocalImage] = useState(null);
  const [isSaved, setIsSaved] = useState(false); // Track if profile is saved

  // Fetch user data from Firebase
  useEffect(() => {
    const ref_unprofil = ref(database, `/lesprefix/unprofil_${currentId}`);

    get(ref_unprofil)
      .then((snapshot) => {
        const data = snapshot.val();
        if (data) {
          setNom(data.nom || "");
          setPseudo(data.pseudo || "");
          setTelephone(data.telephone || "");
          if (data.urlImage) {
            setUriLocalImage(data.urlImage);
            setIsDefaultImage(false);
          }
        }
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });

    const backAction = () => {
      if (cameFromNewUser && !isSaved) {
        alert("Please fill and save your profile before switching tabs.");
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [cameFromNewUser, isSaved, currentId]);

  const disconnect = () => {
    const userStatusDatabaseRef = ref(
      database,
      `/status/${auth.currentUser.uid}`
    );

    set(userStatusDatabaseRef, {
      state: "offline",
      last_changed: serverTimestamp(),
    })
      .then(() => {
        return signOut(auth);
      })
      .then(() => {
        props.navigation.navigate("Auth");
      })
      .catch((error) => {
        alert("Error signing out: " + error.message);
      });
  };

  const uploadImageToStorage = async (uriLocal) => {
    const response = await fetch(uriLocal);
    const blob = await response.blob();
    const arraybuffer = await new Response(blob).arrayBuffer();

    await supabase.storage
      .from("WhatsappCloneStorage")
      .upload(currentId, arraybuffer, {
        upsert: true,
      });

    const { data } = supabase.storage
      .from("WhatsappCloneStorage")
      .getPublicUrl(currentId);
    const result = data.publicUrl;
    return result;
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setUriLocalImage(result.assets[0].uri);
      setIsDefaultImage(false);
      setIsSaved(false); // Mark as unsaved
    }
  };

  const saveProfile = async () => {
    if (!nom.trim() || !pseudo.trim() || !telephone.trim()) {
      alert("Please fill all fields before saving.");
      return;
    }

    if (!/^\d{8}$/.test(telephone)) {
      alert("Phone number must be exactly 8 digits.");
      return;
    }

    let urlImage = isDefaultImage
      ? null
      : await uploadImageToStorage(uriLocalImage);

    const ref_unprofil = ref(database, `/lesprefix/unprofil_${currentId}`);

    set(ref_unprofil, {
      id: currentId,
      nom,
      pseudo,
      telephone,
      urlImage,
    })
      .then(() => {
        alert("Profile updated successfully!");
        setIsSaved(true); // Mark as saved
        props.onProfileSave(true); // Notify parent component (Home) that the profile is saved
      })
      .catch((error) => {
        alert("Error saving profile: " + error.message);
      });
  };

  return (
    <ImageBackground
      source={require("../../assets/back1.jpg")}
      imageStyle={{ opacity: 0.6 }}
      style={styles.container}
    >
      <Text style={styles.textstyle}>My Account</Text>
      <TouchableHighlight onPress={pickImage}>
        <Image
          source={
            isDefaultImage
              ? require("../../assets/profil.png")
              : { uri: uriLocalImage }
          }
          style={styles.profileImage}
        />
      </TouchableHighlight>
      <TextInput
        value={nom}
        onChangeText={(text) => {
          setNom(text);
          setIsSaved(false); // Mark as unsaved when any field changes
        }}
        textAlign="center"
        placeholderTextColor="#95a5af"
        placeholder="Full Name"
        keyboardType="default"
        style={styles.textinputstyle}
      />
      <TextInput
        value={pseudo}
        onChangeText={(text) => {
          setPseudo(text);
          setIsSaved(false); // Mark as unsaved when any field changes
        }}
        textAlign="center"
        placeholderTextColor="#95a5af"
        placeholder="Username"
        keyboardType="default"
        style={styles.textinputstyle}
      />
      <TextInput
        value={telephone}
        onChangeText={(text) => {
          setTelephone(text);
          setIsSaved(false); // Mark as unsaved when any field changes
        }}
        placeholderTextColor="#95a5af"
        textAlign="center"
        placeholder="Phone Number"
        style={styles.textinputstyle}
      />
      <View style={styles.buttonContainer}>
        <TouchableHighlight
          onPress={saveProfile}
          activeOpacity={0.5}
          underlayColor="#DDDDDD"
          style={styles.saveButton}
        >
          <Text style={styles.buttonText}>Save</Text>
        </TouchableHighlight>
        <TouchableHighlight
          onPress={disconnect}
          activeOpacity={0.5}
          underlayColor="#DDDDDD"
          style={styles.disconnectButton}
        >
          <Text style={styles.buttonText}>Disconnect</Text>
        </TouchableHighlight>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  textstyle: {
    fontSize: 40,
    fontFamily: "serif",
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 15,
  },
  profileImage: {
    height: 150,
    width: 150,
    borderRadius: 75,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#fff",
  },
  textinputstyle: {
    fontWeight: "bold",
    backgroundColor: "#f4f4f4",
    fontSize: 18,
    color: "#000",
    width: "80%",
    height: 50,
    borderRadius: 30,
    margin: 10,
    paddingLeft: 15,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 20,
    width: "80%",
  },
  saveButton: {
    backgroundColor: "#25D366",
    borderRadius: 30,
    height: 50,
    width: "45%",
    justifyContent: "center",
    alignItems: "center",
  },
  disconnectButton: {
    backgroundColor: "#BB0A21",
    borderRadius: 30,
    height: 50,
    width: "45%",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
  },
});
