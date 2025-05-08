import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { auth, db } from '../firebase/config';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import colors from '../theme/colors';
import typography from '../theme/typography';

export default function ServiceForm({ route, navigation }) {
  const existing = route.params?.service;
  const isEdit = Boolean(existing);
  const uid = auth.currentUser.uid;

  const [name, setName]         = useState(existing?.name || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [price, setPrice]       = useState(existing?.price?.toString() || '');
  const [duration, setDuration] = useState(existing?.duration?.toString() || '');
  const [loading, setLoading]   = useState(false);

  const handleSave = async () => {
    if (!name || !price || !duration) {
      return Alert.alert('Todos los campos son obligatorios');
    }
    setLoading(true);
    try {
      const data = {
        name,
        description,
        price: parseFloat(price),
        duration: parseInt(duration, 10),
        active: true,
        createdAt: isEdit ? existing.createdAt : new Date()
      };
      if (isEdit) {
        await updateDoc(doc(db, 'business', uid, 'services', existing.id), data);
      } else {
        await addDoc(collection(db, 'business', uid, 'services'), data);
      }
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo guardar el servicio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>{isEdit ? 'Editar Servicio' : 'Nuevo Servicio'}</Text>

      <Text style={styles.label}>Nombre</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, { height:80 }]}
        multiline
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>Precio (€)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
      />

      <Text style={styles.label}>Duración (min)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={duration}
        onChangeText={setDuration}
      />

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
        {loading
          ? <ActivityIndicator color={colors.white}/>
          : <Text style={styles.saveText}>{isEdit ? 'Actualizar' : 'Crear'}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:      { padding:20, backgroundColor:colors.background },
  header:         { ...typography.h1, textAlign:'center', marginBottom:20, color:colors.textPrimary },
  label:          { ...typography.body, marginBottom:6 },
  input:          { backgroundColor:colors.white, padding:12, borderRadius:8, borderWidth:1, borderColor:colors.primary, marginBottom:12 },
  saveBtn:        { backgroundColor:colors.primary, padding:14, borderRadius:25, alignItems:'center', marginTop:20 },
  saveText:       { ...typography.body, color:colors.buttonText, fontWeight:'600' }
});
