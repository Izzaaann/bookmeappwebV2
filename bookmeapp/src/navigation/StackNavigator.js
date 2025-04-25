// src/navigation/StackNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PaginaInicial   from '../screens/PaginaInicial';
import Login           from '../screens/Login';
import Register        from '../screens/Register';
import Welcome         from '../screens/Welcome';
import AddEvent        from '../screens/AddEvent';
import CompanyDetails  from '../screens/CompanyDetails';
import ServiceDetails  from '../screens/ServiceDetails';
import MyReservations  from '../screens/MyReservations';

const Stack = createNativeStackNavigator();
export default function StackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home"           component={PaginaInicial} />
      <Stack.Screen name="Login"          component={Login} />
      <Stack.Screen name="Register"       component={Register} />
      <Stack.Screen name="Welcome"        component={Welcome} />
      <Stack.Screen name="AddEvent"       component={AddEvent} />
      <Stack.Screen name="CompanyDetails" component={CompanyDetails} />
      <Stack.Screen name="ServiceDetails" component={ServiceDetails} />
      <Stack.Screen name="MyReservations" component={MyReservations} />
    </Stack.Navigator>
  );
}
