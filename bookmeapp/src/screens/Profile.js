import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  ScrollView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { CLOUDINARY_URL, CLOUDINARY_UPLOAD_PRESET } from '../config';
import colors from '../theme/colors';
import typography from '../theme/typography';

export default function Profile({ route, navigation }) {
  const { mode } = route.params;               // 'usuario' | 'empresa'
  const uid = auth.currentUser.uid;
  const col = mode === 'empresa' ? 'business' : 'users';

  const [loading, setLoading]       = useState(true);
  const [section, setSection]       = useState('datos');
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [phone, setPhone]           = useState('');
  const [birthdate, setBirthdate]   = useState('');
  const [newPass, setNewPass]       = useState('');
  const [photoURL, setPhotoURL]     = useState(null);      // re-added for user

  // Campos empresa
  const [address, setAddress]       = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl]       = useState(null);
  const [bannerUrl, setBannerUrl]   = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const ref  = doc(db, col, uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const d = snap.data();
          setName(d.name || '');
          setEmail(d.email || auth.currentUser.email);
          setPhone(d.phone || '');
          setBirthdate(d.birthdate || '');
          if (mode === 'usuario') {
            setPhotoURL(d.photoURL || auth.currentUser.photoURL || null);
          }
          if (mode === 'empresa') {
            setAddress(d.address || '');
            setDescription(d.description || '');
            setLogoUrl(d.logoUrl || null);
            setBannerUrl(d.bannerUrl || null);
          }
        } else {
          await setDoc(ref, {
            name:  auth.currentUser.displayName || '',
            email: auth.currentUser.email,
            photoURL: auth.currentUser.photoURL || null,
            ...(mode === 'empresa'
              ? { address: '', description: '', logoUrl: null, bannerUrl: null }
              : {})
          });
          setPhotoURL(auth.currentUser.photoURL || null);
        }
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'No se pudo cargar el perfil.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pickImage = async type => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permiso denegado', 'Necesito acceso a la galería.');
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (res.canceled) return;
    const uri = res.assets[0].uri;
    uploadImage(uri, type);
  };

  const uploadImage = (uri, imageType) => {
    setLoading(true);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', CLOUDINARY_URL);
    xhr.onload = async () => {
      setLoading(false);
      if (xhr.status !== 200) {
        return Alert.alert('Error', 'No se pudo subir la imagen.');
      }
      const resp = JSON.parse(xhr.response);
      const secure = resp.secure_url;
      const data = {};
      if (imageType === 'client_profile') {
        setPhotoURL(secure);
        data.photoURL = secure;
        await updateProfile(auth.currentUser, { photoURL: secure });
      } else if (imageType === 'business_profile') {
        setLogoUrl(secure);
        data.logoUrl = secure;
      } else if (imageType === 'business_banner') {
        setBannerUrl(secure);
        data.bannerUrl = secure;
      }
      await updateDoc(doc(db, col, uid), data);
    };
    xhr.onerror = () => {
      setLoading(false);
      Alert.alert('Error', 'No se pudo subir la imagen.');
    };
    const formData = new FormData();
    formData.append('file', {
      uri: Platform.OS === 'ios' ? uri.replace('file://','') : uri,
      name: 'upload.jpg',
      type: 'image/jpeg'
    });
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    xhr.send(formData);
  };

  const saveDatos = async () => {
    if (!name.trim() || !email.trim()) {
      return Alert.alert('Error', 'Nombre y correo obligatorios.');
    }
    setLoading(true);
    try {
      const data = { name, email, phone: phone || null, birthdate: birthdate || null };
      if (mode === 'usuario') {
        data.photoURL = photoURL || null;
      }
      if (mode === 'empresa') {
        Object.assign(data, {
          address: address || null,
          description: description || null,
          logoUrl: logoUrl || null,
          bannerUrl: bannerUrl || null
        });
      }
      await updateDoc(doc(db, col, uid), data);
      if (mode === 'usuario') {
        await updateProfile(auth.currentUser, { displayName: name, photoURL });
      }
      Alert.alert('Éxito', 'Datos actualizados.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudieron guardar los datos.');
    } finally {
      setLoading(false);
    }
  };

  const savePassword = async () => {
    if (newPass.length < 6) {
      return Alert.alert('Error', 'Contraseña ≥6 caracteres.');
    }
    setLoading(true);
    try {
      await auth.currentUser.updatePassword(newPass);
      Alert.alert('Éxito', 'Contraseña actualizada.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Mi Perfil</Text>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleBtn, section === 'datos' && styles.activeToggle]}
          onPress={() => setSection('datos')}
        >
          <Text style={[styles.toggleText, section === 'datos' && styles.activeText]}>
            Datos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, section === 'password' && styles.activeToggle]}
          onPress={() => setSection('password')}
        >
          <Text style={[styles.toggleText, section === 'password' && styles.activeText]}>
            Contraseña
          </Text>
        </TouchableOpacity>
      </View>

      {section === 'datos' ? (
        <>
          {/* Foto perfil sólo para usuario */}
          {mode === 'usuario' && (
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={() => pickImage('client_profile')}
            >
              {photoURL ? (
                <Image source={{ uri: photoURL }} style={styles.avatar} />
              ) : (
                <Text style={styles.addPhotoText}>+ Foto de perfil</Text>
              )}
            </TouchableOpacity>
          )}

          <Text style={styles.label}>Nombre</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
          <Text style={styles.label}>Correo</Text>
          <TextInput
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <Text style={styles.label}>Teléfono (opcional)</Text>
          <TextInput
            style={styles.input}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <Text style={styles.label}>Fecha Nac. (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={birthdate}
            onChangeText={setBirthdate}
          />

          {mode === 'empresa' && (
            <>
              <Text style={styles.label}>Dirección (opcional)</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
              />
              <Text style={styles.label}>Descripción (opcional)</Text>
              <TextInput
                style={[styles.input, { height: 80 }]}
                multiline
                value={description}
                onChangeText={setDescription}
              />

              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => pickImage('business_profile')}
              >
                <Text style={styles.uploadText}>
                  {logoUrl ? 'Cambiar Logo' : 'Subir Logo'}
                </Text>
              </TouchableOpacity>
              {logoUrl && <Image source={{ uri: logoUrl }} style={styles.previewImage} />}

              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => pickImage('business_banner')}
              >
                <Text style={styles.uploadText}>
                  {bannerUrl ? 'Cambiar Banner' : 'Subir Banner'}
                </Text>
              </TouchableOpacity>
              {bannerUrl && <Image source={{ uri: bannerUrl }} style={styles.bannerPreview} />}
            </>
          )}

          <TouchableOpacity style={styles.saveBtn} onPress={saveDatos}>
            <Text style={styles.saveText}>Guardar Datos</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.label}>Nueva Contraseña</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={newPass}
            onChangeText={setNewPass}
            placeholder="≥6 caracteres"
          />
          <TouchableOpacity style={styles.saveBtn} onPress={savePassword}>
            <Text style={styles.saveText}>Cambiar Contraseña</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.background },
  loader:          { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title:           { ...typography.h1, textAlign: 'center', marginBottom: 20 },

  toggleContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  toggleBtn:       { padding: 10, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.primary },
  activeToggle:    { backgroundColor: colors.primary },
  toggleText:      { ...typography.body, color: colors.primary },
  activeText:      { color: colors.buttonText },

  avatarContainer: { alignSelf: 'center', marginBottom: 16 },
  avatar:          { width: 100, height: 100, borderRadius: 50 },
  addPhotoText:    { ...typography.body, color: colors.primary },

  label:           { ...typography.body, marginBottom: 6 },
  input:           { backgroundColor: colors.white, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.primary, marginBottom: 12 },

  uploadBtn:       { backgroundColor: colors.white, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', marginVertical: 8 },
  uploadText:      { ...typography.body, color: colors.primary },
  previewImage:    { width: 80, height: 80, borderRadius: 8, marginBottom: 12, alignSelf: 'center' },
  bannerPreview:   { width: '100%', height: 100, borderRadius: 8, marginBottom: 12 },

  saveBtn:         { backgroundColor: colors.primary, padding: 14, borderRadius: 25, alignItems: 'center', marginTop: 10 },
  saveText:        { ...typography.body, color: colors.buttonText, fontWeight: '600' }
});
