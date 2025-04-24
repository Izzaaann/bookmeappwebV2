// src/screens/MyReservations.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { auth, db } from '../firebase/config';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';
import colors from '../theme/colors';
import typography from '../theme/typography';

export default function MyReservations() {
  const userId = auth.currentUser.uid;
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, 'users', userId, 'reservations'));
    setReservas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async (res) => {
    Alert.alert(
      'Cancelar reserva',
      `¿Seguro que quieres cancelar ${res.slot.date} ${res.slot.from}-${res.slot.to}?`,
      [
        { text:'No', style:'cancel' },
        { text:'Sí', onPress: async () => {
            try {
              // 1) Eliminar reserva usuario
              await deleteDoc(doc(db, 'users', userId, 'reservations', res.id));
              // 2) Eliminar reserva empresa
              //   (buscamos doc con misma createdAt en usuarios/{company}/reservations)
              const compResSnap = await getDocs(
                collection(db, 'users', res.companyId, 'reservations')
              );
              compResSnap.docs.forEach(async d => {
                const data = d.data();
                if (data.userId === userId &&
                    data.serviceId === res.serviceId &&
                    data.slot.date === res.slot.date &&
                    data.slot.from === res.slot.from) {
                  await deleteDoc(doc(db,'users',res.companyId,'reservations',d.id));
                }
              });

              // 3) Volver a añadir franja a disponibilidad
              const serviceDoc = doc(db,'users',res.companyId,'services',res.serviceId);
              await updateDoc(serviceDoc, {
                availability: arrayUnion(res.slot)
              });

              Alert.alert('Reserva cancelada');
              load();
            } catch(e) {
              console.error(e);
              Alert.alert('Error','No se pudo cancelar');
            }
          }}
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
    <View style={styles.container}>
      <Text style={styles.header}>Mis Reservas</Text>
      <FlatList
        data={reservas}
        keyExtractor={i => i.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No tienes reservas.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.serviceName}>{item.serviceName}</Text>
            <Text style={styles.slotText}>
              {item.slot.date} {item.slot.from}-{item.slot.to}
            </Text>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => handleCancel(item)}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex:1,
    justifyContent:'center',
    alignItems:'center',
    backgroundColor: colors.background
  },
  container: {
    flex:1,
    backgroundColor: colors.background,
    padding:20
  },
  header: {
    ...typography.h1,
    color: colors.textPrimary,
    textAlign:'center',
    marginBottom:20
  },
  emptyText: {
    ...typography.body,
    textAlign:'center',
    color: colors.textPrimary,
    marginTop:40
  },
  card: {
    backgroundColor: colors.white,
    padding:16,
    borderRadius:8,
    marginBottom:12,
    borderWidth:1,
    borderColor: colors.primary
  },
  serviceName: {
    ...typography.h2,
    color: colors.textPrimary
  },
  slotText: {
    ...typography.body,
    marginVertical:8,
    color: colors.textPrimary
  },
  cancelBtn: {
    alignSelf:'flex-end'
  },
  cancelText: {
    color:'red',
    ...typography.body,
    fontWeight:'600'
  }
});
