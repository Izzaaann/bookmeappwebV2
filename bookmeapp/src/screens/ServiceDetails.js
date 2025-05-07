// src/screens/ServiceDetails.js

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from 'react-native';
import colors from '../theme/colors';
import typography from '../theme/typography';

/**
 * Pantalla de detalles de un servicio.
 * Muestra nombre, descripción, duración y precio.
 *
 * Props recibidas vía React Navigation:
 *  - route.params.serviceName
 *  - route.params.description
 *  - route.params.duration
 *  - route.params.price
 *  - navigation
 */
export default function ServiceDetails({ route, navigation }) {
  const { serviceName, description, duration, price, companyId, serviceId } = route.params;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Nombre del servicio */}
      <Text style={styles.title}>{serviceName}</Text>

      {/* Descripción */}
      {description ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}

      {/* Fila duración y precio */}
      <View style={styles.row}>
        <View style={styles.durationBox}>
          <Text style={styles.durationText}>{duration} min</Text>
        </View>
        <View style={styles.priceBox}>
          <Text style={styles.priceText}>€ {price}</Text>
        </View>
      </View>

      {/* Botón Reservar */}
      <TouchableOpacity
        style={styles.reserveBtn}
        onPress={() =>
          navigation.navigate('Booking', {
            companyId,
            serviceId,
            serviceName,
            price,
            duration
          })
        }
      >
        <Text style={styles.reserveText}>Reservar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: colors.background,
    flexGrow: 1,
    justifyContent: 'flex-start'
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40
  },
  durationBox: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary
  },
  durationText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600'
  },
  priceBox: {
    width: 100,
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary
  },
  priceText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600'
  },
  reserveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center'
  },
  reserveText: {
    ...typography.body,
    color: colors.buttonText,
    fontWeight: '600'
  }
});
