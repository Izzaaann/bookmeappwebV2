import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert
} from 'react-native';
import { auth, db } from '../firebase/config';
import {
  collection,
  getDocs,
  deleteDoc,
  doc
} from 'firebase/firestore';
import colors from '../theme/colors';
import typography from '../theme/typography';

export default function ManageBookings() {
  const uid = auth.currentUser.uid;
  const bookingsRef = collection(db, 'business', uid, 'bookings');

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(bookingsRef);
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudieron cargar las citas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const confirmDelete = bookingId => {
    Alert.alert(
      'Eliminar cita',
      '¿Seguro que quieres eliminar esta cita?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'business', uid, 'bookings', bookingId));
              fetchBookings();
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'No se pudo eliminar la cita.');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (bookings.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No hay citas pendientes.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={bookings}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.info}>
            <Text style={styles.clientName}>{item.clientName}</Text>
            <Text style={styles.line}>📧 {item.clientEmail}</Text>
            <Text style={styles.line}>
              📅 {item.date.slice(0, 10)} ⏰ {item.date.slice(11, 16)}
            </Text>
            <Text style={styles.line}>
              🏷️ {item.serviceName} — {item.duration} min — €{item.price}
            </Text>
            <Text style={styles.status}>Estado: {item.status}</Text>
          </View>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => confirmDelete(item.id)}
          >
            <Text style={styles.deleteText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container:    { padding: 20, backgroundColor: colors.background },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  emptyText:    { ...typography.body, color: colors.textSecondary },

  card:         {
                  flexDirection: 'row',
                  backgroundColor: colors.white,
                  padding: 16,
                  borderRadius: 8,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: colors.primary,
                  alignItems: 'center'
                },
  info:         { flex: 1 },
  clientName:   { ...typography.h2, color: colors.textPrimary },
  line:         { ...typography.body, color: colors.textPrimary, marginTop: 4 },
  status:       { ...typography.body, fontWeight: '600', marginTop: 8, color: colors.primary },

  deleteBtn:    {
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  backgroundColor: '#ffdddd',
                  borderRadius: 6
                },
  deleteText:   { ...typography.body, color: 'red', fontWeight: '600' }
});
