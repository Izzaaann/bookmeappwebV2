import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Image
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import colors from '../theme/colors';
import typography from '../theme/typography';
import { Ionicons } from '@expo/vector-icons';

export default function Welcome({ route, navigation }) {
  const { mode } = route.params;
  const [userData, setUserData] = useState({ name: '', photoURL: null });
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(mode === 'usuario');

  useEffect(() => {
    (async () => {
      const uid = auth.currentUser.uid;
      const colName = mode === 'empresa' ? 'business' : 'users';
      const snap = await getDoc(doc(db, colName, uid));
      if (snap.exists()) {
        const d = snap.data();
        setUserData({
          name: mode === 'empresa' ? d.businessName : d.name,
          photoURL: d.photoURL || null
        });
      }
      if (mode === 'usuario') {
        setLoading(true);
        const snap2 = await getDocs(collection(db, 'business'));
        setCompanies(snap2.docs.map(d => ({ id: d.id, name: d.data().businessName })));
        setLoading(false);
      }
    })();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Profile', { mode })}>
          {userData.photoURL ? (
            <Image source={{ uri: userData.photoURL }} style={styles.avatar} />
          ) : (
            <Ionicons name="person-circle" size={36} color={colors.white} />
          )}
        </TouchableOpacity>
        <Text style={styles.title}>
          Bienvenido <Text style={styles.name}>{userData.name}</Text>
        </Text>
        {mode === 'usuario' && (
          <TouchableOpacity onPress={() => navigation.navigate('MyReservations')}>
            <Ionicons name="calendar-outline" size={28} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>

      {mode === 'empresa' ? (
        <View style={styles.empresaMenu}>
          <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Services')}>
            <Text style={styles.btnText}>Servicios</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('ManageBookings')}>
            <Text style={styles.btnText}>Gestionar Citas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('ManageSchedule')}>
            <Text style={styles.btnText}>Gestionar Horario</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary} />
      ) : companies.length === 0 ? (
        <Text style={styles.emptyText}>No hay empresas disponibles.</Text>
      ) : (
        <FlatList
          data={companies}
          keyExtractor={i => i.id}
          contentContainerStyle={{ paddingTop: 20 }}
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

      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.background },
  header:       {
                  backgroundColor: colors.primary,
                  paddingTop: 50,
                  paddingBottom: 20,
                  paddingHorizontal: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                },
  avatar:       { width: 36, height: 36, borderRadius: 18 },
  title:        { color: colors.white, fontSize: 20 },
  name:         { fontSize: 24, fontWeight: '700' },
  empresaMenu:  { marginTop: 40, alignItems: 'center' },
  btn:          {
                  width: '80%',
                  backgroundColor: colors.white,
                  padding: 14,
                  borderRadius: 30,
                  marginVertical: 10,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOpacity: 0.1,
                  shadowRadius: 10,
                  elevation: 5
                },
  btnText:      { color: colors.primary, fontSize: 16, fontWeight: '600' },
  emptyText:    { textAlign: 'center', marginTop: 40, color: colors.textSecondary },
  card:         {
                  backgroundColor: colors.white,
                  marginHorizontal: 20,
                  marginVertical: 8,
                  padding: 16,
                  borderRadius: 12,
                  elevation: 3
                },
  companyName:  { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  logout:       { alignSelf: 'center', marginVertical: 20 },
  logoutText:   { color: colors.primary, fontSize: 16, fontWeight: '600' }
});
