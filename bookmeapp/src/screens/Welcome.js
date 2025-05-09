import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  FlatList,
  ActivityIndicator,
  Image,
  Dimensions
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import colors from '../theme/colors';
import typography from '../theme/typography';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH  = SCREEN_WIDTH * 0.96;
const CARD_HEIGHT = 160;

export default function Welcome({ route, navigation }) {
  const { mode } = route.params;
  const [userData, setUserData]   = useState({ name: '', photoURL: null });
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading]     = useState(mode === 'usuario');

  useEffect(() => {
    (async () => {
      const uid = auth.currentUser.uid;
      const colName = mode === 'empresa' ? 'business' : 'users';
      const snap = await getDoc(doc(db, colName, uid));
      if (snap.exists()) {
        const d = snap.data();
        setUserData({
          name: mode === 'empresa' ? d.businessName : d.name,
          photoURL: d.photoURL || null
        });
      }
      if (mode === 'usuario') {
        setLoading(true);
        const snap2 = await getDocs(collection(db, 'business'));
        setCompanies(snap2.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }
    })();
  }, []);

  const openCompany = item =>
    navigation.navigate('CompanyDetails', {
      companyId: item.id,
      companyName: item.businessName
    });

  const renderCompany = ({ item }) => (
    <View style={styles.cardContainer}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => openCompany(item)}
        activeOpacity={0.85}
      >
        {item.bannerUrl
          ? <Image source={{ uri: item.bannerUrl }} style={styles.banner} />
          : <View style={styles.bannerPlaceholder}/>}
        <View style={styles.logoContainer}>
          {item.logoUrl
            ? <Image source={{ uri: item.logoUrl }} style={styles.logo}/>
            : <Ionicons name="business" size={40} color={colors.primary}/>}
        </View>
        <View style={styles.info}>
          <Text style={styles.companyName}>{item.businessName}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {item.description || item.address || 'Sin descripción.'}
          </Text>
          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() => openCompany(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.viewBtnText}>Ver Empresa</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.opinionsBtn}
        onPress={() => navigation.navigate('Opinions', {
          companyId: item.id,
          companyName: item.businessName,
          viewOnly: true
        })}
      >
        <Text style={styles.opinionsBtnText}>Ver opiniones</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Cabecera */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile', { mode })}>
            {userData.photoURL
              ? <Image source={{ uri: userData.photoURL }} style={styles.avatar}/>
              : <Ionicons name="person-circle-outline" size={50} color={colors.white}/>}
          </TouchableOpacity>
          <View style={styles.greeting}>
            <Text style={styles.greetingText}>Hola,</Text>
            <Text style={styles.greetingName}>{userData.name}</Text>
          </View>
        </View>
        {mode === 'usuario' && (
          <TouchableOpacity onPress={() => navigation.navigate('MyReservations')}>
            <Ionicons name="calendar" size={28} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>

      {/* Menú o listado */}
      {mode === 'empresa' ? (
        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.navigate('Services')}>
            <Ionicons name="briefcase" size={20} color={colors.primary} />
            <Text style={styles.menuText}>Servicios</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.navigate('ManageBookings')}>
            <Ionicons name="calendar" size={20} color={colors.primary} />
            <Text style={styles.menuText}>Citas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.navigate('ManageSchedule')}>
            <Ionicons name="time" size={20} color={colors.primary} />
            <Text style={styles.menuText}>Horario</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => navigation.navigate('Opinions', {
              companyId: auth.currentUser.uid,
              companyName: userData.name,
              viewOnly: true
            })}
          >
            <Ionicons name="chatbubbles" size={20} color={colors.primary} />
            <Text style={styles.menuText}>Reseñas</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <ActivityIndicator style={styles.loading} size="large" color={colors.primary} />
      ) : (
        <FlatList
          data={companies}
          keyExtractor={i => i.id}
          renderItem={renderCompany}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex:1, backgroundColor: colors.background },
  header:       {
                  flexDirection:'row', alignItems:'center', justifyContent:'space-between',
                  backgroundColor: colors.primary, padding: 20,
                  borderBottomLeftRadius: 20, borderBottomRightRadius: 20
                },
  headerLeft:   { flexDirection:'row', alignItems:'center' },
  avatar:       { width:50, height:50, borderRadius:25, marginRight:12, borderWidth:2, borderColor:colors.accent },
  greeting:     {},
  greetingText: { color:colors.white, fontSize:16 },
  greetingName: { color:colors.white, fontSize:20, fontWeight:'700' },

  menu:         { flexDirection:'row', justifyContent:'space-around', marginVertical:20 },
  menuBtn:      { flexDirection:'row', alignItems:'center', backgroundColor:colors.white, padding:12, borderRadius:25, elevation:3 },
  menuText:     { marginLeft:6, color:colors.primary, fontWeight:'600' },

  loading:      { marginTop:40 },

  list:         { padding:10 },
  cardContainer:{ alignItems:'center', marginBottom:8 },
  card:         {
                  width: CARD_WIDTH, backgroundColor:'#fff', borderRadius:12,
                  marginVertical:10, overflow:'hidden', elevation:5
                },
  banner:       { width:'100%', height: CARD_HEIGHT },
  bannerPlaceholder:{ width:'100%', height: CARD_HEIGHT, backgroundColor:'#ddd' },
  logoContainer:{ position:'absolute', top: CARD_HEIGHT - 40, left:20,
                  width:60, height:60, borderRadius:30, backgroundColor:'#fff',
                  justifyContent:'center', alignItems:'center', elevation:5 },
  logo:         { width:56, height:56, borderRadius:28 },

  info:         { padding:16, paddingTop:24 },
  companyName:  { ...typography.h1, fontSize:18, color:colors.textPrimary },
  description:  { ...typography.body, color:colors.textSecondary, marginVertical:6, lineHeight:20 },
  viewBtn:      { marginTop:8, backgroundColor:colors.accent, paddingVertical:6, paddingHorizontal:20, borderRadius:20 },
  viewBtnText:  { color:colors.white, fontWeight:'600' },

  opinionsBtn:  {
                  backgroundColor:colors.primary,
                  paddingVertical:8,
                  paddingHorizontal:20,
                  borderRadius:20,
                  marginTop:4,
                  elevation:2
                },
  opinionsBtnText:{ color:colors.buttonText, fontWeight:'600' }
});
