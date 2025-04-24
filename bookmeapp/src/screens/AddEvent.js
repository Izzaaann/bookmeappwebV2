// src/screens/AddEvent.js
import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { auth, db } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import colors from '../theme/colors';
import typography from '../theme/typography';

export default function AddEvent({ navigation }) {
  const [serviceName, setServiceName] = useState('');
  const [price, setPrice] = useState('');
  const [schedule, setSchedule] = useState([
    { date: new Date(), from: new Date(), to: new Date() }
  ]);
  const [picker, setPicker] = useState({ show: false, mode: 'date', index: 0, field: 'date' });

  const showPicker = (i, field) =>
    setPicker({ show: true, mode: field === 'date' ? 'date' : 'time', index: i, field });

  const onChange = (e, selected) => {
    setPicker(p => ({ ...p, show: false }));
    if (e.type === 'dismissed') return;
    const copy = [...schedule];
    copy[picker.index][picker.field] = selected || copy[picker.index][picker.field];
    setSchedule(copy);
  };

  const addSlot = () =>
    setSchedule(s => [...s, { date: new Date(), from: new Date(), to: new Date() }]);

  const handleSubmit = async () => {
    if (!serviceName.trim() || !price.trim()) {
      Alert.alert('Error', 'Nombre y precio obligatorios');
      return;
    }
    try {
      const uid = auth.currentUser.uid;
      const col = collection(db, 'empresas', uid, 'servicios');
      const availability = schedule.map(s => ({
        date: s.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
        from: s.from.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        to: s.to.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      }));
      await addDoc(col, {
        serviceName: serviceName.trim(),
        price: parseFloat(price),
        availability
      });
      Alert.alert('Servicio guardado', 'Tu servicio se ha guardado correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      console.error('Error guardando servicio:', e);
      Alert.alert('Error', 'No se pudo guardar el servicio.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Nuevo Servicio</Text>

      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. Corte de pelo"
        value={serviceName}
        onChangeText={setServiceName}
      />

      <Text style={styles.label}>Precio (€)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. 20"
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
      />

      <Text style={styles.subheader}>Disponibilidad</Text>
      {schedule.map((slot, i) => (
        <View key={i} style={styles.slotRow}>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => showPicker(i, 'date')}>
            <Text style={styles.pickerText}>
              {slot.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => showPicker(i, 'from')}>
            <Text style={styles.pickerText}>
              {slot.from.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => showPicker(i, 'to')}>
            <Text style={styles.pickerText}>
              {slot.to.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity onPress={addSlot} style={styles.addSlotBtn}>
        <Text style={styles.addSlotText}>+ Añadir horario</Text>
      </TouchableOpacity>

      {picker.show && (
        <DateTimePicker
          value={schedule[picker.index][picker.field]}
          mode={picker.mode}
          display="default"
          onChange={onChange}
        />
      )}

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitText}>Guardar Servicio</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: colors.background
  },
  header: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 20
  },
  label: {
    ...typography.body,
    color: colors.textPrimary,
    marginBottom: 6
  },
  input: {
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: 12
  },
  subheader: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 8
  },
  slotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  pickerBtn: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    marginHorizontal: 4,
    alignItems: 'center'
  },
  pickerText: {
    ...typography.body,
    color: colors.textPrimary
  },
  addSlotBtn: {
    alignSelf: 'center',
    marginVertical: 10
  },
  addSlotText: {
    color: colors.primary,
    ...typography.body,
    fontWeight: '600'
  },
  submitBtn: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20
  },
  submitText: {
    color: colors.buttonText,
    ...typography.body,
    fontWeight: '600'
  }
});
