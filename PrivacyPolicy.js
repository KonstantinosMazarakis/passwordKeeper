import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PrivacyPolicyText = () => (
  <View>
    <Text style={styles.header}>Privacy Notice</Text>
    <Text style={styles.subHeader}>Introduction</Text>
    <Text style={styles.body}>
      Welcome to our application! This privacy notice explains how your data is managed and protected in our app. By using our app, you accept full responsibility for the security and management of your data.
    </Text>
    <Text style={styles.subHeader}>Data Storage and Encryption</Text>
    <Text style={styles.body}>
      All personal data entered into this application is stored locally on your device and not on any external servers. We use AES-256 encryption, one of the strongest block ciphers available, to ensure that your data is protected against unauthorized access. This encryption method secures your data at rest, making it accessible only through the application itself.
    </Text>
    <Text style={styles.subHeader}>User Responsibility</Text>
    <Text style={styles.body}>
      As a user, you are solely responsible for maintaining the confidentiality of your data within the app. It is crucial to understand that if the app is deleted, or if you clear the app's data, all stored information will be permanently lost without the possibility of recovery. We recommend keeping regular backups of your data if needed.
    </Text>
    <Text style={styles.subHeader}>Access Control</Text>
    <Text style={styles.body}>
      Access to the app is safeguarded by biometric authentication (such as fingerprint or facial recognition) or by using the device's passcode. This ensures that only you can access your data by leveraging the security features of your device.
    </Text>
    <Text style={styles.subHeader}>Your Rights and Responsibilities</Text>
    <Text style={styles.body}>
      It is your responsibility to secure and manage your device's biometric authentication or passcode. We do not have access to or the capability to retrieve your personal encryption keys or passcodes used to secure your data. You acknowledge and agree that the security and integrity of your data is your responsibility, and you use the app at your own risk.
    </Text>
    <Text style={styles.subHeader}>Legal Compliance and Changes to Privacy Notice</Text>
    <Text style={styles.body}>
      We may update this privacy notice to reflect changes in our practices or for other operational, legal, or regulatory reasons. If significant changes are made, we will notify you through the app interface or through other means such as email, allowing you to review the changes before they become effective.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 5,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
});

export default PrivacyPolicyText;
