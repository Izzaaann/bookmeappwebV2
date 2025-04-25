// src/screens/Profile.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { auth, db } from '../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import colors from '../theme/colors';
import typography from '../theme/typography';

export default function Profile({ route, navigation }) {
  const { mode } = route.params; // 'usuario' o 'empresa'
  const uid = auth.currentUser.uid;
  const col = mode === 'empresa' ? 'empresas' : 'users';

  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, col, uid));
      if (snap.exists()) {
        setName(snap.data().name || '');
      }
    })();
  }, []);

  const saveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }
    try {
      await updateDoc(doc(db, col, uid), { name: name.trim() });
      if (newPassword.trim()) {
        await auth.currentUser.updatePassword(newPassword);
      }
      Alert.alert('Perfil guardado');
      navigation.goBack();
    } catch (e) {
      console.error('Error guardando perfil:', e);
      Alert.alert('Error', 'No se pudo actualizar perfil');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
      />
      <Text style={styles.label}>Nueva contraseña</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="Dejar en blanco para no cambiar"
      />
      <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
        <Text style={styles.saveText}>Guardar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:1,
    justifyContent:'center',
    padding:20,
    backgroundColor: colors.background
  },
  label: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom:6
  },
  input: {
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 16
  },
  saveBtn: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 25,
    alignItems: 'center'
  },
  saveText: {
    color: colors.buttonText,
    ...typography.body,
    fontWeight: '600'
  }
});