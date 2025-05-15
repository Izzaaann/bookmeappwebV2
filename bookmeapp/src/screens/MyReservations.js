// src/screens/MyReservations.js

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { auth, db } from '../firebase/config';
import {
  collection,
  getDocs,
  deleteDoc,
  doc
} from 'firebase/firestore';
import colors from '../theme/colors';
import typography from '../theme/typography';

export default function MyReservations() {
  const userId = auth.currentUser.uid;
  const reservationsRef = collection(db, 'users', userId, 'reservations');
  const now = new Date();

  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [dailyReservations, setDailyReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);

  const loadReservations = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(reservationsRef);
      const all = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(r => r.slot?.date && r.slot?.from);

      const marks = {};
      all.forEach(res => {
        marks[res.slot.date] = {
          marked: true,
          dotColor: colors.primary
        };
      });

      setMarkedDates(marks);
      setReservations(all);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudieron cargar las reservas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
    const resOfDay = reservations.filter(
      r => r.slot?.date === day.dateString
    );
    setDailyReservations(resOfDay);
  };

  const handleCancel = async (res) => {
    Alert.alert(
      'Cancelar reserva',
      `¿Eliminar ${res.serviceName} el ${res.slot.date} a las ${res.slot.from}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí', onPress: async () => {
            try {
              await deleteDoc(doc(reservationsRef, res.id));
              await loadReservations();
              setDailyReservations(prev => prev.filter(r => r.id !== res.id));
              Alert.alert('Cancelada', 'La reserva fue cancelada.');
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'No se pudo cancelar.');
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

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={handleDayPress}
        markedDates={{
          ...markedDates,
          ...(selectedDate && {
            [selectedDate]: {
              ...markedDates[selectedDate],
              selected: true,
              selectedColor: colors.primary
            }
          })
        }}
        theme={{
          todayTextColor: colors.primary,
          selectedDayBackgroundColor: colors.primary,
        }}
      />

      {selectedDate && (
        <View style={styles.reservationsContainer}>
          <Text style={styles.sectionTitle}>
            Reservas para {selectedDate}
          </Text>
          {dailyReservations.length === 0 ? (
            <Text style={styles.emptyText}>No tienes reservas este día.</Text>
          ) : (
            <ScrollView style={{ maxHeight: 300 }}>
              {dailyReservations.map(res => (
                <TouchableOpacity
                  key={res.id}
                  style={styles.card}
                  onPress={() => setSelectedReservation(res)}
                >
                  <Text style={styles.serviceName}>{res.serviceName}</Text>
                  <Text style={styles.slotText}>⏰ {res.slot.from} - {res.slot.to}</Text>
                  <Text style={styles.slotText}>📍 {res.location || 'Ubicación no especificada'}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      <Modal
        visible={!!selectedReservation}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedReservation(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Detalles de la Reserva</Text>
            {selectedReservation && (
              <>
                <Text style={styles.modalText}>
                  <Text style={styles.bold}>Servicio:</Text> {selectedReservation.serviceName}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={styles.bold}>Fecha:</Text> {selectedReservation.slot.date}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={styles.bold}>Hora:</Text> {selectedReservation.slot.from} - {selectedReservation.slot.to}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={styles.bold}>Empresa:</Text> {selectedReservation.companyName || '—'}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={styles.bold}>Ubicación:</Text> {selectedReservation.location || '—'}
                </Text>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => handleCancel(selectedReservation)}
                >
                  <Text style={styles.cancelText}>Cancelar Reserva</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setSelectedReservation(null)}
                >
                  <Text style={styles.closeText}>Cerrar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background
  },
  reservationsContainer: {
    marginTop: 20
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: 8
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 20
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.primary
  },
  serviceName: {
    ...typography.h3,
    marginBottom: 4
  },
  slotText: {
    ...typography.body
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContainer: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 12,
    width: '85%'
  },
  modalTitle: {
    ...typography.h2,
    marginBottom: 12
  },
  modalText: {
    ...typography.body,
    marginBottom: 6
  },
  bold: {
    fontWeight: 'bold'
  },
  cancelBtn: {
    marginTop: 12,
    padding: 10,
    backgroundColor: 'red',
    borderRadius: 6,
    alignItems: 'center'
  },
  cancelText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  closeBtn: {
    marginTop: 10,
    padding: 10,
    backgroundColor: colors.primary,
    borderRadius: 6,
    alignItems: 'center'
  },
  closeText: {
    color: colors.buttonText,
    fontWeight: '600'
  }
});
