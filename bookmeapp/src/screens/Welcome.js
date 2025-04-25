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
 * - Para modo 'empresa': muestra menú de gestión de eventos.
 *
 * Props recibidas vía React Navigation:
 *  - route.params.mode → 'usuario' | 'empresa'
 *  - navigation       → objeto de navegación
 */
export default function Welcome({ route, navigation }) {
  const { mode } = route.params;  
  const [userData, setUserData] = useState({ name: '', photoURL: null }); // Datos de perfil
  const [companies, setCompanies] = useState([]);                          // Listado de empresas
  const [loading, setLoading] = useState(mode === 'usuario');              // Carga de empresas

  // useEffect: al montar, cargamos datos de perfil y, si es usuario, la lista de empresas
  useEffect(() => {
    (async () => {
      const uid = auth.currentUser.uid;
      const col = mode === 'empresa' ? 'empresas' : 'users';
      // 1) Leer datos de perfil desde Firestore
      const snap = await getDoc(doc(db, col, uid));
      if (snap.exists()) {
        const d = snap.data();
        setUserData({
          name: d.name || '',
          photoURL: d.photoURL || null
        });
      }
      // 2) Si es usuario, cargar el catálogo de empresas
      if (mode === 'usuario') {
        setLoading(true);
        const snap2 = await getDocs(collection(db, 'empresas'));
        setCompanies(
          snap2.docs.map(d => ({ id: d.id, name: d.data().name }))
        );
        setLoading(false);
      }
    })();
  }, []);

  /**
   * handleLogout: cierra la sesión de Firebase Auth
   * y reinicia la pila de navegación a 'Login'.
   */
  const handleLogout = async () => {
    await signOut(auth);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }]
    });
  };

  return (
    <View style={styles.container}>
      {/* Barra de estado con fondo primario */}
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Encabezado: avatar, saludo y acceso a reservas (solo usuario) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Profile', { mode })}>
          {userData.photoURL ? (
            // Si el usuario tiene foto, mostrarla
            <Image source={{ uri: userData.photoURL }} style={styles.avatar} />
          ) : (
            // Si no, icono genérico
            <Ionicons name="person-circle" size={36} color={colors.white} />
          )}
        </TouchableOpacity>
        <Text style={styles.title}>
          Bienvenido{' '}
          <Text style={styles.name}>{userData.name}</Text>
        </Text>
        {mode === 'usuario' && (
          // Icono para ir a "Mis Reservas"
          <TouchableOpacity onPress={() => navigation.navigate('MyReservations')}>
            <Ionicons name="calendar-outline" size={28} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>

      {mode === 'empresa' ? (
        // Menú de empresa: botones para CRUD de eventos
        <View style={styles.empresaMenu}>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.navigate('AddEvent')}
          >
            <Text style={styles.btnText}>Añadir Evento</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn}>
            <Text style={styles.btnText}>Modificar Evento</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btn}>
            <Text style={styles.btnText}>Eliminar Evento</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        // Spinner mientras cargan empresas
        <ActivityIndicator
          style={{ marginTop: 40 }}
          size="large"
          color={colors.primary}
        />
      ) : companies.length === 0 ? (
        // Mensaje si no hay empresas
        <Text style={styles.emptyText}>No hay empresas disponibles.</Text>
      ) : (
        // Listado de empresas en FlatList
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

      {/* Botón de cerrar sesión */}
      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

// Estilos del componente
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  // Header con fondo primario y elementos distribuidos en fila
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
  // Menú de opciones para empresa
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
  // Tarjeta de empresa en listado
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
