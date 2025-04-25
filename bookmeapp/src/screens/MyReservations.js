// src/screens/MyReservations.js

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { auth, db } from '../firebase/config';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';
import colors from '../theme/colors';
import typography from '../theme/typography';

/**
 * Componente que muestra y gestiona las reservas del usuario autenticado.
 *
 * - Lee las reservas del subcolección 'users/{userId}/reservations'.
 * - Permite cancelar cada reserva, eliminándola tanto del documento de usuario
 *   como del documento de la empresa, y reponiendo la franja en la disponibilidad.
 */
export default function MyReservations() {
  // ID del usuario actual (autenticado con Firebase Auth)
  const userId = auth.currentUser.uid;

  // Estado local:
  // - reservations: array de reservas con sus datos
  // - loading: indicador de carga mientras obtenemos datos
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * load: función para recuperar las reservas del usuario
   * - Consulta la colección 'users/{userId}/reservations'
   * - Mapea cada documento a un objeto con id + datos
   * - Actualiza el estado reservations y desactiva loading
   */
  const load = async () => {
    setLoading(true);
    const snap = await getDocs(
      collection(db, 'users', userId, 'reservations')
    );
    setReservations(
      snap.docs.map(d => ({ id: d.id, ...d.data() }))
    );
    setLoading(false);
  };

  // useEffect para cargar las reservas al montar el componente
  useEffect(() => {
    load();
  }, []);

  /**
   * handleCancel: gestiona la cancelación de una reserva
   * - Muestra un Alert de confirmación con detalles de la reserva
   * - Si el usuario confirma:
   *    1) Borra el documento de reservation en 'users/{userId}/reservations/{res.id}'
   *    2) Busca y borra la reserva correspondiente en 'empresas/{companyId}/reservations'
   *    3) Vuelve a añadir la franja (slot) al array availability del servicio
   *    4) Refresca la lista de reservas
   */
  const handleCancel = (res) => {
    Alert.alert(
      'Cancelar reserva',
      `¿Seguro que quieres cancelar ${res.serviceName} el ${res.slot.date} de ${res.slot.from} a ${res.slot.to}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí',
          onPress: async () => {
            try {
              // 1) Eliminar reserva del nodo de usuario
              await deleteDoc(
                doc(db, 'users', userId, 'reservations', res.id)
              );

              // 2) Eliminar reserva del nodo de la empresa
              const compSnap = await getDocs(
                collection(db, 'empresas', res.companyId, 'reservations')
              );
              for (const d of compSnap.docs) {
                const data = d.data();
                // Coincidir por userId, serviceId, fecha y hora de inicio
                if (
                  data.userId === userId &&
                  data.serviceId === res.serviceId &&
                  data.slot.date === res.slot.date &&
                  data.slot.from === res.slot.from
                ) {
                  await deleteDoc(
                    doc(db, 'empresas', res.companyId, 'reservations', d.id)
                  );
                }
              }

              // 3) Reponer la franja liberada en el servicio
              await updateDoc(
                doc(db, 'empresas', res.companyId, 'servicios', res.serviceId),
                {
                  availability: arrayUnion(res.slot)
                }
              );

              Alert.alert('Reserva cancelada');
              load(); // Refrescar lista de reservas
            } catch (e) {
              console.error('Error cancelando reserva:', e);
              Alert.alert('Error', 'No se pudo cancelar la reserva.');
            }
          }
        }
      ]
    );
  };

  // Mientras cargan las reservas, mostramos un spinner centrado
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Vista principal con FlatList de reservas
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mis Reservas</Text>
      <FlatList
        data={reservations}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No tienes reservas.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Nombre del servicio */}
            <Text style={styles.serviceName}>{item.serviceName}</Text>
            {/* Fecha y franja horaria */}
            <Text style={styles.slotText}>📅 {item.slot.date}</Text>
            <Text style={styles.slotText}>⏰ {item.slot.from} – {item.slot.to}</Text>
            {/* Botón para cancelar */}
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => handleCancel(item)}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

// Estilos con StyleSheet
const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20
  },
  header: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 20
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textPrimary,
    marginTop: 40
  },
  card: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.primary
  },
  serviceName: {
    ...typography.h2,
    color: colors.textPrimary
  },
  slotText: {
    ...typography.body,
    marginVertical: 4,
    color: colors.textPrimary
  },
  cancelBtn: {
    alignSelf: 'flex-end',
    marginTop: 8
  },
  cancelText: {
    color: 'red',
    ...typography.body,
    fontWeight: '600'
  }
});
