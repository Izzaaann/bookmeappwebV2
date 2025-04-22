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
import { auth } from '../firebase/config';
import colors from '../theme/colors';
import typography from '../theme/typography';
import UserCompanySelector from '../components/UserCompanySelector';

export default function Register({ navigation }) {
  const [mode, setMode] = useState('usuario');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Rellena todos los campos');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });
      await sendEmailVerification(user);
      Alert.alert(
        '¡Cuenta creada!',
        'Te hemos enviado un correo de verificación. Por favor, verifica tu correo electrónico antes de iniciar sesión.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      console.error(error);
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
