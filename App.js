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
} from "react-native";
import * as SecureStore from "expo-secure-store";

export default function App() {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [passwordVisible, setPasswordVisible] = useState({});

  const clearValues = () => {
    setUsername("");
    setPassword("");
    setTitle("");
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const saveAccount = async (key, value) => {
    await SecureStore.setItemAsync(key, JSON.stringify(value));
  };

  const fetchAccounts = async () => {
    try {
      let result = await SecureStore.getItemAsync('accounts');
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

  const addAccount = () => {
    const newAccount = { id: Date.now(), title, username, password };
    const newAccounts = [...accounts, newAccount];
    saveAccount('accounts', newAccounts).then(() => {
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
            const updatedAccounts = accounts.filter(account => account.id !== itemId);
            saveAccount('accounts', updatedAccounts).then(() => {
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
    const updatedAccounts = accounts.map(account => 
      account.id === selectedItemId ? updatedAccount : account
    );
    saveAccount('accounts', updatedAccounts).then(() => {
      setAccounts(updatedAccounts);
      // Reset visibility for all accounts
      const resetVisibility = {};
      updatedAccounts.forEach(account => {
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
      if (prev) { // If currently showing the form and about to hide it
        // Reset password visibility for all accounts
        const resetVisibility = {};
        accounts.forEach(account => {
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
  

  return (
    <View style={styles.container}>
      <View style={styles.title}>
        <Text style={styles.simple}>Simple</Text>
        <Text style={styles.passwordKeeper}> Password Keeper</Text>
        <StatusBar style="auto" />
      </View>

      {!showForm ? (
        <View>
          <FlatList
            data={accounts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.accountItem}>
                <View style={styles.infoLine}>
                  <Text style={styles.showTitle}>{item.title}</Text>
                  <Text>
                    Username:{" "}
                    {passwordVisible[item.id] ? item.username : "••••••••"}{" "}
                  </Text>
                  <Text>
                    Password:{" "}
                    {passwordVisible[item.id] ? item.password : "••••••••"}
                  </Text>
                </View>
                <View style={styles.buttonsMenu}>
                  <TouchableOpacity
                    onPress={() => togglePasswordVisibility(item.id)}
                  >
                    <Image
                      source={
                        passwordVisible[item.id]
                          ? require("./assets/openEye.png")
                          : require("./assets/closedEye.png")
                      }
                      style={styles.deleteButton}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleEditItem(item.id)}>
                    <Image
                      source={require("./assets/edit.png")}
                      style={styles.deleteButton}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteItem(item.id)}>
                    <Image
                      source={require("./assets/delete.png")}
                      style={styles.deleteButton}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />

          <TouchableOpacity style={styles.button} onPress={handleToggleForm}>
            <View style={styles.plus}>
              <View style={styles.horizontalBar} />
              <View style={styles.verticalBar} />
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.label}>Title:</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Title"
            value={title}
            onChangeText={setTitle}
          />
          <Text style={styles.label}>Username:</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter username"
            value={username}
            onChangeText={setUsername}
          />
          <Text style={styles.label}>Password:</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter password"
            secureTextEntry={true}
            value={password}
            onChangeText={setPassword}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "gray",
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
  simple: {
    color: "orange",
    fontWeight: "bold",
    fontSize: 35,
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  passwordKeeper: {
    fontWeight: "bold",
    fontSize: 20,
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
    flex: 2,
  },
  buttonsMenu: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    flex: 1,
  },
  deleteButton: {
    width: 25,
    height: 25,
  },
});