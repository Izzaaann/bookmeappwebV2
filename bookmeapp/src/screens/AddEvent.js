// Nombre fichero: src/screens/AddEvent.js

// Código:

/**
 * Pantalla "AddEvent"
 * Permite a una empresa añadir un nuevo servicio, establecer nombre, precio y su disponibilidad.
 * Utiliza React Native para la interfaz, DateTimePicker para selección de fecha y hora,
 * y Firestore para almacenar los datos.
 */
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

/**
 * Componente principal para añadir un servicio.
 * @param {object} navigation - objeto de navegación para volver atrás al guardar.
 */
export default function AddEvent({ navigation }) {
  // Nombre del servicio introducido por el usuario
  const [serviceName, setServiceName] = useState('');
  // Precio del servicio introducido por el usuario (string)
  const [price, setPrice] = useState('');
  // Array de slots de disponibilidad: cada uno con date, from y to.
  const [schedule, setSchedule] = useState([
    { date: new Date(), from: new Date(), to: new Date() }
  ]);
  // Estado del picker: visibilidad, modo (date/time), índice de slot y campo ('date'|'from'|'to')
  const [picker, setPicker] = useState({ show: false, mode: 'date', index: 0, field: 'date' });

  /**
   * Muestra el DateTimePicker para el slot i y campo especificado.
   * @param {number} i - Índice del slot en el array schedule.
   * @param {string} field - Campo a editar: 'date', 'from' o 'to'.
   */
  const showPicker = (i, field) =>
    setPicker({ show: true, mode: field === 'date' ? 'date' : 'time', index: i, field });

  /**
   * Manejador de cambio del DateTimePicker.
   * Actualiza la fecha u hora seleccionada en el slot correspondiente.
   * @param {object} e - Evento del picker.
   * @param {Date} selected - Nueva fecha/hora seleccionada.
   */
  const onChange = (e, selected) => {
    // Oculta el picker
    setPicker(p => ({ ...p, show: false }));
    // Si el usuario descartó el picker, no hacer nada
    if (e.type === 'dismissed') return;
    // Clonamos el array de schedule y actualizamos el campo
    const copy = [...schedule];
    copy[picker.index][picker.field] = selected || copy[picker.index][picker.field];
    setSchedule(copy);
  };

  /**
   * Añade un nuevo slot de disponibilidad con valores iniciales a la fecha y hora actual.
   */
  const addSlot = () =>
    setSchedule(s => [...s, { date: new Date(), from: new Date(), to: new Date() }]);

  /**
   * Envía los datos del servicio a Firestore.
   * Valida que nombre y precio no estén vacíos, formatea disponibilidad y maneja respuestas.
   */
  const handleSubmit = async () => {
    // Validación de campos obligatorios
    if (!serviceName.trim() || !price.trim()) {
      Alert.alert('Error', 'Nombre y precio obligatorios');
      return;
    }
    try {
      // Identificador de usuario actual
      const uid = auth.currentUser.uid;
      // Referencia a la colección "empresas/{uid}/servicios"
      const col = collection(db, 'empresas', uid, 'servicios');

      // Formateo de disponibilidad a cadenas legibles en local 'es-ES'
      const availability = schedule.map(s => ({
        date: s.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
        from: s.from.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        to: s.to.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      }));

      // Escritura en Firestore
      await addDoc(col, {
        serviceName: serviceName.trim(),
        price: parseFloat(price),
        availability
      });

      // Notificación de éxito y navegación atrás
      Alert.alert('Servicio guardado', 'Tu servicio se ha guardado correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      // Error al guardar
      console.error('Error guardando servicio:', e);
      Alert.alert('Error', 'No se pudo guardar el servicio.');
    }
  };

  // Renderizado de la UI
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Título principal */}
      <Text style={styles.header}>Nuevo Servicio</Text>

      {/* Input para nombre */}
      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. Corte de pelo"
        value={serviceName}
        onChangeText={setServiceName}
      />

      {/* Input para precio */}
      <Text style={styles.label}>Precio (€)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. 20"
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
      />

      {/* Sección de disponibilidad */}
      <Text style={styles.subheader}>Disponibilidad</Text>
      {schedule.map((slot, i) => (
        <View key={i} style={styles.slotRow}>
          {/* Botón para fecha */}
          <TouchableOpacity style={styles.pickerBtn} onPress={() => showPicker(i, 'date')}>
            <Text style={styles.pickerText}>
              {slot.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </TouchableOpacity>
          {/* Botón para hora de inicio */}
          <TouchableOpacity style={styles.pickerBtn} onPress={() => showPicker(i, 'from')}>
            <Text style={styles.pickerText}>
              {slot.from.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
          {/* Botón para hora de fin */}
          <TouchableOpacity style={styles.pickerBtn} onPress={() => showPicker(i, 'to')}>
            <Text style={styles.pickerText}>
              {slot.to.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Botón para añadir otro slot */}
      <TouchableOpacity onPress={addSlot} style={styles.addSlotBtn}>
        <Text style={styles.addSlotText}>+ Añadir horario</Text>
      </TouchableOpacity>

      {/* DateTimePicker condicional */}
      {picker.show && (
        <DateTimePicker
          value={schedule[picker.index][picker.field]}
          mode={picker.mode}
          display="default"
          onChange={onChange}
        />
      )}

      {/* Botón de envío del formulario */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitText}>Guardar Servicio</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/**
 * Definición de estilos para la pantalla.
 */
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
