// src/screens/Register.js

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  StatusBar,
  Alert,
  ScrollView
} from 'react-native';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import colors from '../theme/colors';
import typography from '../theme/typography';
import UserCompanySelector from '../components/UserCompanySelector';

export default function Register({ navigation }) {
  const [mode, setMode] = useState('usuario');
  const [name, setName] = useState('');        // usuario o nombre comercial
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // campos solo empresa
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Rellena los campos obligatorios');
      return;
    }
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      // displayName: nombre de usuario o nombre comercial
      await updateProfile(user, { displayName: name.trim() });

      if (mode === 'empresa') {
        // Guardar en /business/{uid}
        await setDoc(doc(db, 'business', user.uid), {
          businessName:     name.trim(),
          email:            email.trim(),
          phone:            phone.trim() || null,
          address:          address.trim() || null,
          description:      description.trim() || null,
          createdAt:        new Date(),
          schedule: {}      // se inicializará al entrar en ManageSchedule
        });
      } else {
        // Guardar en /users/{uid}
        await setDoc(doc(db, 'users', user.uid), {
          name:        name.trim(),
          email:       email.trim(),
          phone:       phone.trim() || null,
          birthdate:   null
        });
      }

      await sendEmailVerification(user);

      Alert.alert(
        '¡Cuenta creada!',
        'Revisa tu correo para verificar la cuenta.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Error al registrar', error.message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <Text style={styles.header}>Registro</Text>
      <UserCompanySelector selected={mode} onSelect={setMode} />

      <TextInput
        placeholder={mode === 'usuario' ? 'Nombre de usuario' : 'Nombre comercial'}
        style={styles.input}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        placeholder="Correo electrónico"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Contraseña"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        placeholder="Teléfono (opcional)"
        style={styles.input}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      {mode === 'empresa' && (
        <>
          <TextInput
            placeholder="Dirección (opcional)"
            style={styles.input}
            value={address}
            onChangeText={setAddress}
          />
          <TextInput
            placeholder="Descripción corta (opcional)"
            style={styles.input}
            value={description}
            onChangeText={setDescription}
          />
        </>
      )}

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Registrar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { padding:20, backgroundColor:colors.background, flexGrow:1, justifyContent:'center' },
  header:       { ...typography.h1, color:colors.textPrimary, textAlign:'center', marginBottom:20 },
  input:        {
                  backgroundColor:colors.white,
                  padding:12,
                  borderRadius:8,
                  marginVertical:8,
                  borderWidth:1,
                  borderColor:colors.primary
                },
  button:       { backgroundColor:colors.primary, padding:14, borderRadius:25, alignItems:'center', marginTop:20 },
  buttonText:   { ...typography.body, color:colors.buttonText, fontWeight:'600' }
});
