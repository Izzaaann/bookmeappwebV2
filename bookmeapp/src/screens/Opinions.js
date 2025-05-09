import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Image
} from 'react-native';
import { auth, db } from '../firebase/config';
import { collection, getDocs, addDoc, getDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import colors from '../theme/colors';
import typography from '../theme/typography';
import { Ionicons } from '@expo/vector-icons';

export default function OpinionsScreen({ route }) {
  const { companyId, companyName } = route.params;
  const user = auth.currentUser;
  const userId = user.uid;

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [userData, setUserData] = useState(null);
  const [existingReviewId, setExistingReviewId] = useState(null);

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, 'users', userId));
      if (snap.exists()) {
        setUserData(snap.data());
      }
    })();
  }, [userId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'business', companyId, 'reviews'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setReviews(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

      const existing = data.find(r => r.userId === userId);
      if (existing) {
        setStars(existing.stars);
        setComment(existing.comment);
        setExistingReviewId(existing.id);
      }
    } catch (e) {
      console.error('Error loading reviews', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [companyId]);

  const submitReview = async () => {
    if (stars < 1 || !comment.trim()) return;
    try {
      if (existingReviewId) {
        await updateDoc(doc(db, 'business', companyId, 'reviews', existingReviewId), {
          stars,
          comment: comment.trim(),
          updatedAt: new Date().toISOString()
        });
      } else {
        const ref = await addDoc(collection(db, 'business', companyId, 'reviews'), {
          userId,
          stars,
          comment: comment.trim(),
          userName: userData?.name || user.displayName || 'Usuario',
          userPhoto: userData?.photoURL || user.photoURL || null,
          createdAt: new Date().toISOString()
        });
        setExistingReviewId(ref.id);
      }
      fetchReviews();
    } catch (e) {
      console.error('Error submitting review', e);
    }
  };

  return (
    <FlatList
      data={reviews}
      keyExtractor={item => item.id}
      ListHeaderComponent={
        <View>
          <Text style={styles.header}>Opiniones de {companyName}</Text>

          <View style={styles.form}>
            <Text style={styles.label}>{existingReviewId ? 'Editar tu reseña' : 'Tu valoración'}</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map(n => (
                <TouchableOpacity key={n} onPress={() => setStars(n)}>
                  <Ionicons
                    name={n <= stars ? 'star' : 'star-outline'}
                    size={32}
                    color="#FFD700"
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Comentario"
              value={comment}
              onChangeText={setComment}
            />
            <TouchableOpacity style={styles.submit} onPress={submitReview}>
              <Text style={styles.submitText}>{existingReviewId ? 'Actualizar' : 'Enviar'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.section}>Todas las opiniones</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          {item.userPhoto ? (
            <Image source={{ uri: item.userPhoto }} style={styles.avatar} />
          ) : (
            <Ionicons name="person-circle" size={40} color={colors.primary} />
          )}
          <View style={styles.info}>
            <Text style={styles.user}>{item.userName}</Text>
            <Text style={styles.stars}>
              {'★'.repeat(item.stars)}{'☆'.repeat(5 - item.stars)}
            </Text>
            <Text style={styles.text}>{item.comment}</Text>
          </View>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>Sin opiniones aún.</Text>}
      contentContainerStyle={{ padding: 16 }}
    />
  );
}

const styles = StyleSheet.create({
  header:       { ...typography.h1, textAlign: 'center', marginBottom: 12 },
  form:         { backgroundColor: colors.white, padding: 16, borderRadius: 8, marginBottom: 16 },
  label:        { ...typography.body, marginBottom: 8 },
  starRow:      { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  input:        { backgroundColor: '#f9f9f9', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#ccc', marginBottom: 12 },
  submit:       { backgroundColor: colors.primary, padding: 10, borderRadius: 25, alignItems: 'center' },
  submitText:   { ...typography.body, color: colors.buttonText },
  section:      { ...typography.h2, marginBottom: 8 },
  card:         { flexDirection: 'row', backgroundColor: colors.white, padding: 12, borderRadius: 8, marginBottom: 12, elevation: 1 },
  avatar:       { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  info:         { flex: 1 },
  user:         { ...typography.body, fontWeight: '600' },
  stars:        { ...typography.body, color: '#FFD700', marginVertical: 4 },
  text:         { ...typography.body },
  empty:        { ...typography.body, textAlign: 'center', color: colors.textSecondary, marginTop: 20 }
});
