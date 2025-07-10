import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableHighlight,
  StyleSheet,
  ImageBackground,
  Platform,
  TextInput,
} from "react-native";
import { app } from "../../config";
import { getDatabase, ref, get } from "firebase/database";

// Get database instance
const database = getDatabase(app);
const ref_les_profils = ref(database, "/lesprefix");

export default function ListProfile(props) {
  const currentId = props.route.params.currentId;
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    // Fetch user profiles and their online status
    const fetchProfiles = async () => {
      try {
        const snapshot = await get(ref_les_profils);
        const profiles = [];
        snapshot.forEach((unProfil) => {
          const user = unProfil.val();
          if (user.id !== currentId) {
            const userStatusRef = ref(database, `/status/${user.id}`);
            get(userStatusRef).then((statusSnapshot) => {
              const status = statusSnapshot.val();
              user.isOnline = status && status.state === "online";
              profiles.push(user);
              setData((prevData) => [...prevData, user]);
            });
          }
        });
      } catch (error) {
        console.error("Error fetching profiles:", error);
      }
    };

    fetchProfiles();
  }, [currentId]);

  // Filter profiles based on search text
  useEffect(() => {
    const filtered = data.filter((item) =>
      `${item.nom} ${item.pseudo}`
        .toLowerCase()
        .includes(searchText.toLowerCase())
    );
    setFilteredData(filtered);
  }, [searchText, data]);

  return (
    <ImageBackground
      source={require("../../assets/back2.jpg")}
      imageStyle={{ opacity: 0.5 }}
      style={styles.container}
    >
      <TextInput
        style={styles.searchBar}
        placeholder="Search profiles..."
        placeholderTextColor="#aaa"
        value={searchText}
        onChangeText={setSearchText}
      />
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableHighlight
            onPress={() => {
              props.navigation.navigate("Chat", {
                profile: item,
                currentId: currentId,
              });
            }}
            underlayColor="#ddd"
            style={styles.contactContainer}
          >
            <View style={styles.contactInner}>
              {/* Profile Image */}
              <Image
                source={
                  item.urlImage
                    ? { uri: item.urlImage }
                    : require("../../assets/profil.png")
                }
                style={styles.profileImage}
              />
              {/* Contact Info */}
              <View style={styles.textContainer}>
                <Text style={styles.contactName}>{item.nom}</Text>
                <Text style={styles.contactPseudo}>{item.pseudo}</Text>
              </View>
              {/* Green Dot for online status */}
              {item.isOnline && <View style={styles.onlineDot}></View>}
            </View>
          </TouchableHighlight>
        )}
        style={styles.listContainer}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 40 : 0,
    backgroundColor: "#444",
  },
  searchBar: {
    height: 40,
    margin: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    color: "#333",
    fontSize: 16,
  },
  listContainer: {
    width: "100%",
    padding: 10,
  },
  contactContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginBottom: 10,
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    shadowColor: "#ddd",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#e6e6e6",
  },
  contactInner: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#dcdcdc",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  contactName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  contactPseudo: {
    fontSize: 14,
    color: "#777",
    marginTop: 4,
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#34C759",
    position: "absolute",
    top: 12,
    right: 12,
  },
});
