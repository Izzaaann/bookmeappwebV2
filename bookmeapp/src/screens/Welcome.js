import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import colors from '../theme/colors';
import typography from '../theme/typography';

export default function Welcome({ route }) {
  const { name } = route.params;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <Text style={styles.title}>Bienvenido{'\n'}<Text style={styles.name}>{name}</Text></Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  name: {
    ...typography.h1,
    fontWeight: '900',
    color: colors.primary,
  },
});
