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
import { collection, addDoc, doc, updateDoc, arrayRemove } from 'firebase/firestore';
import colors from '../theme/colors';
import typography from '../theme/typography';

export default function ServiceDetails({ route, navigation }) {
  const { companyId, serviceId, serviceName, price, availability } = route.params;
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleReserve = async () => {
    if (!selectedSlot) {
      Alert.alert('Selecciona una franja primero');
      return;
    }
    setLoading(true);
    try {
      const userId = auth.currentUser.uid;
      // Guardar en reservas del usuario
      await addDoc(
        collection(db, 'users', userId, 'reservations'),
        { companyId, serviceId, serviceName, price, slot: selectedSlot, createdAt: new Date() }
      );
      // Guardar en reservas de la empresa
      await addDoc(
        collection(db, 'empresas', companyId, 'reservations'),
        { userId, serviceId, serviceName, price, slot: selectedSlot, createdAt: new Date() }
      );
      // Eliminar la franja de disponibilidad
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
      <Text style={styles.header}>{serviceName}</Text>
      <Text style={styles.price}>€ {price}</Text>
      <Text style={styles.subheader}>Horas disponibles</Text>

      <FlatList
        data={availability}
        keyExtractor={(_, i) => i.toString()}
        numColumns={3}
        renderItem={({ item }) => {
          const isSelected = selectedSlot === item;
          return (
            <TouchableOpacity
              style={[styles.slotSquare, isSelected && styles.slotSelected]}
              onPress={() => setSelectedSlot(item)}
            >
              <Text style={[styles.slotText, isSelected && { color: colors.white }]}>
                {item.date}
              </Text>
              <Text style={[styles.slotText, isSelected && { color: colors.white }]}>
                {item.from}–{item.to}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Sin franjas disponibles.</Text>
        }
      />

      <TouchableOpacity
        style={[styles.reserveBtn, (!selectedSlot || loading) && styles.btnDisabled]}
        onPress={handleReserve}
        disabled={!selectedSlot || loading}
      >
        <Text style={styles.reserveText}>{loading ? 'Reservando...' : 'Reservar'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 20 },
  header: { ...typography.h1, textAlign: 'center', marginBottom: 10, color: colors.textPrimary },
  price: { ...typography.body, textAlign: 'center', marginBottom: 20, color: colors.textPrimary },
  subheader: { ...typography.h2, marginBottom: 12, color: colors.textPrimary },
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
  slotSelected: { backgroundColor: colors.primary },
  slotText: { ...typography.body, textAlign: 'center', color: colors.textPrimary },
  emptyText: { ...typography.body, textAlign: 'center', color: colors.textPrimary, marginTop: 40 },
  reserveBtn: { marginTop: 20, backgroundColor: colors.primary, padding: 14, borderRadius: 25, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  reserveText: { color: colors.buttonText, ...typography.body, fontWeight: '600' }
});