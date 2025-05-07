import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import { auth, db } from '../firebase/config';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import colors from '../theme/colors';
import typography from '../theme/typography';

export default function ServicesScreen() {
  const uid = auth.currentUser.uid;
  const servicesRef = collection(db, 'business', uid, 'services');

  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);

  // Formulario
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');
  const [active, setActive] = useState(true);

  // Edición
  const [editingId, setEditingId] = useState(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(servicesRef);
      setServices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudieron cargar los servicios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setDuration('');
    setPrice('');
    setActive(true);
    setEditingId(null);
  };

  const saveService = async () => {
    if (!name.trim() || !duration.trim() || !price.trim()) {
      Alert.alert('Error', 'Nombre, duración y precio son obligatorios.');
      return;
    }
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      duration: parseInt(duration, 10),
      price: parseFloat(price),
      active,
      createdAt: serverTimestamp()
    };
    try {
      if (editingId) {
        await updateDoc(doc(servicesRef, editingId), payload);
      } else {
        await addDoc(servicesRef, payload);
      }
      resetForm();
      fetchServices();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo guardar el servicio.');
    }
  };

  const onEdit = svc => {
    setEditingId(svc.id);
    setName(svc.name);
    setDescription(svc.description || '');
    setDuration(String(svc.duration));
    setPrice(String(svc.price));
    setActive(svc.active);
  };

  const onDelete = id => {
    Alert.alert('Confirmar', '¿Eliminar este servicio?', [
      { text: 'Cancelar' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(servicesRef, id));
            fetchServices();
          } catch (e) {
            console.error(e);
            Alert.alert('Error', 'No se pudo eliminar.');
          }
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Encabezado y formulario como ListHeaderComponent
  const ListHeader = () => (
    <View style={styles.formContainer}>
      <Text style={styles.title}>
        {editingId ? 'Editar Servicio' : 'Nuevo Servicio'}
      </Text>
      <TextInput
        placeholder="Nombre"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        placeholder="Descripción (opcional)"
        style={styles.input}
        value={description}
        onChangeText={setDescription}
      />
      <TextInput
        placeholder="Duración (min)"
        style={styles.input}
        keyboardType="numeric"
        value={duration}
        onChangeText={setDuration}
      />
      <TextInput
        placeholder="Precio (€)"
        style={styles.input}
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
      />
      <View style={styles.row}>
        <Text style={typography.body}>Activo:</Text>
        <TouchableOpacity onPress={() => setActive(a => !a)}>
          <Text style={[styles.toggle, active ? styles.on : styles.off]}>
            {active ? 'Sí' : 'No'}
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.saveBtn} onPress={saveService}>
        <Text style={styles.saveText}>
          {editingId ? 'Actualizar' : 'Crear'}
        </Text>
      </TouchableOpacity>
      <Text style={styles.listTitle}>Servicios Existentes</Text>
    </View>
  );

  return (
    <FlatList
      data={services}
      keyExtractor={item => item.id}
      ListHeaderComponent={ListHeader}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardInfo}>
            <Text style={styles.svcName}>{item.name}</Text>
            <Text style={styles.svcInfo}>
              {item.duration} min — € {item.price}
            </Text>
            {item.description ? (
              <Text style={styles.svcDesc}>{item.description}</Text>
            ) : null}
          </View>
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => onEdit(item)}>
              <Text style={styles.actionText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(item.id)}>
              <Text style={[styles.actionText, { color: 'red' }]}>
                Eliminar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container:       { padding: 20, backgroundColor: colors.background },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center' },

  formContainer:   { marginBottom: 20 },
  title:           { ...typography.h1, textAlign: 'center', marginBottom: 12 },
  input:           {
                     backgroundColor: colors.white,
                     padding: 12,
                     borderRadius: 8,
                     borderWidth: 1,
                     borderColor: colors.primary,
                     marginBottom: 12
                   },
  row:             { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  toggle:          { marginLeft: 8, fontWeight: '600' },
  on:              { color: 'green' },
  off:             { color: 'red' },
  saveBtn:         {
                     backgroundColor: colors.primary,
                     padding: 14,
                     borderRadius: 25,
                     alignItems: 'center',
                     marginBottom: 20
                   },
  saveText:        { ...typography.body, color: colors.buttonText, fontWeight: '600' },
  listTitle:       { ...typography.h2, marginBottom: 12 },

  card:            {
                     flexDirection: 'row',
                     backgroundColor: colors.white,
                     padding: 12,
                     borderRadius: 8,
                     marginBottom: 12
                   },
  cardInfo:        { flex: 1 },
  svcName:         { ...typography.h2, color: colors.textPrimary },
  svcInfo:         { ...typography.body, color: colors.textSecondary, marginVertical: 4 },
  svcDesc:         { ...typography.body, fontStyle: 'italic' },

  actions:         { justifyContent: 'space-around' },
  actionText:      { ...typography.body, color: colors.primary }
});
