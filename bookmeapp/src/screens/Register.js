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

/**
 * Pantalla de registro de nuevos usuarios o empresas.
 *
 * Props recibidas vía React Navigation:
 *  - navigation → Objeto para controlar la navegación entre pantallas.
 */
export default function Register({ navigation }) {
  // Modo de cuenta: 'usuario' o 'empresa'
  const [mode, setMode] = useState('usuario');
  // Datos del formulario
  const [name, setName] = useState('');       // Nombre de usuario o empresa
  const [email, setEmail] = useState('');     // Correo electrónico
  const [password, setPassword] = useState(''); // Contraseña

  /**
   * handleRegister: gestiona el flujo de registro completo
   * 1) Validación básica de campos no vacíos
   * 2) Crear cuenta en Firebase Auth
   * 3) Actualizar displayName en Auth
   * 4) Si es empresa, crear documento en Firestore bajo "empresas/{uid}"
   * 5) Enviar correo de verificación
   * 6) Mostrar alerta y navegar a Login
   */
  const handleRegister = async () => {
    // Validar que todos los campos tengan contenido
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Rellena todos los campos');
      return;
    }

    try {
      // 1. Crear cuenta en Firebase Auth
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      // 2. Actualizar displayName del usuario en Auth
      await updateProfile(user, { displayName: name.trim() });

      // 3. Si es empresa, registrar datos adicionales en Firestore
      if (mode === 'empresa') {
        await setDoc(doc(db, 'empresas', user.uid), {
          name: name.trim(),
          email: email.trim(),
          type: 'empresa'
        });
      }

      // 4. Enviar correo de verificación al usuario
      await sendEmailVerification(user);

      // 5. Informar al usuario y redirigir a Login
      Alert.alert(
        '¡Cuenta creada!',
        'Revisa tu correo para verificar la cuenta.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      console.error('Error al registrar:', error);
      // Mostrar mensaje de error proveniente de Firebase
      Alert.alert('Error al registrar', error.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Personalización de la barra de estado para que combine con el fondo */}
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Título de la pantalla */}
      <Text style={styles.header}>Registro</Text>

      {/* Selector de tipo: usuario o empresa */}
      <UserCompanySelector selected={mode} onSelect={setMode} />

      {/* Input para nombre (usuario o empresa) */}
      <TextInput
        placeholder={mode === 'usuario' ? 'Nombre de usuario' : 'Nombre de empresa'}
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      {/* Input para correo electrónico */}
      <TextInput
        placeholder="Correo electrónico"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      {/* Input para contraseña */}
      <TextInput
        placeholder="Contraseña"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {/* Botón para enviar el formulario de registro */}
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Registrar</Text>
      </TouchableOpacity>
    </View>
  );
}

// Estilos con StyleSheet de React Native
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
