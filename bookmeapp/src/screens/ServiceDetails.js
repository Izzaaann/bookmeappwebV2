// src/screens/ServiceDetails.js

import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { auth, db } from '../firebase/config';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  arrayRemove
} from 'firebase/firestore';
import colors from '../theme/colors';
import typography from '../theme/typography';

/**
 * Pantalla de detalle de un servicio.
 * Muestra la información del servicio, sus franjas disponibles
 * y permite al usuario reservar una franja.
 *
 * Props recibidas vía React Navigation (route.params):
 *  - companyId    → ID de la empresa propietaria del servicio.
 *  - serviceId    → ID del servicio.
 *  - serviceName  → Nombre del servicio (para cabecera).
 *  - price        → Precio del servicio.
 *  - availability → Array de objetos { date, from, to } con franjas horarias.
 *
 * navigation → objeto para controlar la navegación.
 */
export default function ServiceDetails({ route, navigation }) {
  const {
    companyId,
    serviceId,
    serviceName,
    price,
    availability
  } = route.params;

  // Estado local:
  // - selectedSlot: la franja seleccionada por el usuario
  // - loading: indicador de reserva en curso
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);

  /**
   * handleReserve: guarda la reserva en Firestore y actualiza disponibilidad.
   * 1) Valida que se haya seleccionado una franja.
   * 2) Añade un documento en:
   *      - users/{userId}/reservations
   *      - empresas/{companyId}/reservations
   * 3) Elimina la franja del array availability en servicios/{serviceId}
   * 4) Muestra alerta de confirmación y navega a MyReservations.
   */
  const handleReserve = async () => {
    if (!selectedSlot) {
      Alert.alert('Selecciona una franja primero');
      return;
    }
    setLoading(true);
    try {
      const userId = auth.currentUser.uid;

      // 1) Reserva en colección del usuario
      await addDoc(
        collection(db, 'users', userId, 'reservations'),
        {
          companyId,
          serviceId,
          serviceName,
          price,
          slot: selectedSlot,
          createdAt: new Date()
        }
      );

      // 2) Reserva en colección de la empresa
      await addDoc(
        collection(db, 'empresas', companyId, 'reservations'),
        {
          userId,
          serviceId,
          serviceName,
          price,
          slot: selectedSlot,
          createdAt: new Date()
        }
      );

      // 3) Quitar la franja del array availability
      await updateDoc(
        doc(db, 'empresas', companyId, 'servicios', serviceId),
        { availability: arrayRemove(selectedSlot) }
      );

      Alert.alert(
        'Reserva confirmada',
        '¡Tu reserva ha sido registrada correctamente!'
      );
      navigation.navigate('MyReservations');
    } catch (e) {
      console.error('Error reservando:', e);
      Alert.alert('Error', 'No se pudo completar la reserva.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Cabecera con nombre y precio */}
      <Text style={styles.header}>{serviceName}</Text>
      <Text style={styles.price}>€ {price}</Text>

      {/* Subtítulo */}
      <Text style={styles.subheader}>Horas disponibles</Text>

      {/* Muestra disponibilidad en un grid de 3 columnas */}
      <FlatList
        data={availability}
        keyExtractor={(_, i) => i.toString()}
        numColumns={3}
        renderItem={({ item }) => {
          const isSelected = selectedSlot === item;
          return (
            <TouchableOpacity
              style={[
                styles.slotSquare,
                isSelected && styles.slotSelected
              ]}
              onPress={() => setSelectedSlot(item)}
            >
              <Text
                style={[
                  styles.slotText,
                  isSelected && { color: colors.white }
                ]}
              >
                {item.date}
              </Text>
              <Text
                style={[
                  styles.slotText,
                  isSelected && { color: colors.white }
                ]}
              >
                {item.from}–{item.to}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Sin franjas disponibles.</Text>
        }
      />

      {/* Botón de reserva, deshabilitado si no hay franja o está cargando */}
      <TouchableOpacity
        style={[
          styles.reserveBtn,
          (!selectedSlot || loading) && styles.btnDisabled
        ]}
        onPress={handleReserve}
        disabled={!selectedSlot || loading}
      >
        <Text style={styles.reserveText}>
          {loading ? 'Reservando...' : 'Reservar'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// Estilos del componente
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20
  },
  header: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: 10,
    color: colors.textPrimary
  },
  price: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: 20,
    color: colors.textPrimary
  },
  subheader: {
    ...typography.h2,
    marginBottom: 12,
    color: colors.textPrimary
  },
  slotSquare: {
    flex: 1,
    aspectRatio: 1,
    margin: 4,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  slotSelected: {
    backgroundColor: colors.primary
  },
  slotText: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textPrimary
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textPrimary,
    marginTop: 40
  },
  reserveBtn: {
    marginTop: 20,
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 25,
    alignItems: 'center'
  },
  btnDisabled: {
    opacity: 0.5
  },
  reserveText: {
    color: colors.buttonText,
    ...typography.body,
    fontWeight: '600'
  }
});
