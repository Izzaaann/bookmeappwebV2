// src/screens/Register.js
import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  StatusBar,
  Alert
} from 'react-native';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import colors from '../theme/colors';
import typography from '../theme/typography';
import UserCompanySelector from '../components/UserCompanySelector';

export default function Register({ navigation }) {
  const [mode, setMode] = useState('usuario');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Rellena todos los campos');
      return;
    }
    try {
      // 1. Crear cuenta en Auth
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      // 2. Poner displayName
      await updateProfile(user, { displayName: name.trim() });

      // 3. Si es empresa, crear doc bajo "empresas/{uid}"
      if (mode === 'empresa') {
        await setDoc(doc(db, 'empresas', user.uid), {
          name: name.trim(),
          email: email.trim(),
          type: 'empresa'
        });
      }

      // 4. Enviar correo de verificación
      await sendEmailVerification(user);

      Alert.alert(
        '¡Cuenta creada!',
        'Revisa tu correo para verificar la cuenta.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      console.error('Error al registrar:', error);
      Alert.alert('Error al registrar', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <Text style={styles.header}>Registro</Text>

      <UserCompanySelector selected={mode} onSelect={setMode} />

      <TextInput
        placeholder={mode === 'usuario' ? 'Nombre de usuario' : 'Nombre de empresa'}
        style={styles.input}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        placeholder="Correo electrónico"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Contraseña"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Registrar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 20,
  },
  buttonText: {
    color: colors.buttonText,
    ...typography.body,
    fontWeight: '600',
  },
});
