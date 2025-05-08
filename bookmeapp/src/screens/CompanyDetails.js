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
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db,'business',companyId,'services'));
        setServices(snap.docs.map(d=>({id:d.id,...d.data()})));
      } catch(e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  },[companyId]);

  if(loading){
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary}/></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>{companyName}</Text>

      {services.length===0 ? (
        <Text style={styles.empty}>No hay servicios.</Text>
      ) : services.map(s=>(
        <TouchableOpacity
          key={s.id}
          style={styles.card}
          onPress={()=>navigation.navigate('Booking',{
            companyId,
            serviceId:s.id,
            serviceName:s.name,
            price:s.price,
            duration:s.duration
          })}
        >
          <Text style={styles.name}>{s.name}</Text>
          {s.description ? <Text style={styles.desc}>{s.description}</Text> : null}
          <View style={styles.row}>
            <Text style={styles.dur}>{s.duration} min</Text>
            <Text style={styles.price}>€ {s.price}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles=StyleSheet.create({
  container:{flex:1,backgroundColor:colors.background,padding:16},
  center:{flex:1,justifyContent:'center',alignItems:'center'},
  header:{...typography.h1,textAlign:'center',marginBottom:20},
  empty:{...typography.body,textAlign:'center',color:colors.textSecondary},
  card:{backgroundColor:colors.white,padding:16,borderRadius:8,marginBottom:12,borderWidth:1,borderColor:colors.primary},
  name:{...typography.h2,color:colors.textPrimary},
  desc:{...typography.body,color:colors.textSecondary,marginVertical:6},
  row:{flexDirection:'row',justifyContent:'space-between'},
  dur:{...typography.body},
  price:{...typography.body,fontWeight:'600'}
});
