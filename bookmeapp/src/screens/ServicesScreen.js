import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { auth, db } from '../firebase/config';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore';
import colors from '../theme/colors';
import typography from '../theme/typography';

export default function ServicesScreen() {
  const companyId = auth.currentUser.uid;
  const servicesCol = collection(db, 'business', companyId, 'services');

  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);

  // Form state
  const [editingId, setEditingId]     = useState(null);
  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration]       = useState('');
  const [price, setPrice]             = useState('');

  // Load services
  const load = async () => {
    setLoading(true);
    const snap = await getDocs(servicesCol);
    setServices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Start editing or adding
  const startEdit = service => {
    if (service) {
      setEditingId(service.id);
      setName(service.name);
      setDescription(service.description || '');
      setDuration(String(service.duration));
      setPrice(String(service.price));
    } else {
      setEditingId(null);
      setName(''); setDescription(''); setDuration(''); setPrice('');
    }
  };

  const cancelEdit = () => startEdit(null);

  // Save new or edited
  const save = async () => {
    if (!name.trim() || !duration || !price) {
      return Alert.alert('Error', 'Nombre, duración y precio son obligatorios.');
    }
    try {
      const data = {
        name: name.trim(),
        description: description.trim(),
        duration: parseInt(duration, 10),
        price: parseFloat(price),
        active: true,
        createdAt: new Date().toISOString()
      };
      if (editingId) {
        await updateDoc(doc(servicesCol, editingId), data);
      } else {
        await addDoc(servicesCol, data);
      }
      cancelEdit();
      load();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo guardar el servicio.');
    }
  };

  // Delete
  const remove = id => {
    Alert.alert(
      'Eliminar servicio',
      '¿Seguro que deseas eliminar este servicio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteDoc(doc(servicesCol, id));
            load();
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
    <ScrollView style={styles.container}>
      <Text style={styles.header}>
        {editingId ? 'Editar Servicio' : 'Añadir Servicio'}
      </Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Nombre"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Descripción (opcional)"
          value={description}
          onChangeText={setDescription}
        />
        <TextInput
          style={styles.input}
          placeholder="Duración (min)"
          keyboardType="numeric"
          value={duration}
          onChangeText={setDuration}
        />
        <TextInput
          style={styles.input}
          placeholder="Precio (€)"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />
        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.saveBtn} onPress={save}>
            <Text style={styles.saveTxt}>
              {editingId ? 'Actualizar' : 'Guardar'}
            </Text>
          </TouchableOpacity>
          {editingId && (
            <TouchableOpacity style={styles.cancelBtn} onPress={cancelEdit}>
              <Text style={styles.cancelTxt}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={styles.listHeader}>Mis Servicios</Text>
      {services.length === 0 ? (
        <Text style={styles.empty}>No tienes servicios aún.</Text>
      ) : (
        services.map(s => (
          <View key={s.id} style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.name}>{s.name}</Text>
              <Text style={styles.sub}>⏱ {s.duration} min • € {s.price}</Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => startEdit(s)}>
                <Text style={styles.editTxt}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => remove(s.id)}>
                <Text style={styles.deleteTxt}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex:1, backgroundColor:colors.background, padding:16 },
  center:       { flex:1,justifyContent:'center',alignItems:'center' },
  header:       { ...typography.h1, textAlign:'center', marginBottom:12 },

  form:         { backgroundColor:colors.white, padding:16, borderRadius:8, marginBottom:20, elevation:2 },
  input:        { backgroundColor:'#f9f9f9', padding:10, borderRadius:6, borderWidth:1, borderColor:'#ccc', marginBottom:12 },
  buttonsRow:   { flexDirection:'row', justifyContent:'space-between' },
  saveBtn:      { backgroundColor:colors.primary, padding:12, borderRadius:25, flex:1, marginRight:8, alignItems:'center' },
  saveTxt:      { ...typography.body, color:colors.buttonText, fontWeight:'600' },
  cancelBtn:    { backgroundColor:'#aaa', padding:12, borderRadius:25, flex:1, marginLeft:8, alignItems:'center' },
  cancelTxt:    { ...typography.body, color:colors.buttonText },

  listHeader:   { ...typography.h2, marginBottom:12 },
  empty:        { ...typography.body, textAlign:'center', color:colors.textSecondary },

  card:         {
                  backgroundColor:colors.white,
                  flexDirection:'row',
                  justifyContent:'space-between',
                  padding:16,
                  borderRadius:8,
                  marginBottom:12,
                  elevation:1
                 },
  cardInfo:     { flex:1 },
  name:         { ...typography.h2, color:colors.textPrimary },
  sub:          { ...typography.body, color:colors.textSecondary, marginTop:4 },
  cardActions:  { justifyContent:'center' },
  editTxt:      { ...typography.body, color:'#1565C0', marginBottom:8 },
  deleteTxt:    { ...typography.body, color:'red' }
});
