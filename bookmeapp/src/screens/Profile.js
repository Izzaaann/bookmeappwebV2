import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { auth, db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import colors from '../theme/colors';
import typography from '../theme/typography';

export default function Profile({ route, navigation }) {
  const { mode } = route.params; // 'usuario' o 'empresa'
  const uid = auth.currentUser.uid;
  const col = mode === 'empresa' ? 'empresas' : 'users';

  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState('nombre'); // 'nombre' o 'password'
  const [name, setName] = useState('');
  const [newPass, setNewPass] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const ref = doc(db, col, uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setName(snap.data().name || '');
        } else {
          const displayName = auth.currentUser.displayName || '';
          await setDoc(ref, { name: displayName });
          setName(displayName);
        }
      } catch (e) {
        console.error('Error al leer perfil:', e);
        Alert.alert('Error', 'No se pudo cargar el perfil.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveName = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío.');
      return;
    }
    setLoading(true);
    try {
      const ref = doc(db, col, uid);
      await updateDoc(ref, { name: name.trim() });
      await updateProfile(auth.currentUser, { displayName: name.trim() });
      Alert.alert('Éxito', 'Nombre actualizado correctamente.');
      navigation.goBack();
    } catch (e) {
      console.error('Error guardando nombre:', e);
      Alert.alert('Error', 'No se pudo actualizar el nombre.');
    } finally {
      setLoading(false);
    }
  };

  const savePassword = async () => {
    if (newPass.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await auth.currentUser.updatePassword(newPass);
      Alert.alert('Éxito', 'Contraseña actualizada correctamente.');
      navigation.goBack();
    } catch (e) {
      console.error('Error cambiando contraseña:', e);
      Alert.alert('Error', 'No se pudo actualizar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi Perfil</Text>

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleBtn, section === 'nombre' && styles.activeToggle]}
          onPress={() => setSection('nombre')}
        >
          <Text style={[styles.toggleText, section === 'nombre' && styles.activeText]}>
            Cambiar Nombre
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, section === 'password' && styles.activeToggle]}
          onPress={() => setSection('password')}
        >
          <Text style={[styles.toggleText, section === 'password' && styles.activeText]}>
            Cambiar Contraseña
          </Text>
        </TouchableOpacity>
      </View>

      {section === 'nombre' ? (
        <View style={styles.form}>
          <Text style={styles.label}>Nuevo Nombre</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Introduce tu nombre"
          />
          <TouchableOpacity style={styles.saveBtn} onPress={saveName}>
            <Text style={styles.saveText}>Guardar Nombre</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.label}>Nueva Contraseña</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={newPass}
            onChangeText={setNewPass}
            placeholder="Mínimo 6 caracteres"
          />
          <TouchableOpacity style={styles.saveBtn} onPress={savePassword}>
            <Text style={styles.saveText}>Guardar Contraseña</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  title: { ...typography.h1, color: colors.textPrimary, textAlign: 'center', marginBottom: 20 },
  toggleContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  toggleBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary
  },
  toggleText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  activeToggle: { backgroundColor: colors.primary },
  activeText: { color: colors.buttonText },
  form: { marginTop: 10 },
  label: { ...typography.body, color: colors.textPrimary, marginBottom: 8 },
  input: {
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 20
  },
  saveBtn: { backgroundColor: colors.primary, padding: 14, borderRadius: 25, alignItems: 'center' },
  saveText: { color: colors.buttonText, ...typography.body, fontWeight: '600' }
});
