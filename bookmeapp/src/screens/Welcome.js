// src/screens/Welcome.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import colors from '../theme/colors';
import typography from '../theme/typography';

export default function Welcome({ route, navigation }) {
  const { name, mode } = route.params; // 'usuario' o 'empresa'
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(mode === 'usuario');

  useEffect(() => {
    if (mode === 'usuario') {
      (async () => {
        setLoading(true);
        try {
          const snap = await getDocs(collection(db, 'empresas'));
          setCompanies(snap.docs.map(d => ({
            id: d.id,
            name: d.data().name
          })));
        } catch (e) {
          console.error('Error cargando empresas:', e);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [mode]);

  const handleLogout = async () => {
    await signOut(auth);
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {mode === 'empresa' ? (
        <>
          <Text style={styles.header}>Panel de Empresa</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('AddEvent')}
          >
            <Text style={styles.buttonText}>Añadir Evento</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Modificar Evento</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Eliminar Evento</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.topRow}>
            <Text style={styles.header}>Bienvenido {name}</Text>
            <TouchableOpacity
              style={styles.resBtn}
              onPress={() => navigation.navigate('MyReservations')}
            >
              <Text style={styles.resText}>Mis Reservas</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : companies.length === 0 ? (
            <Text style={styles.emptyText}>No hay empresas disponibles.</Text>
          ) : (
            <FlatList
              data={companies}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() =>
                    navigation.navigate('CompanyDetails', {
                      companyId: item.id,
                      companyName: item.name
                    })
                  }
                >
                  <Text style={styles.companyName}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </>
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor: colors.background, padding:20 },
  topRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  header: { ...typography.h1, color: colors.textPrimary, marginBottom:20 },
  resBtn: { padding:6, backgroundColor: colors.primary, borderRadius:6 },
  resText: { color: colors.buttonText, ...typography.body, fontWeight:'600' },
  button: {
    width:'80%', backgroundColor:colors.primary, padding:14,
    borderRadius:25, alignItems:'center', marginVertical:10, alignSelf:'center'
  },
  buttonText: { color: colors.buttonText, ...typography.body, fontWeight:'600' },
  emptyText: { ...typography.body, color: colors.textPrimary, textAlign:'center', marginTop:40 },
  card: {
    backgroundColor:colors.white, padding:16, borderRadius:8,
    marginBottom:12, borderWidth:1, borderColor:colors.primary
  },
  companyName: { ...typography.h2, color: colors.textPrimary },
  logoutBtn: { marginTop:20, alignSelf:'center' },
  logoutText: { color: colors.primary, ...typography.body, fontWeight:'600' }
});
