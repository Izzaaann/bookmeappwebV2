// src/screens/Profile.js

import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { auth, db } from '../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile, updateEmail } from 'firebase/auth';
import colors from '../theme/colors';
import typography from '../theme/typography';

export default function Profile({ route, navigation }) {
  const { mode } = route.params;                // 'usuario' | 'empresa'
  const uid = auth.currentUser.uid;
  const col = mode === 'empresa' ? 'business' : 'users';

  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState('data');

  // comunes
  const [name, setName] = useState('');
  const [email, setEmail] = useState(auth.currentUser.email);
  const [phone, setPhone] = useState('');

  // usuario
  const [birthdate, setBirthdate] = useState('');

  // empresa
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');

  const [newPass, setNewPass] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, col, uid));
        if (snap.exists()) {
          const d = snap.data();
          if (mode === 'empresa') {
            setName(d.businessName || '');
            setPhone(d.phone || '');
            setAddress(d.address || '');
            setDescription(d.description || '');
          } else {
            setName(d.name || '');
            setPhone(d.phone || '');
            setBirthdate(d.birthdate || '');
          }
        }
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'No se pudo cargar perfil.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveData = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Error', 'Nombre y correo obligatorios.');
      return;
    }
    setLoading(true);
    try {
      const ref = doc(db, col, uid);
      const payload = {
        email: email.trim(),
        phone: phone.trim() || null
      };
      if (mode === 'empresa') {
        payload.businessName = name.trim();
        payload.address      = address.trim()      || null;
        payload.description  = description.trim()  || null;
      } else {
        payload.name       = name.trim();
        payload.birthdate  = birthdate.trim()     || null;
      }
      await updateDoc(ref, payload);

      // auth
      if (mode === 'empresa') {
        await updateProfile(auth.currentUser, { displayName: name.trim() });
      } else {
        await updateProfile(auth.currentUser, { displayName: name.trim() });
      }
      if (auth.currentUser.email !== email.trim()) {
        await updateEmail(auth.currentUser, email.trim());
      }

      Alert.alert('Éxito', 'Datos guardados.', [
        { text:'OK', onPress:()=>navigation.goBack() }
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
      Alert.alert('Error','Contraseña mínimo 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await auth.currentUser.updatePassword(newPass);
      Alert.alert('Éxito','Contraseña actualizada.',[
        { text:'OK', onPress:()=>navigation.goBack() }
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert('Error','No se pudo actualizar contraseña.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" color={colors.primary}/>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Mi Perfil</Text>

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleBtn, section==='data' && styles.activeToggle]}
          onPress={()=>setSection('data')}
        >
          <Text style={[styles.toggleText, section==='data'&&styles.activeText]}>Datos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, section==='password' && styles.activeToggle]}
          onPress={()=>setSection('password')}
        >
          <Text style={[styles.toggleText, section==='password'&&styles.activeText]}>Contraseña</Text>
        </TouchableOpacity>
      </View>

      {section==='data' ? (
        <>
          <Text style={styles.label}>
            {mode==='empresa' ? 'Nombre comercial' : 'Nombre'}
          </Text>
          <TextInput style={styles.input} value={name} onChangeText={setName}/>

          <Text style={styles.label}>Correo electrónico</Text>
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

          {mode==='empresa' ? (
            <>
              <Text style={styles.label}>Dirección (opcional)</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
              />
              <Text style={styles.label}>Descripción corta (opcional)</Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>Fecha nacimiento (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={birthdate}
                onChangeText={setBirthdate}
              />
            </>
          )}

          <TouchableOpacity style={styles.saveBtn} onPress={saveData}>
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
            placeholder="Mínimo 6 caracteres"
          />
          <TouchableOpacity style={styles.saveBtn} onPress={savePassword}>
            <Text style={styles.saveText}>Guardar Contraseña</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:        { padding:20, backgroundColor:colors.background, flexGrow:1 },
  loader:           { flex:1, justifyContent:'center', alignItems:'center' },
  title:            { ...typography.h1, color:colors.textPrimary, textAlign:'center', marginBottom:20 },
  toggleContainer:  { flexDirection:'row', justifyContent:'space-around', marginBottom:20 },
  toggleBtn:        {
                      paddingVertical:10,
                      paddingHorizontal:20,
                      borderRadius:20,
                      backgroundColor:colors.white,
                      borderWidth:1,
                      borderColor:colors.primary
                    },
  toggleText:       { ...typography.body, color:colors.primary, fontWeight:'600' },
  activeToggle:     { backgroundColor:colors.primary },
  activeText:       { color:colors.buttonText },

  label:            { ...typography.body, color:colors.textPrimary, marginBottom:6 },
  input:            {
                      backgroundColor:colors.white,
                      padding:12,
                      borderRadius:8,
                      borderWidth:1,
                      borderColor:colors.primary,
                      marginBottom:16
                    },
  saveBtn:          { backgroundColor:colors.primary, padding:14, borderRadius:25, alignItems:'center', marginTop:10 },
  saveText:         { ...typography.body, color:colors.buttonText, fontWeight:'600' }
});
