import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Importación de pantallas
import PaginaInicial     from '../screens/PaginaInicial';
import Login             from '../screens/Login';
import Register          from '../screens/Register';
import Welcome           from '../screens/Welcome';
import Profile           from '../screens/Profile';
import Services          from '../screens/Services';
import ServiceForm       from '../screens/ServiceForm';
import ManageBookings    from '../screens/ManageBookings';
import ManageSchedule    from '../screens/ManageSchedule';
import CompanyDetails    from '../screens/CompanyDetails';
import ServiceDetails    from '../screens/ServiceDetails';
import BookingScreen     from '../screens/BookingScreen';
import MyReservations    from '../screens/MyReservations';

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Pantallas públicas */}
      <Stack.Screen name="Home"         component={PaginaInicial} />
      <Stack.Screen name="Login"        component={Login} />
      <Stack.Screen name="Register"     component={Register} />

      {/* Pantallas principales */}
      <Stack.Screen name="Welcome"      component={Welcome} />
      <Stack.Screen name="Profile"      component={Profile} />

      {/* Flujo empresa */}
      <Stack.Screen name="Services"         component={Services} />
      <Stack.Screen name="ServiceForm"      component={ServiceForm} />
      <Stack.Screen name="ManageBookings"   component={ManageBookings} />
      <Stack.Screen name="ManageSchedule"   component={ManageSchedule} />
      <Stack.Screen name="CompanyDetails"   component={CompanyDetails} />
      <Stack.Screen name="ServiceDetails"   component={ServiceDetails} />
      <Stack.Screen name="Booking"          component={BookingScreen} />
      <Stack.Screen name="MyReservations"   component={MyReservations} />
    </Stack.Navigator>
  );
}
