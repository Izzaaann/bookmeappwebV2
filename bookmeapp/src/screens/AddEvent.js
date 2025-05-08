import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import colors from '../theme/colors';
import typography from '../theme/typography';
import { CLOUDINARY_URL, CLOUDINARY_UPLOAD_PRESET } from '../config';

export default function AddEvent({ navigation }) {
  const [serviceName, setServiceName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [bannerUrl, setBannerUrl] = useState(null);

  const [schedule, setSchedule] = useState([
    { date: new Date(), from: new Date(), to: new Date() }
  ]);
  const [picker, setPicker] = useState({ show: false, mode: 'date', index: 0, field: 'date' });

  const [loading, setLoading] = useState(false);

  // Subida Cloudinary vía XHR (similar a Profile.js)
  const uploadImage = (uri) =>
    new Promise((resolve, reject) => {
      setLoading(true);
      const xhr = new XMLHttpRequest();
      xhr.open('POST', CLOUDINARY_URL);
      xhr.onload = () => {
        setLoading(false);
        if (xhr.status !== 200) {
          Alert.alert('Error', 'No se pudo subir el banner.');
          return reject();
        }
        const resp = JSON.parse(xhr.response);
        resolve(resp.secure_url);
      };
      xhr.onerror = (e) => {
        setLoading(false);
        Alert.alert('Error', 'No se pudo subir el banner.');
        reject(e);
      };
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: 'banner.jpg',
        type: 'image/jpeg'
      });
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      xhr.send(formData);
    });

  const pickBanner = async () => {
    const { status: existing } = await ImagePicker.getMediaLibraryPermissionsAsync();
    let final = existing;
    if (existing !== 'granted') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      final = status;
    }
    if (final !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesito permiso de galería.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7
    });
    if (res.canceled) return;
    const uri = res.assets[0].uri;
    try {
      const url = await uploadImage(uri);
      setBannerUrl(url);
    } catch {}
  };

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
    if (!serviceName.trim() || !price.trim() || !duration.trim()) {
      Alert.alert('Error', 'Nombre, precio y duración son obligatorios');
      return;
    }
    if (!bannerUrl) {
      Alert.alert('Error', 'El banner es obligatorio');
      return;
    }
    setLoading(true);
    try {
      const uid = auth.currentUser.uid;
      const colRef = collection(db, 'business', uid, 'services');
      const availability = schedule.map(s => ({
        date: s.date.toLocaleDateString('es-ES'),
        from: s.from.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}),
        to: s.to.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})
      }));
      await addDoc(colRef, {
        name: serviceName.trim(),
        description: description.trim(),
        price: parseFloat(price),
        duration: parseInt(duration,10),
        bannerurl: bannerUrl,
        active: true,
        createdAt: new Date(),
        availability
      });
      Alert.alert('Servicio creado', 'Tu servicio se ha almacenado.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo crear el servicio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Nuevo Servicio</Text>

      <Text style={styles.label}>Banner</Text>
      <TouchableOpacity style={styles.bannerPicker} onPress={pickBanner}>
        {bannerUrl ? (
          <Image source={{ uri: bannerUrl }} style={styles.bannerPreview} />
        ) : (
          <Text style={styles.bannerText}>+ Subir Banner</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. Corte de pelo"
        value={serviceName}
        onChangeText={setServiceName}
      />

      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        multiline
        placeholder="Descripción breve"
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>Precio (€)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. 20"
        keyboardType="numeric"
        value={price}
        onChangeText={setPrice}
      />

      <Text style={styles.label}>Duración (minutos)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej. 30"
        keyboardType="numeric"
        value={duration}
        onChangeText={setDuration}
      />

      <Text style={styles.subheader}>Disponibilidad</Text>
      {schedule.map((slot, i) => (
        <View key={i} style={styles.slotRow}>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => showPicker(i,'date')}>
            <Text>{slot.date.toLocaleDateString('es-ES')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => showPicker(i,'from')}>
            <Text>{slot.from.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => showPicker(i,'to')}>
            <Text>{slot.to.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}</Text>
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

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
        {loading
          ? <ActivityIndicator color={colors.white}/>
          : <Text style={styles.submitText}>Guardar Servicio</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:      { padding:20, backgroundColor: colors.background },
  header:         { ...typography.h1, textAlign:'center', marginBottom:20, color: colors.textPrimary },
  label:          { ...typography.body, color: colors.textPrimary, marginBottom:6 },
  input:          { backgroundColor: colors.white, padding:12, borderRadius:8, borderWidth:1, borderColor: colors.primary, marginBottom:12 },
  subheader:      { ...typography.h2, color: colors.textPrimary, marginTop:12, marginBottom:8 },
  slotRow:        { flexDirection:'row', justifyContent:'space-between', marginBottom:10 },
  pickerBtn:      { flex:1, backgroundColor:colors.white, padding:10, borderRadius:8, borderWidth:1, borderColor:colors.primary, marginHorizontal:4, alignItems:'center' },
  addSlotBtn:     { alignSelf:'center', marginVertical:10 },
  addSlotText:    { color: colors.primary, ...typography.body, fontWeight:'600' },
  bannerPicker:   { backgroundColor:colors.white, height: 120, borderRadius:8, borderWidth:1, borderColor:colors.primary, justifyContent:'center', alignItems:'center', marginBottom:12 },
  bannerText:     { color: colors.primary },
  bannerPreview:  { width:'100%', height:120, borderRadius:8 },
  submitBtn:      { backgroundColor: colors.primary, padding:14, borderRadius:25, alignItems:'center', marginTop:20 },
  submitText:     { color: colors.buttonText, ...typography.body, fontWeight:'600' }
});
