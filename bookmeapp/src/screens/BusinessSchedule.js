// src/screens/BusinessSchedule.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import { auth, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import colors from '../theme/colors';
import typography from '../theme/typography';

export default function BusinessSchedule() {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const uid = auth.currentUser.uid;
        const ref = doc(db, 'business', uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setSchedule(snap.data().schedule);
        }
      } catch (e) {
        console.error('Error cargando horario:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const generateSlots = (open, close) => {
    const [openH, openM] = open.split(':').map(Number);
    const [closeH, closeM] = close.split(':').map(Number);
    const slots = [];
    let current = openH * 60 + openM;
    const end = closeH * 60 + closeM;
    while (current + 15 <= end) {
      const h = Math.floor(current / 60);
      const m = current % 60;
      const from = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      const next = current + 15;
      const h2 = Math.floor(next / 60);
      const m2 = next % 60;
      const to = `${String(h2).padStart(2, '0')}:${String(m2).padStart(2, '0')}`;
      slots.push(`${from} - ${to}`);
      current = next;
    }
    return slots;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!schedule) {
    return (
      <View style={styles.center}><Text>No hay horario disponible.</Text></View>
    );
  }

  const sections = Object.entries(schedule).map(([day, info]) => {
    if (info.closed) return null;
    return {
      title: day,
      data: generateSlots(info.open, info.close)
    };
  }).filter(Boolean);

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item, idx) => item + idx}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.dayHeader}>{title}</Text>
        )}
        renderItem={({ item }) => (
          <Text style={styles.slotText}>{item}</Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  dayHeader: {
    ...typography.h2,
    color: colors.primary,
    marginTop: 16,
    marginBottom: 8
  },
  slotText: {
    ...typography.body,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: colors.primary
  }
});