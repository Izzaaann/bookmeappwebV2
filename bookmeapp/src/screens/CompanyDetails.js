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
 * Lista de servicios de una empresa, mostrando nombre, descripción,
 * duración y precio.
 *
 * Props recibidas vía React Navigation:
 *  - route.params.companyId   → ID de la empresa en Firestore.
 *  - route.params.companyName → Nombre de la empresa (cabecera).
 *  - navigation               → Objeto de navegación.
 */
export default function CompanyDetails({ route, navigation }) {
  const { companyId, companyName } = route.params;

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(
          collection(db, 'business', companyId, 'services')
        );
        setServices(
          snap.docs.map(d => ({
            id: d.id,
            name: d.data().name,
            description: d.data().description || '',
            price: d.data().price,
            duration: d.data().duration
          }))
        );
      } catch (e) {
        console.error('Error cargando servicios:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [companyId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{companyName}</Text>

      <FlatList
        data={services}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay servicios.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate('Booking', {
                companyId,
                serviceId: item.id,
                serviceName: item.name,
                price: item.price,
                duration: item.duration
              })
            }
          >
            <Text style={styles.serviceName}>{item.name}</Text>
            {item.description ? (
              <Text style={styles.description}>{item.description}</Text>
            ) : null}
            <View style={styles.row}>
              <View style={styles.durationBox}>
                <Text style={styles.durationText}>{item.duration} min</Text>
              </View>
              <View style={styles.priceBox}>
                <Text style={styles.priceText}>€ {item.price}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

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
    color: colors.textPrimary,
    marginBottom: 4
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: 12
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  durationBox: {
    flex: 1,
    backgroundColor: colors.background,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginRight: 8
  },
  durationText: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600'
  },
  priceBox: {
    width: 80,
    backgroundColor: colors.primary,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center'
  },
  priceText: {
    ...typography.body,
    color: colors.buttonText,
    fontWeight: '600'
  }
});
