// src/screens/CompanyDetails.js

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import colors from '../theme/colors';
import typography from '../theme/typography';

/**
 * Componente que muestra la lista de servicios de una empresa.
 *
 * Props recibidas vía React Navigation:
 *  - route.params.companyId   → ID de la empresa en Firestore.
 *  - route.params.companyName → Nombre de la empresa (para la cabecera).
 *  - navigation               → Objeto de navegación para pasar a ServiceDetails.
 */
export default function CompanyDetails({ route, navigation }) {
  // Extraemos companyId y companyName de los parámetros de la ruta
  const { companyId, companyName } = route.params;

  // Estado local para los servicios y control de carga
  const [services, setServices] = useState([]);      // Array de servicios
  const [loading, setLoading] = useState(true);      // Indica si aún carga datos

  // useEffect que se dispara al montar el componente o al cambiar companyId
  useEffect(() => {
    (async () => {
      try {
        // 1) Creamos la referencia a la colección 'empresas/{companyId}/servicios'
        // 2) Obtenemos todos los documentos (getDocs)
        const snap = await getDocs(
          collection(db, 'empresas', companyId, 'servicios')
        );
        // 3) Mapear cada documento a un objeto con id + data
        setServices(
          snap.docs.map(d => ({
            id: d.id,
            ...d.data()
          }))
        );
      } catch (e) {
        // En caso de error, lo mostramos por consola
        console.error('Error cargando servicios:', e);
      } finally {
        // Siempre desactivamos el indicador de carga
        setLoading(false);
      }
    })();
  }, [companyId]);

  // Mientras loading sea true, mostramos un spinner de carga
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Una vez cargados los servicios...
  return (
    <View style={styles.container}>
      {/* Cabecera con el nombre de la empresa */}
      <Text style={styles.header}>{companyName}</Text>

      {/* FlatList para renderizar cada servicio como tarjeta */}
      <FlatList
        data={services}
        keyExtractor={item => item.id}
        // Si no hay servicios, mostramos un texto indicándolo
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay servicios.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              // Al pulsar, navegamos a la pantalla ServiceDetails
              navigation.navigate('ServiceDetails', {
                companyId,
                serviceId: item.id,
                serviceName: item.serviceName,
                price: item.price,
                availability: item.availability
              })
            }
          >
            {/* Nombre y precio del servicio */}
            <Text style={styles.serviceName}>{item.serviceName}</Text>
            <Text style={styles.price}>€ {item.price}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// Estilos con StyleSheet de React Native
const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20
  },
  header: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: 20,
    color: colors.textPrimary
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    marginTop: 40,
    color: colors.textPrimary
  },
  card: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.primary
  },
  serviceName: {
    ...typography.h2,
    color: colors.textPrimary
  },
  price: {
    ...typography.body,
    color: colors.textPrimary,
    marginTop: 4
  }
});
