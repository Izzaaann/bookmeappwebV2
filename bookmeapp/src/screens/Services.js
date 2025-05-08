import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { auth, db } from '../firebase/config';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import colors from '../theme/colors';
import typography from '../theme/typography';
import { Ionicons } from '@expo/vector-icons';

export default function Services({ navigation }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const uid = auth.currentUser.uid;

  const fetchServices = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'business', uid, 'services'));
      setServices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error('Error cargando servicios:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchServices);
    return unsubscribe;
  }, [navigation]);

  const handleDelete = async id => {
    await deleteDoc(doc(db, 'business', uid, 'services', id));
    fetchServices();
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
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => navigation.navigate('ServiceForm')}
      >
        <Ionicons name="add-circle-outline" size={24} color={colors.white} />
        <Text style={styles.addText}>Nuevo Servicio</Text>
      </TouchableOpacity>

      {services.length === 0 ? (
        <Text style={styles.emptyText}>No hay servicios.</Text>
      ) : (
        <FlatList
          data={services}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.bannerurl ? (
                <Image source={{ uri: item.bannerurl }} style={styles.banner} />
              ) : (
                <View style={[styles.banner, styles.bannerPlaceholder]}>
                  <Text style={styles.placeholderText}>Sin banner</Text>
                </View>
              )}
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.price}>€ {item.price} · {item.duration} min</Text>
                <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('ServiceForm', { service: item })}
                  >
                    <Ionicons name="pencil" size={24} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash" size={24} color="red" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex:1, backgroundColor: colors.background },
  center:       { flex:1, justifyContent:'center', alignItems:'center' },
  addBtn:       { flexDirection:'row', alignItems:'center', backgroundColor:colors.primary, margin:16, padding:12, borderRadius:25 },
  addText:      { color:colors.white, marginLeft:8, ...typography.body },
  emptyText:    { textAlign:'center', marginTop:40, color:colors.textSecondary },
  card:         { backgroundColor:colors.white, borderRadius:8, marginBottom:16, overflow:'hidden', elevation:2 },
  banner:       { width:'100%', height:120 },
  bannerPlaceholder: { justifyContent:'center', alignItems:'center', backgroundColor:'#eee' },
  placeholderText:   { color:colors.textSecondary },
  info:         { padding:12 },
  name:         { ...typography.h2, color:colors.textPrimary },
  price:        { ...typography.body, color:colors.textPrimary, marginVertical:4 },
  desc:         { ...typography.body, color:colors.textSecondary },
  actions:      { flexDirection:'row', justifyContent:'flex-end', marginTop:8 }
});
