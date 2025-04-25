// src/screens/Login.js

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
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth } from '../firebase/config';
import colors from '../theme/colors';
import typography from '../theme/typography';
import UserCompanySelector from '../components/UserCompanySelector';

/**
 * Pantalla de inicio de sesión.
 *
 * Props recibidas vía React Navigation:
 *  - navigation → Objeto de navegación para moverse entre pantallas.
 */
export default function Login({ navigation }) {
  // Modo de cuenta: 'usuario' o 'empresa'
  const [mode, setMode] = useState('usuario');
  // Email y contraseña introducidos por el usuario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Mensaje de error a mostrar bajo los inputs
  const [errorMsg, setErrorMsg] = useState('');

  /**
   * handleLogin: intenta autenticar al usuario con Firebase Auth.
   * - Valida que se hayan rellenado ambos campos.
   * - Llama a signInWithEmailAndPassword.
   * - Comprueba si el correo está verificado; si no, cierra sesión y muestra alerta.
   * - Si todo va bien, resetea la pila de navegación hacia "Welcome".
   */
  const handleLogin = async () => {
    setErrorMsg(''); // Limpiar mensaje de error previo
    if (!email || !password) {
      setErrorMsg('Introduce correo y contraseña');
      return;
    }

    try {
      // Intento de inicio de sesión
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Verificar que el correo esté validado
      if (!user.emailVerified) {
        // Si no, cerramos sesión y pedimos verificación
        await signOut(auth);
        Alert.alert(
          'Verificación requerida',
          'Antes de iniciar sesión, por favor verifica tu correo electrónico.'
        );
        return;
      }

      // Navegar a "Welcome", reiniciando la pila
      navigation.reset({
        index: 0,
        routes: [{
          name: 'Welcome',
          params: {
            name: user.displayName ?? '',
            mode  // modo de cuenta seleccionado ('usuario' o 'empresa')
          }
        }],
      });
    } catch (error) {
      // En caso de fallo (credenciales inválidas, red, etc.)
      console.error('Login error:', error);
      setErrorMsg('Usuario o contraseña incorrecto');
    }
  };

  return (
    <View style={styles.container}>
      {/* Personaliza la barra de estado para que combine con el fondo */}
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Título de la pantalla */}
      <Text style={styles.header}>Iniciar Sesión</Text>

      {/* Selector para indicar si es usuario o empresa */}
      <UserCompanySelector selected={mode} onSelect={setMode} />

      {/* Campo de correo electrónico */}
      <TextInput
        placeholder="Correo electrónico"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      {/* Campo de contraseña */}
      <TextInput
        placeholder="Contraseña"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {/* Texto de error, solo si errorMsg no está vacío */}
      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

      {/* Botón para iniciar sesión */}
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>

      {/* Enlace para ir a la pantalla de registro */}
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>¿No tienes cuenta? Regístrate</Text>
      </TouchableOpacity>
    </View>
  );
}

// Definición de estilos con StyleSheet
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
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 5,
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
  link: {
    color: colors.primary,
    textAlign: 'center',
    marginTop: 10,
  },
});
