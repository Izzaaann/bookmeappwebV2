import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import PaginaInicial   from '../screens/PaginaInicial';
import Login           from '../screens/Login';
import Register        from '../screens/Register';
import Welcome         from '../screens/Welcome';
import Profile         from '../screens/Profile';
import CompanyDetails  from '../screens/CompanyDetails';
import ServiceDetails  from '../screens/ServiceDetails';
import BookingScreen   from '../screens/BookingScreen';
import Opinions        from '../screens/Opinions';
import MyReservations  from '../screens/MyReservations';
import AddEvent        from '../screens/AddEvent';
import ServicesScreen  from '../screens/ServicesScreen';
import ManageBookings  from '../screens/ManageBookings';
import ManageSchedule  from '../screens/ManageSchedule';

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Inicio y Auth */}
      <Stack.Screen name="Home" component={PaginaInicial} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />

      {/* Welcome según rol */}
      <Stack.Screen name="Welcome" component={Welcome} />

      {/* Perfil */}
      <Stack.Screen name="Profile" component={Profile} />

      {/* Usuario: detalles y reservas */}
      <Stack.Screen name="CompanyDetails" component={CompanyDetails} />
      <Stack.Screen name="ServiceDetails" component={ServiceDetails} />
      <Stack.Screen name="Booking" component={BookingScreen} />
      <Stack.Screen name="Opinions" component={Opinions} />
      <Stack.Screen name="MyReservations" component={MyReservations} />

      {/* Empresa: gestión de servicios, eventos, citas y horario */}
      <Stack.Screen name="Services" component={ServicesScreen} />
      <Stack.Screen name="AddEvent" component={AddEvent} />
      <Stack.Screen name="ManageBookings" component={ManageBookings} />
      <Stack.Screen name="ManageSchedule" component={ManageSchedule} />
    </Stack.Navigator>
  );
}
