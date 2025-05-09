import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from '../firebase/config';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { uploadToCloudinary } from '../utils/cloudinary';
import colors from '../theme/colors';
import typography from '../theme/typography';
import { Ionicons } from '@expo/vector-icons';

export default function Profile({ route, navigation }) {
  const { mode } = route.params; // 'usuario' | 'empresa'
  const uid = auth.currentUser.uid;
  const col = mode === 'empresa' ? 'business' : 'users';

  const [loading, setLoading]       = useState(true);
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState(auth.currentUser.email);
  const [phone, setPhone]           = useState('');
  const [birth, setBirth]           = useState('');
  const [description, setDescription] = useState('');
  const [photoURL, setPhotoURL]     = useState('');
  const [logoUrl, setLogoUrl]       = useState('');
  const [bannerUrl, setBannerUrl]   = useState('');
  const [newPass, setNewPass]       = useState('');

  useEffect(() => {
    (async () => {
      try {
        const ref = doc(db, col, uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const d = snap.data();
          setName(d.name || auth.currentUser.displayName || '');
          setPhone(d.phone || '');
          setBirth(d.birth || '');
          if (mode === 'empresa') {
            setDescription(d.description || '');
            setLogoUrl(d.logoUrl || '');
            setBannerUrl(d.bannerUrl || '');
          } else {
            setPhotoURL(d.photoURL || auth.currentUser.photoURL || '');
          }
        } else {
          await setDoc(ref, { name: auth.currentUser.displayName || '' });
        }
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'No se pudo cargar el perfil.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pickAndUpload = async (field) => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a la galería.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7
      });
      if (result.canceled) return;
      const file = result.assets[0];
      const url = await uploadToCloudinary(
        { uri: file.uri },
        mode === 'empresa' && field !== 'photoURL'
          ? field === 'logoUrl' ? 'business_profile' : 'business_banner'
          : 'client_profile'
      );
      if (field === 'photoURL') setPhotoURL(url);
      if (field === 'logoUrl') setLogoUrl(url);
      if (field === 'bannerUrl') setBannerUrl(url);
      await updateDoc(doc(db, col, uid), { [field]: url });
      if (field === 'photoURL') {
        await updateProfile(auth.currentUser, { photoURL: url });
      }
      Alert.alert('Éxito', 'Imagen actualizada correctamente');
    } catch (e) {
      console.error('Error subiendo imagen:', e);
      Alert.alert('Error', 'No se pudo subir la imagen.');
    }
  };

  const saveProfile = async () => {
    if (!name.trim()) {
      return Alert.alert('Error', 'El nombre es obligatorio.');
    }
    setLoading(true);
    try {
      const ref = doc(db, col, uid);
      const data = { name: name.trim(), email, phone };
      if (mode === 'usuario') {
        data.birth = birth;
        data.photoURL = photoURL;
      } else {
        data.description = description;
        data.logoUrl = logoUrl;
        data.bannerUrl = bannerUrl;
      }
      await updateDoc(ref, data);
      if (mode === 'usuario') {
        await updateProfile(auth.currentUser, { displayName: name.trim(), photoURL });
      } else {
        await updateProfile(auth.currentUser, { displayName: name.trim() });
      }
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo guardar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    if (newPass.length < 6) {
      return Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
    }
    setLoading(true);
    try {
      await auth.currentUser.updatePassword(newPass);
      Alert.alert('Éxito', 'Contraseña actualizada correctamente');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const doLogout = async () => {
    await auth.signOut();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Mi Perfil</Text>

      <View style={styles.imageRow}>
        {mode === 'usuario' ? (
          photoURL
            ? <Image source={{ uri: photoURL }} style={styles.avatarLarge}/>
            : <Ionicons name="person-circle-outline" size={80} color={colors.primary}/>
        ) : (
          logoUrl
            ? <Image source={{ uri: logoUrl }} style={styles.avatarLarge}/>
            : <Ionicons name="business" size={80} color={colors.primary}/>
        )}
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={() => pickAndUpload(mode === 'empresa' ? 'logoUrl' : 'photoURL')}
        >
          <Text style={styles.uploadText}>
            {mode === 'empresa' ? 'Subir logo' : 'Subir foto'}
          </Text>
        </TouchableOpacity>
        {mode === 'empresa' && (
          <TouchableOpacity
            style={[styles.uploadBtn, { marginLeft: 8 }]}
            onPress={() => pickAndUpload('bannerUrl')}
          >
            <Text style={styles.uploadText}>Subir banner</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.label}>Nombre</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Correo</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} />

      <Text style={styles.label}>Teléfono (opcional)</Text>
      <TextInput style={styles.input} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

      {mode === 'usuario' && (
        <>
          <Text style={styles.label}>Fecha nacimiento (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={birth}
            onChangeText={setBirth}
          />
        </>
      )}

      {mode === 'empresa' && (
        <>
          <Text style={styles.label}>Descripción (opcional)</Text>
          <TextInput
            style={[styles.input, { height: 80 }]}
            multiline
            value={description}
            onChangeText={setDescription}
          />
        </>
      )}

      <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
        <Text style={styles.saveText}>Guardar Perfil</Text>
      </TouchableOpacity>

      <Text style={[styles.section, { marginTop: 24 }]}>Cambiar Contraseña</Text>
      <TextInput
        style={styles.input}
        secureTextEntry
        value={newPass}
        onChangeText={setNewPass}
        placeholder="Nueva contraseña"
      />
      <TouchableOpacity style={styles.saveBtn} onPress={changePassword}>
        <Text style={styles.saveText}>Actualizar Contraseña</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={doLogout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { padding: 20, backgroundColor: colors.background },
  center:          { flex:1, justifyContent:'center', alignItems:'center', backgroundColor: colors.background },
  title:           { ...typography.h1, textAlign:'center', marginBottom: 20 },

  imageRow:        { flexDirection:'row', alignItems:'center', marginBottom: 20 },
  avatarLarge:     { width:80, height:80, borderRadius:40, marginRight:12 },
  uploadBtn:       { backgroundColor: colors.primary, padding:8, borderRadius:20 },
  uploadText:      { color: colors.buttonText, fontWeight:'600' },

  label:           { ...typography.body, marginTop: 12 },
  input:           { backgroundColor: colors.white, padding:12, borderRadius:8, borderWidth:1, borderColor: colors.primary, marginTop:6 },

  section:         { ...typography.h2, marginBottom: 8 },

  saveBtn:         { backgroundColor: colors.primary, padding:14, borderRadius:25, alignItems:'center', marginTop: 16 },
  saveText:        { color: colors.buttonText, ...typography.body, fontWeight:'600' },

  logoutBtn:       { marginTop:30, padding:14, borderRadius:25, alignItems:'center', backgroundColor:'red' },
  logoutText:      { color:'#fff', ...typography.body, fontWeight:'600' }
});
