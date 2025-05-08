import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { doc, getDoc, getDocs, collection, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import colors from '../theme/colors';
import typography from '../theme/typography';

// Días en español según tu Firestore
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

  // 1) Cargo el schedule de la empresa
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

  // 2) Genero los próximos 7 días
  useEffect(() => {
    const today = new Date();
    const arr = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push(d);
    }
    setDays(arr);
  }, []);

  // 3) Genero franjas de 15' al cambiar día o schedule
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

    // calcular reservas ya existentes
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

      // generar franjas
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

  // seleccionar bloque contiguo de duración
  const onSelect = idx => {
    const needed = Math.ceil(duration / 15);
    const block = slots.slice(idx, idx + needed);
    if (block.length < needed || block.some(s => s.occupied)) return;
    setSelectedSlots(block.map(s => s.time));
  };

  // confirmar reserva
  const confirmBooking = async () => {
    if (selectedSlots.length === 0) return;
    const bookingRef = doc(collection(db, 'business', companyId, 'bookings'));
    const bookingId = bookingRef.id;
    const start = selectedSlots[0];
    const hh = String(Math.floor(start/60)).padStart(2,'0');
    const mm = String(start%60).padStart(2,'0');
    const dateISO = `${days[selectedDayIdx].toISOString().slice(0,10)}T${hh}:${mm}`;

    try {
      // guardar en business
      await setDoc(bookingRef, {
        userId,
        serviceId,
        serviceName,
        price,
        duration,
        date: dateISO,
        createdAt: new Date().toISOString()
      });
      // guardar en users
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
      navigation.goBack();
    } catch (e) {
      console.error('Booking error:', e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{serviceName}</Text>
      <Text style={styles.subtitle}>{duration} min • € {price}</Text>

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
              style={[
                styles.dayItem,
                { width: dayWidth },
                sel && styles.daySelected,
                !openInfo && styles.dayClosed
              ]}
              disabled={!openInfo}
              onPress={() => setSelectedDayIdx(index)}
            >
              <Text style={[styles.dayName, sel && styles.dayNameSel]}>{dn}</Text>
              <Text style={[styles.dayNum, sel && styles.dayNumSel]}>{item.getDate()}</Text>
            </TouchableOpacity>
          );
        }}
      />

      <FlatList
        data={slots}
        horizontal
        keyExtractor={s => s.time.toString()}
        showsHorizontalScrollIndicator={false}
        style={styles.slotsList}
        renderItem={({ item, index }) => {
          const sel = selectedSlots.includes(item.time);
          return (
            <TouchableOpacity
              style={[
                styles.slotItem,
                item.occupied && styles.slotOccupied,
                sel && styles.slotSelected
              ]}
              disabled={item.occupied}
              onPress={() => onSelect(index)}
            >
              <Text style={[styles.slotText, sel && styles.slotTextSel]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {selectedSlots.length > 0 && (
        <TouchableOpacity style={styles.bookBtn} onPress={confirmBooking}>
          <Text style={styles.bookBtnText}>Reservar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex:1, backgroundColor:colors.background, padding:16 },
  center:        { flex:1,justifyContent:'center',alignItems:'center' },
  title:         { ...typography.h2, textAlign:'center' },
  subtitle:      { ...typography.body, textAlign:'center', marginBottom:12 },
  daysList:      { marginVertical:8 },
  dayItem:       {
                  alignItems:'center', padding:8, marginHorizontal:4,
                  borderRadius:8, backgroundColor:colors.white,
                  borderWidth:1, borderColor:colors.primary
                },
  daySelected:   { backgroundColor:colors.primary },
  dayClosed:     { opacity:0.4 },
  dayName:       { ...typography.body, color:colors.textPrimary },
  dayNameSel:    { color:colors.buttonText },
  dayNum:        { ...typography.h2, marginTop:4 },
  dayNumSel:     { color:colors.buttonText },
  slotsList:     { marginVertical:16 },
  slotItem:      {
                  padding:10, marginHorizontal:4, borderRadius:8,
                  borderWidth:1, borderColor:colors.primary,
                  backgroundColor:colors.white
                },
  slotOccupied:  { backgroundColor:'#f0f0f0', borderColor:'#ccc' },
  slotSelected:  { backgroundColor:colors.primary },
  slotText:      { ...typography.body, color:colors.textPrimary },
  slotTextSel:   { color:colors.buttonText },
  bookBtn:       {
                  backgroundColor:colors.primary, padding:14,
                  borderRadius:25, alignItems:'center', marginTop:20
                },
  bookBtnText:   { ...typography.body, color:colors.buttonText }
});
