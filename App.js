import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import OpenSettings from "react-native-open-settings";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import * as IntentLauncher from "expo-intent-launcher";
import { Icon } from "react-native-elements";
import { Dimensions } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { Input } from "react-native-elements";
import { color } from "react-native-elements/dist/helpers";
import PrivacyPolicyText from "./PrivacyPolicy";
import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";

SplashScreen.preventAutoHideAsync();

const loadFonts = async () => {
  await Font.loadAsync({
    "FontAwesome5Free-Solid": require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Solid.ttf"),
    "FontAwesome5Free-Regular": require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Regular.ttf"),
    "FontAwesome5Brands-Regular": require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome5_Brands.ttf"),
  });
};

export default function App() {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [passwordVisible, setPasswordVisible] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  const clearValues = () => {
    setUsername("");
    setPassword("");
    setTitle("");
  };


  const fetchAccounts = async () => {
    try {
      let result = await SecureStore.getItemAsync("accounts");
      if (result) {
        setAccounts(JSON.parse(result));
        const visibilityStates = {};
        JSON.parse(result).forEach((account) => {
          visibilityStates[account.id] = false;
        });
        setPasswordVisible(visibilityStates);
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
      Alert.alert("Error", "Failed to load accounts from secure storage.");
    }
  };

  useEffect(() => {
    async function load() {
      try {
        await SplashScreen.preventAutoHideAsync();
        await loadFonts();
      } catch (e) {
        console.warn(e);
      } finally {
        setFontsLoaded(true);
        await SplashScreen.hideAsync();
      }
    }
    load();
    fetchAccounts();
  }, []);

  if (!fontsLoaded) {
    return null; // Render nothing while waiting for fonts to load
  }

  const togglePrivacyModal = () => {
    setModalVisible(!modalVisible);
  };

  const openSettings = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:");
      Alert.alert(
        "Navigate to Face ID & Passcode",
        "Please go to Settings > Face ID & Passcode to enable or configure your biometrics.",
        [{ text: "OK" }]
      );
    } else if (Platform.OS === "android") {
      IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS
      );
      Alert.alert(
        "Navigate to Security Settings",
        "Please go to Settings > Security to enable or configure your biometrics.",
        [{ text: "OK" }]
      );
    }
  };

  async function authenticate() {
    try {
      // Check for hardware and biometric records
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const supportedBiometrics =
        await LocalAuthentication.supportedAuthenticationTypesAsync();
      const isBiometricSupported = supportedBiometrics.length > 0;

      if (!hasHardware || !isBiometricSupported) {
        Alert.alert(
          "Unavailable",
          "Your device does not support or is not configured for biometric authentication."
        );
        return;
      }

      // Perform the authentication
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to access your Password Keeper",
        fallbackLabel: "Use Passcode",
        disableDeviceFallback: false,
      });

      // Handle the outcome of the biometric authentication
      if (authResult.success) {
        console.log("Authentication successful!");
        // Set the authentication state or proceed further
        setIsAuthenticated(true);
      } else {
        if (
          authResult.error === "user_cancel" ||
          authResult.error === "system_cancel"
        ) {
          Alert.alert(
            "Authentication Cancelled",
            "Authentication was cancelled by the user or the system."
          );
        } else {
          Alert.alert(
            "Authentication Failed",
            "You could not be verified. Please try again or use your passcode.",
            [
              { text: "Try Again", onPress: () => authenticate() },
              { text: "Cancel", style: "cancel" },
            ]
          );
        }
      }
    } catch (error) {
      console.error("Authentication error:", error);
      Alert.alert(
        "Authentication Error",
        "An unexpected error occurred during authentication."
      );
    }
  }

  const saveAccount = async (key, value) => {
    await SecureStore.setItemAsync(key, JSON.stringify(value));
  };

  const addAccount = () => {
    const newAccount = { id: Date.now(), title, username, password };
    const newAccounts = [...accounts, newAccount];
    saveAccount("accounts", newAccounts).then(() => {
      setAccounts(newAccounts);
      handleToggleForm();
    });
  };

  const handleDeleteItem = (itemId) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this item?",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: () => {
            const updatedAccounts = accounts.filter(
              (account) => account.id !== itemId
            );
            saveAccount("accounts", updatedAccounts).then(() => {
              setAccounts(updatedAccounts);
            });
          },
        },
      ]
    );
  };

  const handleEditItem = (itemId) => {
    const selectedItem = accounts.find((item) => item.id === itemId);
    if (selectedItem) {
      setSelectedItemId(itemId);
      setTitle(selectedItem.title);
      setUsername(selectedItem.username);
      setPassword(selectedItem.password);
      setShowForm(true);
    } else {
      console.log("Item not found");
    }
  };

  const handleUpdateItem = () => {
    const updatedAccount = { id: selectedItemId, title, username, password };
    const updatedAccounts = accounts.map((account) =>
      account.id === selectedItemId ? updatedAccount : account
    );
    saveAccount("accounts", updatedAccounts).then(() => {
      setAccounts(updatedAccounts);
      // Reset visibility for all accounts
      const resetVisibility = {};
      updatedAccounts.forEach((account) => {
        resetVisibility[account.id] = false;
      });
      setPasswordVisible(resetVisibility);
      setShowForm(false);
      setSelectedItemId(null);
      clearValues();
    });
  };

  const togglePasswordVisibility = (itemId) => {
    setPasswordVisible((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleToggleForm = () => {
    setShowForm((prev) => {
      if (prev) {
        // If currently showing the form and about to hide it
        // Reset password visibility for all accounts
        const resetVisibility = {};
        accounts.forEach((account) => {
          resetVisibility[account.id] = false;
        });
        setPasswordVisible(resetVisibility);
        // Also reset selected item ID when closing the form
        setSelectedItemId(null);
        clearValues();
      }
      return !prev;
    });
  };

  if (!isAuthenticated) {
    return (
      <LinearGradient
        colors={["#D0D0D0", "#808080"]} // Gradient from light to dark
        style={styles.initialScreen}
      >
        <View style={styles.title2}>
          <Text style={styles.simple}>Simple</Text>
          <Text style={styles.passwordKeeper}> Password Keeper</Text>
          <StatusBar style="auto" />
        </View>
        <Text style={styles.loadingText}>Please authenticate to continue</Text>
        <TouchableOpacity style={styles.loginButton} onPress={authenticate}>
          <Icon name="lock" type="antdesign" size={45} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={togglePrivacyModal}
        >
          <Icon name="privacy-tip" type="MaterialIcons" color="white" />
        </TouchableOpacity>
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={togglePrivacyModal}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <ScrollView style={{ maxHeight: "90%" }}>
                <PrivacyPolicyText />
              </ScrollView>
              <TouchableOpacity
                style={[styles.button, styles.buttonClose]}
                onPress={togglePrivacyModal}
              >
                <Text style={styles.textStyle}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    );
  }

  const renderFooter = () => {
    return (
      <View style={{ paddingVertical: 20, paddingBottom: 30 }}>
        <TouchableOpacity style={styles.button} onPress={handleToggleForm}>
          <View style={styles.plus}>
            <View style={styles.horizontalBar} />
            <View style={styles.verticalBar} />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={["#D0D0D0", "#808080"]} // Specify your gradient colors
      style={styles.container}
    >
      <View style={styles.title}>
        <Text style={styles.simple}>Simple</Text>
        <Text style={styles.passwordKeeper}> Password Keeper</Text>
        <StatusBar style="auto" />
      </View>

      {isAuthenticated && !showForm ? (
        <FlatList
          data={accounts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.accountItem}>
              <View style={styles.infoLine}>
                <Text style={styles.showTitle}>{item.title}</Text>
                <Text>
                  Username:{" "}
                  {passwordVisible[item.id] ? item.username : "••••••••"}
                </Text>
                <Text>
                  Password:{" "}
                  {passwordVisible[item.id] ? item.password : "••••••••"}
                </Text>
              </View>
              <View style={styles.buttonsMenu}>
                <TouchableOpacity
                  onPress={() => togglePasswordVisibility(item.id)}
                  style={styles.iconButton}
                >
                  <FontAwesome5
                    name={passwordVisible[item.id] ? "eye" : "eye-slash"}
                    size={30}
                    color="orange"
                    style={styles.shadowIcon}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleEditItem(item.id)}
                  style={styles.iconButton}
                >
                  <FontAwesome5 name="pen" size={30} color="orange"  style={styles.shadowIcon}/>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteItem(item.id)}
                  style={styles.iconButton}
                >
                  <FontAwesome5 name="trash-alt" size={30} color="orange"  style={styles.shadowIcon} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListFooterComponent={renderFooter}
          contentContainerStyle={{ paddingBottom: 50 }} // Additional padding at the bottom
        />
      ) : (
        <View style={styles.form}>
          <Input
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
            leftIcon={{ type: "font-awesome", name: "tag", marginLeft: 5 }}
            inputContainerStyle={{ borderColor: "black" }}
            placeholderTextColor="black"
          />
          <Input
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
            leftIcon={{ type: "font-awesome", name: "user", marginLeft: 5 }}
            inputContainerStyle={{ borderColor: "black" }}
            placeholderTextColor="black"
          />
          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={true}
            leftIcon={{ type: "font-awesome", name: "lock", marginLeft: 5 }}
            inputContainerStyle={{ borderColor: "black" }}
            placeholderTextColor="black"
          />
          <View style={styles.buttonContainer}>
            {selectedItemId === null ? (
              <TouchableOpacity style={styles.formButton} onPress={addAccount}>
                <Text style={styles.buttonText}>Add</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.formButton}
                onPress={handleUpdateItem}
              >
                <Text style={styles.buttonText}>Update</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.formButton}
              onPress={handleToggleForm}
            >
              <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </LinearGradient>
  );
}
const { width } = Dimensions.get("window");
const scale = width / 360;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    display: "flex",
    justifyContent: "center",
    alignItems: "baseline",
    flexDirection: "row",
    marginTop: 65,
    paddingBottom: 7,
    borderBottomWidth: 3,
  },
  title2: {
    display: "flex",
    justifyContent: "center",
    alignItems: "baseline",
    flexDirection: "row",
    marginTop: 65,
    paddingBottom: 7,
  },
  simple: {
    color: "orange",
    fontWeight: "bold",
    fontSize: 35 * scale,
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  passwordKeeper: {
    fontWeight: "bold",
    fontSize: 20 * scale,
    textShadowColor: "#000",
    textShadowOffset: { width: 0.2, height: 0.2 },
    textShadowRadius: 0.5,
  },
  button: {
    marginTop: 20,
    width: 50,
    height: 50,
    backgroundColor: "lightgray",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    marginLeft: 20,
  },
  form: {
    marginTop: 20,
    alignItems: "center",
    width: "100%",
  },
  label: {
    fontSize: 18,
    fontWeight: "bold",
  },
  input: {
    width: "90%",
    height: 40,
    marginVertical: 10,
    borderWidth: 1,
    padding: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 20,
  },
  formButton: {
    backgroundColor: "orange",
    padding: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  showTitle: {
    fontWeight: "bold",
    fontSize: 15,
  },
  plus: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  horizontalBar: {
    position: "absolute",
    width: 32,
    height: 5,
    backgroundColor: "orange",
    borderRadius: 5,
  },
  verticalBar: {
    position: "absolute",
    width: 5,
    height: 32,
    backgroundColor: "orange",
    borderRadius: 5,
  },
  accountItem: {
    display: "flex",
    flexDirection: "row",
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "lightgray",
    justifyContent: "center",
    alignItems: "center",
  },
  infoLine: {
    flex: 8,
  },
  buttonsMenu: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    flex: 4,
  },
  initialScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButton: {
    flexDirection: "row",
    backgroundColor: "orange",
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  loadingText: {
    fontWeight: "bold",
    fontSize: 20,
    color: "white",
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
  },
  buttonClose: {
    backgroundColor: "#2196F3",
  },
  textStyle: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  shadowIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
    padding: 2
  },
});
