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

export default function CompanyDetails({ route, navigation }) {
  const { companyId, companyName } = route.params;
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Lee servicios desde empresas/{companyId}/servicios
        const snap = await getDocs(collection(db, 'empresas', companyId, 'servicios'));
        setServices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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
        ListEmptyComponent={<Text style={styles.emptyText}>No hay servicios.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate('ServiceDetails', {
                companyId,
                serviceId: item.id,
                serviceName: item.serviceName,
                availability: item.availability
              })
            }
          >
            <Text style={styles.serviceName}>{item.serviceName}</Text>
            <Text style={styles.price}>€ {item.price}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex:1, justifyContent:'center', alignItems:'center', backgroundColor: colors.background },
  container: { flex:1, backgroundColor: colors.background, padding:20 },
  header: { ...typography.h1, textAlign:'center', marginBottom:20, color: colors.textPrimary },
  emptyText: { ...typography.body, textAlign:'center', color: colors.textPrimary, marginTop:40 },
  card: {
    backgroundColor:colors.white, padding:16, borderRadius:8,
    marginBottom:12, borderWidth:1, borderColor:colors.primary
  },
  serviceName: { ...typography.h2, color: colors.textPrimary },
  price: { ...typography.body, color: colors.textPrimary, marginTop:4 }
});
