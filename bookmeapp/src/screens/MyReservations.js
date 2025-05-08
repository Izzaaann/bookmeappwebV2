// src/screens/MyReservations.js

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput
} from 'react-native';
import { auth, db } from '../firebase/config';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import colors from '../theme/colors';
import typography from '../theme/typography';

export default function MyReservations() {
  const userId = auth.currentUser.uid;
  const reservationsRef = collection(db, 'users', userId, 'reservations');
  const now = new Date();

  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState([]);    // próximas
  const [past, setPast] = useState([]);        // finalizadas

  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});

  const [tab, setTab] = useState('activas');   // 'activas' | 'finalizadas'

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(reservationsRef);
      const all = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        // filtrar sólo aquellos con slot definido
        .filter(r => r.slot && r.slot.date && r.slot.from);
      // ordenar por fecha+hora en JS
      all.sort((a, b) => {
        const da = new Date(`${a.slot.date}T${a.slot.from}`);
        const db_ = new Date(`${b.slot.date}T${b.slot.from}`);
        return da - db_;
      });
      const a = [], p = [];
      all.forEach(res => {
        const dt = new Date(`${res.slot.date}T${res.slot.from}`);
        if (dt > now) a.push(res);
        else p.push(res);
      });
      setActive(a);
      setPast(p);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudieron cargar las reservas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCancel = res => {
    Alert.alert(
      'Cancelar reserva',
      `¿Eliminar ${res.serviceName} el ${res.slot.date} a las ${res.slot.from}?`,
      [
        { text: 'No', style: 'cancel' },
        { text: 'Sí', onPress: async () => {
            try {
              await deleteDoc(doc(reservationsRef, res.id));
              load();
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'No se pudo cancelar.');
            }
          }}
      ]
    );
  };

  const saveRating = async res => {
    const rating = ratings[res.id] || 0;
    const comment = comments[res.id] || '';
    if (rating < 1 || rating > 5) {
      Alert.alert('Error', 'Selecciona una valoración de 1 a 5 estrellas.');
      return;
    }
    try {
      const reviewRef = doc(
        db,
        'business',
        res.companyId,
        'services',
        res.serviceId,
        'reviews',
        res.id
      );
      await updateDoc(reviewRef, { rating, comment }, { merge: true });
      Alert.alert('¡Gracias!', 'Valoración registrada.');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo guardar valoración.');
    }
  };

  const renderReservation = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.info}>
        <Text style={styles.serviceName}>{item.serviceName}</Text>
        <Text style={styles.slotText}>
          📅 {item.slot?.date || '—'}
        </Text>
        <Text style={styles.slotText}>
          ⏰ {item.slot?.from || '—'} – {item.slot?.to || '—'}
        </Text>
      </View>
      {tab === 'activas' ? (
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => handleCancel(item)}
        >
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      ) : (
        <>
          <View style={styles.ratingRow}>
            {[1,2,3,4,5].map(n => (
              <TouchableOpacity
                key={n}
                onPress={() => setRatings(r => ({ ...r, [item.id]: n }))}
              >
                <Text style={[
                  styles.star,
                  ratings[item.id] >= n && styles.starSelected
                ]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.commentInput}
            placeholder="Comentario (opcional)"
            value={comments[item.id] || ''}
            onChangeText={t => setComments(c => ({ ...c, [item.id]: t }))}
          />
          <TouchableOpacity
            style={styles.saveRatingBtn}
            onPress={() => saveRating(item)}
          >
            <Text style={styles.saveRatingText}>Guardar Valoración</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary}/>
      </View>
    );
  }

  const data = tab === 'activas' ? active : past;

  return (
    <View style={styles.container}>
      {/* Pestañas */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'activas' && styles.tabActive]}
          onPress={() => setTab('activas')}
        >
          <Text style={[styles.tabText, tab === 'activas' && styles.tabTextActive]}>
            Reservas Activas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === 'finalizadas' && styles.tabActive]}
          onPress={() => setTab('finalizadas')}
        >
          <Text style={[styles.tabText, tab === 'finalizadas' && styles.tabTextActive]}>
            Reservas Finalizadas
          </Text>
        </TouchableOpacity>
      </View>

      {data.length === 0 ? (
        <Text style={styles.emptyText}>
          {tab === 'activas'
            ? 'No tienes reservas activas.'
            : 'No hay reservas finalizadas.'}
        </Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          renderItem={renderReservation}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex:1, backgroundColor:colors.background, padding:20 },
  center:          { flex:1, justifyContent:'center', alignItems:'center', backgroundColor:colors.background },
  tabRow:          { flexDirection:'row', marginBottom:20 },
  tabBtn:          {
                     flex:1,
                     paddingVertical:10,
                     borderBottomWidth:2,
                     borderColor:'transparent',
                     alignItems:'center'
                   },
  tabActive:       { borderColor:colors.primary },
  tabText:         { ...typography.body, color:colors.textSecondary },
  tabTextActive:   { color:colors.primary, fontWeight:'600' },
  emptyText:       { textAlign:'center', color:colors.textSecondary, marginTop:40 },

  card:            {
                     backgroundColor:colors.white,
                     padding:16,
                     borderRadius:8,
                     marginBottom:12,
                     borderWidth:1,
                     borderColor:colors.primary
                   },
  info:            {},
  serviceName:     { ...typography.h2 },
  slotText:        { ...typography.body, marginVertical:2 },

  cancelBtn:       { alignSelf:'flex-end', marginTop:8 },
  cancelText:      { color:'red', ...typography.body, fontWeight:'600' },

  ratingRow:       { flexDirection:'row', marginTop:8 },
  star:            { fontSize:24, color:'#ccc', marginHorizontal:2 },
  starSelected:    { color:'#f5a623' },
  commentInput:    {
                     backgroundColor:colors.white,
                     padding:8,
                     borderRadius:6,
                     borderWidth:1,
                     borderColor:colors.primary,
                     marginTop:8
                   },
  saveRatingBtn:   {
                     backgroundColor:colors.primary,
                     padding:10,
                     borderRadius:20,
                     alignItems:'center',
                     marginTop:8
                   },
  saveRatingText:  { ...typography.body, color:colors.buttonText }
});
