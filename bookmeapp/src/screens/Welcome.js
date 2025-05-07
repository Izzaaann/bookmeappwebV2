// src/screens/Welcome.js

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

/**
 * Pantalla de bienvenida tras login.
 * - Para modo 'usuario': muestra listado de empresas para reservar.
 * - Para modo 'empresa': muestra menú de gestión.
 *
 * Props recibidas vía React Navigation:
 *  - route.params.mode → 'usuario' | 'empresa'
 *  - navigation       → objeto de navegación
 */
export default function Welcome({ route, navigation }) {
  const { mode } = route.params;
  const [userData, setUserData] = useState({ name: '', photoURL: null });
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(mode === 'usuario');

  useEffect(() => {
    (async () => {
      const uid = auth.currentUser.uid;

      // 1) Carga de datos de perfil (ya sea de 'users' o de 'business')
      try {
        const perfilCol = mode === 'empresa' ? 'business' : 'users';
        const perfilSnap = await getDoc(doc(db, perfilCol, uid));
        if (perfilSnap.exists()) {
          const d = perfilSnap.data();
          setUserData({
            name: d.name || d.businessName || '',
            photoURL: d.photoURL || null
          });
        }
      } catch (e) {
        console.error('Error cargando perfil:', e);
      }

      // 2) Si soy usuario, cargo todas las empresas desde la colección 'business'
      if (mode === 'usuario') {
        setLoading(true);
        try {
          const snap = await getDocs(collection(db, 'business'));
          const lista = snap.docs.map(d => ({
            id: d.id,
            name: d.data().businessName
          }));
          setBusinesses(lista);
        } catch (e) {
          console.error('Error cargando empresas:', e);
        } finally {
          setLoading(false);
        }
      }
    })();
  }, []);

  // Logout
  const handleLogout = async () => {
    await signOut(auth);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }]
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Header */}
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

      {/* Contenido */}
      {mode === 'empresa' ? (
        <View style={styles.empresaMenu}>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.navigate('AddEvent')}
          >
            <Text style={styles.btnText}>Añadir Evento</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.navigate('BusinessSchedule')}
          >
            <Text style={styles.btnText}>Ver Horario</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={colors.primary} />
      ) : businesses.length === 0 ? (
        <Text style={styles.emptyText}>No hay empresas disponibles.</Text>
      ) : (
        <FlatList
          data={businesses}
          keyExtractor={item => item.id}
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

      {/* Logout */}
      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18
  },
  title: {
    color: colors.white,
    fontSize: 20
  },
  name: {
    fontSize: 24,
    fontWeight: '700'
  },
  empresaMenu: {
    marginTop: 40,
    alignItems: 'center'
  },
  btn: {
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
  btnText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600'
  },
  card: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 3
  },
  companyName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: colors.textSecondary
  },
  logout: {
    alignSelf: 'center',
    marginVertical: 20
  },
  logoutText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600'
  }
});
