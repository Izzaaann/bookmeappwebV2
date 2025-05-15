import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Alert
} from 'react-native';
import { doc, getDoc, getDocs, collection, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import colors from '../theme/colors';
import typography from '../theme/typography';

const WEEK_DAYS = ['Domingo','Lunes','Martes','Mié.','Jue.','Vie.','Sáb.'];

export default function BookingScreen({ route, navigation }) {
  const { companyId, serviceId, serviceName, price, duration } = route.params;
  const userId = auth.currentUser.uid;

  const [schedule, setSchedule]     = useState(null);
  const [loading, setLoading]       = useState(true);
  const [days, setDays]             = useState([]);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [slots, setSlots]           = useState([]);
  const [selectedSlots, setSelectedSlots]   = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'business', companyId));
        if (snap.exists()) setSchedule(snap.data().schedule);
      } catch (e) {
        console.error('Error loading schedule:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [companyId]);

  useEffect(() => {
    const today = new Date();
    const arr = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push(d);
    }
    setDays(arr);
  }, []);

  useEffect(() => {
    if (!schedule || days.length === 0) return;
    const date = days[selectedDayIdx];
    const dayName = WEEK_DAYS[date.getDay()];
    const info = schedule[dayName];
    if (!info || info.closed) {
      setSlots([]);
      setSelectedSlots([]);
      return;
    }

    (async () => {
      const iso = date.toISOString().slice(0,10);
      const snapBookings = await getDocs(collection(db, 'business', companyId, 'bookings'));
      const busy = [];
      snapBookings.docs.forEach(d => {
        const b = d.data();
        if (b.serviceId === serviceId && b.date.slice(0,10) === iso) {
          const start = parseInt(b.date.slice(11,13),10)*60 + parseInt(b.date.slice(14,16),10);
          const count = Math.ceil(b.duration/15);
          for (let i=0;i<count;i++) busy.push(start + i*15);
        }
      });

      const [oh, om] = info.open.split(':').map(Number);
      const [ch, cm] = info.close.split(':').map(Number);
      let t = oh*60 + om, end = ch*60 + cm;
      const arr = [];
      while (t + 15 <= end) {
        const hh = String(Math.floor(t/60)).padStart(2,'0');
        const mm = String(t%60).padStart(2,'0');
        arr.push({
          label: `${hh}:${mm}`,
          time: t,
          occupied: busy.includes(t)
        });
        t += 15;
      }
      setSlots(arr);
      setSelectedSlots([]);
    })();
  }, [schedule, days, selectedDayIdx]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width;
  const dayWidth = screenWidth / 5;

  const onSelect = idx => {
    const needed = Math.ceil(duration / 15);
    const block = slots.slice(idx, idx + needed);
    if (block.length < needed || block.some(s => s.occupied)) return;
    setSelectedSlots(block.map(s => s.time));
  };

  const confirmBooking = async () => {
    if (selectedSlots.length === 0) return;
    const bookingRef = doc(collection(db, 'business', companyId, 'bookings'));
    const bookingId = bookingRef.id;
    const start = selectedSlots[0];
    const hh = String(Math.floor(start/60)).padStart(2,'0');
    const mm = String(start%60).padStart(2,'0');
    const dateISO = `${days[selectedDayIdx].toISOString().slice(0,10)}T${hh}:${mm}`;

    try {
      await setDoc(bookingRef, {
        userId,
        serviceId,
        serviceName,
        price,
        duration,
        date: dateISO,
        createdAt: new Date().toISOString()
      });
      await setDoc(doc(db, 'users', userId, 'reservations', bookingId), {
        companyId,
        serviceId,
        serviceName,
        price,
        duration,
        slot: {
          date: dateISO.slice(0,10),
          from: dateISO.slice(11,16),
          to: (() => {
            const endMin = start + duration;
            return `${String(Math.floor(endMin/60)).padStart(2,'0')}:${String(endMin%60).padStart(2,'0')}`;
          })()
        },
        createdAt: new Date().toISOString()
      });
      Alert.alert('Reserva confirmada', 'Tu reserva ha sido registrada correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      console.error('Booking error:', e);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>{serviceName}</Text>
        <Text style={styles.headerSubtitle}>{duration} minutos • {price} €</Text>
      </View>

      <FlatList
        data={days}
        horizontal
        keyExtractor={d => d.toDateString()}
        showsHorizontalScrollIndicator={false}
        style={styles.daysList}
        renderItem={({ item, index }) => {
          const sel = index === selectedDayIdx;
          const dn = WEEK_DAYS[item.getDay()];
          const openInfo = schedule[dn] && !schedule[dn].closed;
          return (
            <TouchableOpacity
              style={[styles.dayItem, sel && styles.daySelected, !openInfo && styles.dayClosed]}
              disabled={!openInfo}
              onPress={() => setSelectedDayIdx(index)}
            >
              <Text style={[styles.dayName, sel && styles.dayNameSel]}>{dn.slice(0,3)}</Text>
              <Text style={[styles.dayNum, sel && styles.dayNumSel]}>{item.getDate()}</Text>
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.divider} />

      <FlatList
        data={slots}
        horizontal
        keyExtractor={s => s.time.toString()}
        showsHorizontalScrollIndicator={false}
        style={styles.slotsList}
        renderItem={({ item, index }) => {
          const isInSelectedRange = selectedSlots.includes(item.time);
          return (
            <TouchableOpacity
              style={[styles.slotItem, item.occupied && styles.slotOccupied, isInSelectedRange && styles.slotSelected]}
              disabled={item.occupied}
              onPress={() => onSelect(index)}
            >
              <Text style={[styles.slotText, isInSelectedRange && styles.slotTextSel, item.occupied && styles.slotTextOccupied]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {selectedSlots.length > 0 && (
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.serviceName}>{serviceName}</Text>
            <Text style={styles.serviceDetail}>
              {slots.find(s => s.time === selectedSlots[0])?.label} – {
                (() => {
                  const end = selectedSlots[0] + duration;
                  return `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`;
                })()
              }
            </Text>
            <Text style={styles.serviceDetail}>Empleado: Cualquiera</Text>
          </View>
          <TouchableOpacity style={styles.changeBtn} onPress={confirmBooking}>
            <Text style={styles.changeText}>Confirmar reserva</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:     { flex:1, backgroundColor:colors.background, padding:16 },
  center:        { flex:1, justifyContent:'center', alignItems:'center' },
  headerBox:     {
    backgroundColor: colors.primary,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 6
  },
  headerTitle:   { ...typography.h1, color: colors.buttonText, textAlign: 'center' },
  headerSubtitle:{ ...typography.body, color: colors.buttonText, textAlign: 'center', marginTop: 4 },
  daysList:      { marginVertical:8 },
  dayItem:       {
    alignItems:'center', padding:10, marginHorizontal:4,
    borderRadius:12, backgroundColor:colors.white,
    borderWidth:2, borderColor:colors.primary,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 4
  },
  daySelected:   { backgroundColor: colors.primary },
  dayClosed:     { opacity: 0.3 },
  dayName:       { ...typography.body, color: colors.textPrimary },
  dayNameSel:    { color: colors.buttonText },
  dayNum:        { ...typography.h2, marginTop: 4 },
  dayNumSel:     { color: colors.buttonText },
  divider:       { height: 1, backgroundColor: '#ccc', marginVertical: 12 },
  slotsList:     { marginVertical: 8 },
  slotItem:      {
    paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25,
    backgroundColor: '#e6f0ff', marginHorizontal: 4
  },
  slotOccupied:  { backgroundColor: '#f2f2f2', borderWidth: 1, borderColor: '#ccc' },
  slotSelected:  { backgroundColor: colors.primary },
  slotText:      { ...typography.body },
  slotTextSel:   { color: colors.buttonText },
  slotTextOccupied: { color: '#999' },
  summaryCard: {
    backgroundColor: colors.white, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: colors.primary, marginTop: 20
  },
  serviceName: { ...typography.h2, marginBottom: 4 },
  serviceDetail: { ...typography.body },
  changeBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 16
  },
  changeText: { ...typography.body, color: colors.buttonText }
});