import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import colors from '../theme/colors';
import typography from '../theme/typography';

export default function PaginaInicial({ navigation }) {
  const handleEntrar = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={styles.header}>
        <Text style={styles.title}>Bienvenido a</Text>
        <Text style={styles.titleAccent}>BookMe</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleEntrar}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    marginBottom: 60,
    alignItems: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  titleAccent: {
    ...typography.h1,
    color: colors.primary,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 60,
    borderRadius: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    ...typography.body,
    color: colors.buttonText,
    fontWeight: '600',
  },
});
