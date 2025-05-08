// src/screens/ServiceDetails.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { auth, db } from '../firebase/config';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  arrayRemove,
  getDocs
} from 'firebase/firestore';
import colors from '../theme/colors';
import typography from '../theme/typography';

export default function ServiceDetails({ route, navigation }) {
  const {
    companyId,
    serviceId,
    serviceName,
    price,
    availability,
    duration
  } = route.params;

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(
        collection(db, 'business', companyId, 'services', serviceId, 'reviews')
      );
      setReviews(snap.docs.map(d => d.data()));
    })();
  }, []);

  const handleViewBooking = () => {
    navigation.navigate('Booking', {
      companyId,
      serviceId,
      serviceName,
      price,
      duration
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{serviceName}</Text>
      <Text style={styles.price}>€ {price}</Text>
      <Text style={styles.subheader}>Horas disponibles</Text>
      <FlatList
        data={availability}
        keyExtractor={(_, i) => i.toString()}
        numColumns={3}
        renderItem={({ item }) => {
          const isSelected = selectedSlot === item;
          return (
            <TouchableOpacity
              style={[styles.slotSquare, isSelected && styles.slotSelected]}
              onPress={() => setSelectedSlot(item)}
            >
              <Text style={[styles.slotText, isSelected && styles.textSelected]}>
                {item.date}
              </Text>
              <Text style={[styles.slotText, isSelected && styles.textSelected]}>
                {item.from}–{item.to}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
      <TouchableOpacity
        style={[styles.reserveBtn, !selectedSlot && styles.btnDisabled]}
        disabled={!selectedSlot}
        onPress={handleViewBooking}
      >
        <Text style={styles.reserveText}>Seleccionar Horario</Text>
      </TouchableOpacity>

      <Text style={styles.reviewHeader}>Valoraciones</Text>
      {reviews.length === 0 ? (
        <Text style={styles.noReviews}>Aún no hay valoraciones.</Text>
      ) : (
        reviews.map((r, i) => (
          <View key={i} style={styles.reviewCard}>
            <Text style={styles.reviewStars}>
              {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
            </Text>
            {r.comment ? (
              <Text style={styles.reviewComment}>{r.comment}</Text>
            ) : null}
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex:1, backgroundColor:colors.background, padding:20 },
  header:          { ...typography.h1, textAlign:'center', marginBottom:4 },
  price:           { ...typography.body, textAlign:'center', marginBottom:12 },
  subheader:       { ...typography.h2, marginBottom:8 },
  slotSquare:      {
                     flex:1,
                     aspectRatio:1,
                     margin:4,
                     backgroundColor:colors.white,
                     borderRadius:8,
                     borderWidth:1,
                     borderColor:colors.primary,
                     justifyContent:'center',
                     alignItems:'center'
                   },
  slotSelected:    { backgroundColor:colors.primary },
  slotText:        { ...typography.body, textAlign:'center', color:colors.textPrimary },
  textSelected:    { color:colors.white },
  reserveBtn:      {
                     marginTop:20,
                     backgroundColor:colors.primary,
                     padding:14,
                     borderRadius:25,
                     alignItems:'center'
                   },
  btnDisabled:     { opacity:0.5 },
  reserveText:     { ...typography.body, color:colors.buttonText, fontWeight:'600' },

  reviewHeader:    { ...typography.h2, marginTop:20 },
  noReviews:       { ...typography.body, color:colors.textSecondary, marginTop:8 },
  reviewCard:      { marginTop:12, backgroundColor:colors.white, padding:12, borderRadius:8 },
  reviewStars:     { fontSize:18, color:'#f5a623' },
  reviewComment:   { ...typography.body, marginTop:4 }
});
