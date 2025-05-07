import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Pantallas
import PaginaInicial    from '../screens/PaginaInicial';
import Login            from '../screens/Login';
import Register         from '../screens/Register';
import Welcome          from '../screens/Welcome';
import Profile          from '../screens/Profile';
import AddEvent         from '../screens/AddEvent';
import CompanyDetails   from '../screens/CompanyDetails';
import BookingScreen    from '../screens/BookingScreen';
import MyReservations   from '../screens/MyReservations';

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home"           component={PaginaInicial} />
      <Stack.Screen name="Login"          component={Login} />
      <Stack.Screen name="Register"       component={Register} />
      <Stack.Screen name="Welcome"        component={Welcome} />
      <Stack.Screen name="Profile"        component={Profile} />
      <Stack.Screen name="AddEvent"       component={AddEvent} />
      <Stack.Screen name="CompanyDetails" component={CompanyDetails} />
      <Stack.Screen name="Booking"        component={BookingScreen} />
      <Stack.Screen name="MyReservations" component={MyReservations} />
    </Stack.Navigator>
  );
}
