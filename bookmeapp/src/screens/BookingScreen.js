// src/screens/BookingScreen.js

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
import { doc, getDoc, collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import colors from '../theme/colors';
import typography from '../theme/typography';

// Días en español que coinciden con tus claves en Firestore
const WEEK_DAYS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado'
];

export default function BookingScreen({ navigation, route }) {
  const { companyId, serviceName, price, duration } = route.params;

  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState([]);
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [slots, setSlots] = useState([]);
  const [reservedSlots, setReservedSlots] = useState(new Set());
  const [selectedSlot, setSelectedSlot] = useState(null);

  // 1) Cargar schedule y bookings
  useEffect(() => {
    (async () => {
      try {
        // schedule
        const bizSnap = await getDoc(doc(db, 'business', companyId));
        if (bizSnap.exists()) setSchedule(bizSnap.data().schedule);

        // bookings
        const resSnap = await getDocs(collection(db, 'business', companyId, 'bookings'));
        const reserved = new Set();
        resSnap.docs.forEach(d => {
          const { date, duration: dur } = d.data();
          // date formato ISO "YYYY-MM-DDTHH:mm"
          const timePart = date.slice(11,16);
          const [h, m] = timePart.split(':').map(Number);
          let minutes = h * 60 + m;
          const count = Math.ceil(dur / 15);
          for (let i = 0; i < count; i++) {
            const hh = Math.floor(minutes / 60);
            const mm = minutes % 60;
            const label = `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
            reserved.add(label);
            minutes += 15;
          }
        });
        setReservedSlots(reserved);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [companyId]);

  // 2) Próximos 7 días
  useEffect(() => {
    const today = new Date(), arr = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      arr.push(d);
    }
    setDays(arr);
  }, []);

  // 3) Franjas cada 15m para día seleccionado
  useEffect(() => {
    if (!schedule || days.length === 0) return;
    const date = days[selectedDayIdx];
    const info = schedule[ WEEK_DAYS[date.getDay()] ];
    if (!info || info.closed) {
      setSlots([]);
      return;
    }
    const [oh, om] = info.open.split(':').map(Number);
    const [ch, cm] = info.close.split(':').map(Number);
    let cur = oh * 60 + om;
    const end = ch * 60 + cm;
    const arr = [];
    while (cur < end) {
      const hh = Math.floor(cur / 60), mm = cur % 60;
      arr.push(`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`);
      cur += 15;
    }
    setSlots(arr);
    setSelectedSlot(null);
  }, [schedule, days, selectedDayIdx]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Check si desde índice hay espacio para duration
  const canStartAt = index => {
    const needed = Math.ceil(duration / 15);
    if (index + needed > slots.length) return false;
    for (let i = 0; i < needed; i++) {
      if (reservedSlots.has(slots[index + i])) return false;
    }
    return true;
  };

  const onSelect = index => {
    if (!canStartAt(index)) return;
    setSelectedSlot(slots[index]);
  };

  const handleReserve = async () => {
    const datePart = days[selectedDayIdx].toISOString().slice(0,10);
    const iso = `${datePart}T${selectedSlot}`;
    await addDoc(collection(db, 'business', companyId, 'bookings'), {
      date: iso,
      serviceName,
      price,
      duration,
      status: 'pendiente',
      createdAt: new Date()
    });
    navigation.navigate('MyReservations');
  };

  const screenW = Dimensions.get('window').width;
  const dayW = screenW / 4;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{serviceName}</Text>
      <Text style={styles.subtitle}>{duration} min • € {price}</Text>

      <FlatList
        data={days}
        horizontal
        keyExtractor={d => d.toDateString()}
        showsHorizontalScrollIndicator={false}
        style={styles.dayList}
        renderItem={({ item, index }) => {
          const sel = index === selectedDayIdx;
          const name = WEEK_DAYS[item.getDay()];
          const num = item.getDate();
          const info = schedule?.[name];
          const open = info && !info.closed;
          return (
            <TouchableOpacity
              style={[styles.dayItem, { width: dayW }, sel && styles.dayItemSel]}
              onPress={() => open && setSelectedDayIdx(index)}
              disabled={!open}
            >
              <Text style={[styles.dayName, sel ? styles.dayNameSel : open ? null : styles.dayNameClosed]}>
                {name}
              </Text>
              <Text style={[styles.dayNum, sel ? styles.dayNumSel : open ? null : styles.dayNameClosed]}>
                {num}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <FlatList
        data={slots}
        horizontal
        keyExtractor={s => s}
        showsHorizontalScrollIndicator={false}
        style={styles.slotList}
        renderItem={({ item, index }) => {
          const isReserved = reservedSlots.has(item);
          const available = canStartAt(index);
          const sel = item === selectedSlot;
          return (
            <TouchableOpacity
              style={[
                styles.slotItem,
                isReserved && styles.slotItemReserved,
                !available && styles.slotItemDisabled,
                sel && styles.slotItemSel
              ]}
              onPress={() => onSelect(index)}
              disabled={!available}
            >
              <Text style={[
                styles.slotText,
                isReserved && styles.slotTextReserved,
                sel && styles.slotTextSel
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity
        style={[styles.bookBtn, !selectedSlot && styles.bookBtnDisabled]}
        disabled={!selectedSlot}
        onPress={handleReserve}
      >
        <Text style={styles.bookTxt}>Reservar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:         { flex:1,backgroundColor:colors.background,padding:16 },
  center:            { flex:1,justifyContent:'center',alignItems:'center' },

  title:             { ...typography.h2,color:colors.textPrimary,textAlign:'center' },
  subtitle:          { ...typography.body,color:colors.textSecondary,textAlign:'center',marginBottom:12 },

  dayList:           { maxHeight:100,marginBottom:12 },
  dayItem:           { alignItems:'center',marginHorizontal:4,padding:8,borderRadius:8 },
  dayItemSel:        { backgroundColor:colors.primary },
  dayName:           { ...typography.body },
  dayNum:            { ...typography.h2,marginTop:4 },
  dayNameSel:        { color:colors.white },
  dayNumSel:         { color:colors.white },
  dayNameClosed:     { color:'#ccc' },

  slotList:          { maxHeight:60,marginBottom:20 },
  slotItem:          {
    backgroundColor:colors.white,
    paddingVertical:8,paddingHorizontal:12,
    marginHorizontal:4,borderRadius:8,
    borderWidth:1,borderColor:colors.primary
  },
  slotItemReserved:  { backgroundColor:'#f0f0f0' },
  slotItemDisabled:  { opacity:0.3 },
  slotItemSel:       { backgroundColor:colors.primary },
  slotText:          { ...typography.body,color:colors.textPrimary },
  slotTextReserved:  { textDecorationLine:'line-through',color:'#999' },
  slotTextSel:       { color:colors.white,fontWeight:'600' },

  bookBtn:           { backgroundColor:colors.primary,paddingVertical:14,borderRadius:25,alignItems:'center' },
  bookBtnDisabled:   { opacity:0.5 },
  bookTxt:           { ...typography.body,color:colors.buttonText,fontWeight:'600' }
});
