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
import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabase("db.db");

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
    initDB();
    fetchAccounts();
  }, []);

  const initDB = () => {
    db.transaction((tx) => {
      tx.executeSql(
        "CREATE TABLE IF NOT EXISTS accounts (id INTEGER PRIMARY KEY NOT NULL, title TEXT, username TEXT, password TEXT);",
        [],
        () => console.log("Table created successfully"),
        (_, err) => console.log(err)
      );
    });
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
      }
      return !prev;
    });
    clearValues();
  };

  const addAccount = () => {
    db.transaction((tx) => {
      tx.executeSql(
        "INSERT INTO accounts (title, username, password) values (?, ?, ?)",
        [title, username, password],
        (_, result) => {
          console.log("Account added", result);
          fetchAccounts();
          handleToggleForm();
        },
        (_, err) => console.log("Error adding account", err)
      );
    });
  };

  const fetchAccounts = () => {
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT * FROM accounts",
        [],
        (_, { rows: { _array } }) => {
          setAccounts(_array);
          const visibilityStates = {};
          _array.forEach((account) => {
            visibilityStates[account.id] = false;
          });
          setPasswordVisible(visibilityStates);
        },
        (_, err) => console.log("Error fetching accounts", err)
      );
    });
  };

  const handleDeleteItem = (itemId) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this item?",
      [
        {
          text: "No",
          onPress: () => console.log("Deletion canceled"),
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: () => {
            db.transaction((tx) => {
              tx.executeSql(
                "DELETE FROM accounts WHERE id = ?",
                [itemId],
                (_, result) => {
                  if (result.rowsAffected > 0) {
                    console.log("Item deleted successfully");
                    fetchAccounts();
                  } else {
                    console.log("Item with the specified ID not found");
                  }
                },
                (_, error) => console.error("Error deleting item:", error)
              );
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
    db.transaction((tx) => {
      tx.executeSql(
        "UPDATE accounts SET title = ?, username = ?, password = ? WHERE id = ?",
        [title, username, password, selectedItemId],
        (_, result) => {
          if (result.rowsAffected > 0) {
            console.log("Item updated successfully");
            fetchAccounts();
            setShowForm(false);
            setSelectedItemId(null);
          } else {
            console.log("Item with the specified ID not found");
          }
        },
        (_, error) => console.error("Error updating item:", error)
      );
    });
  };

  const togglePasswordVisibility = (itemId) => {
    setPasswordVisible((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
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
