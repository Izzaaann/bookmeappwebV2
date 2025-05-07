// src/screens/ManageSchedule.js

import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { auth, db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import colors from '../theme/colors';
import typography from '../theme/typography';

const WEEK_DAYS = [
  'Domingo','Lunes','Martes','Miércoles',
  'Jueves','Viernes','Sábado'
];

export default function ManageSchedule({ navigation }) {
  const uid = auth.currentUser.uid;
  const ref = doc(db, 'business', uid);

  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setSchedule(snap.data().schedule || {});
        } else {
          const init = {};
          WEEK_DAYS.forEach(day => {
            init[day] = { open:'09:00', close:'18:00', closed:false };
          });
          setSchedule(init);
          await setDoc(ref, { schedule:init }, { merge:true });
        }
      } catch (e) {
        console.error(e);
        Alert.alert('Error','No se pudo cargar horario.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updateDay = (day, field, value) => {
    setSchedule(s => ({
      ...s,
      [day]: { ...s[day], [field]: field==='closed' ? value : value.trim() }
    }));
  };

  const save = async () => {
    setLoading(true);
    try {
      await updateDoc(ref, { schedule });
      Alert.alert('Éxito','Horario guardado.',[
        { text:'OK', onPress:()=>navigation.goBack() }
      ]);
    } catch(e) {
      console.error(e);
      Alert.alert('Error','No se pudo guardar horario.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary}/>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Gestionar Horario</Text>
      {WEEK_DAYS.map(day => {
        const info = schedule[day] || { open:'', close:'', closed:true };
        return (
          <View key={day} style={styles.dayRow}>
            <Text style={styles.dayLabel}>{day}</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, info.closed && styles.inputDisabled]}
                value={info.open}
                onChangeText={t => updateDay(day,'open',t)}
                placeholder="HH:MM"
              />
              <TextInput
                style={[styles.input, info.closed && styles.inputDisabled]}
                value={info.close}
                onChangeText={t => updateDay(day,'close',t)}
                placeholder="HH:MM"
              />
            </View>
            <TouchableOpacity
              onPress={()=>updateDay(day,'closed',!info.closed)}
              style={[styles.checkbox, info.closed&&styles.checkboxChecked]}
            >
              <Text style={styles.checkText}>
                {info.closed ? 'CERRADO' : 'ABIERTO'}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}
      <TouchableOpacity style={styles.saveBtn} onPress={save}>
        <Text style={styles.saveTxt}>Guardar Horario</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:      { padding:20, backgroundColor:colors.background },
  center:         { flex:1, justifyContent:'center', alignItems:'center' },
  title:          { ...typography.h1, textAlign:'center', marginBottom:20, color:colors.textPrimary },

  dayRow:        { marginBottom:16, backgroundColor:colors.white, padding:12, borderRadius:8 },
  dayLabel:      { ...typography.h2, marginBottom:8, color:colors.textPrimary },
  row:           { flexDirection:'row', justifyContent:'space-between' },
  input:         {
                   flex:1,
                   backgroundColor:colors.white,
                   borderWidth:1,
                   borderColor:colors.primary,
                   borderRadius:6,
                   padding:8,
                   marginHorizontal:4
                 },
  inputDisabled: { backgroundColor:'#f0f0f0' },

  checkbox:      {
                   marginTop:8,
                   paddingVertical:6,
                   borderRadius:6,
                   borderWidth:1,
                   borderColor:colors.primary,
                   alignItems:'center'
                 },
  checkboxChecked:{ backgroundColor:colors.primary },
  checkText:     { ...typography.body, color:colors.white, fontWeight:'600' },

  saveBtn:       {
                   backgroundColor:colors.primary,
                   padding:14,
                   borderRadius:25,
                   alignItems:'center',
                   marginTop:20
                 },
  saveTxt:       { ...typography.body, color:colors.buttonText, fontWeight:'600' }
});
