// src/screens/PaginaInicial.js

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import colors from '../theme/colors';
import typography from '../theme/typography';

/**
 * Pantalla inicial de la app.
 * - Muestra un mensaje de bienvenida.
 * - Botón para navegar a la pantalla de Login.
 *
 * Props recibidas vía React Navigation:
 *  - navigation → objeto para manejar la navegación entre pantallas.
 */
export default function PaginaInicial({ navigation }) {
  /**
   * handleEntrar: al pulsar el botón "Entrar", navegamos
   * a la pantalla de Login.
   */
  const handleEntrar = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      {/* Barra de estado con contenido claro sobre fondo primario */}
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Encabezado con dos Text: título y acento de marca */}
      <View style={styles.header}>
        <Text style={styles.title}>Bienvenido a</Text>
        <Text style={styles.titleAccent}>BookMe</Text>
      </View>

      {/* Botón principal para entrar */}
      <TouchableOpacity style={styles.button} onPress={handleEntrar}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>
    </View>
  );
}

// Definición de estilos usando StyleSheet de React Native
const styles = StyleSheet.create({
  // Contenedor principal centrado, con padding y fondo
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  // Container del header para centrar textos y separar del botón
  header: {
    marginBottom: 60,
    alignItems: 'center',
  },
  // Estilo base para el texto de título
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  // Variante de título con color primario para resaltar "BookMe"
  titleAccent: {
    ...typography.h1,
    color: colors.primary,
  },
  // Botón con fondo primario, bordes redondeados y sombra
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 30,
    elevation: 3,                 // sombra Android
    shadowColor: '#000',          // sombra iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  // Texto del botón con estilo tipográfico y negrita
  buttonText: {
    ...typography.body,
    color: colors.buttonText,
    fontWeight: '600',
  },
});
