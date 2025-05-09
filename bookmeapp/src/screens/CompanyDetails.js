import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import colors from '../theme/colors';
import typography from '../theme/typography';

export default function CompanyDetails({ route, navigation }) {
  const { companyId, companyName } = route.params;
  const [services, setServices]   = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(
          collection(db, 'business', companyId, 'services')
        );
        setServices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
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
    <ScrollView style={styles.container}>
      <Text style={styles.header}>{companyName}</Text>

      {services.length === 0 ? (
        <Text style={styles.empty}>No hay servicios disponibles.</Text>
      ) : (
        services.map(s => (
          <TouchableOpacity
            key={s.id}
            style={styles.card}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate('Booking', {
                companyId,
                serviceId: s.id,
                serviceName: s.name,
                price: s.price,
                duration: s.duration
              })
            }
          >
            <View style={styles.info}>
              <Text style={styles.name}>{s.name}</Text>
              {s.description ? (
                <Text style={styles.desc} numberOfLines={2}>
                  {s.description}
                </Text>
              ) : null}
            </View>
            <View style={styles.priceBox}>
              <Text style={styles.priceText}>€ {s.price.toFixed(2)}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background
  },
  header: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: 20,
    color: colors.textPrimary
  },
  empty: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 40
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2
  },
  info: {
    flex: 1,
    padding: 16
  },
  name: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: 4
  },
  desc: {
    ...typography.body,
    color: colors.textSecondary
  },
  priceBox: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12
  },
  priceText: {
    ...typography.body,
    color: colors.buttonText,
    fontWeight: '600'
  }
});
