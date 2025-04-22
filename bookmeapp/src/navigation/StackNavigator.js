import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PaginaInicial from '../screens/PaginaInicial';
import Login from '../screens/Login';
import Register from '../screens/Register';
import Welcome from '../screens/Welcome';

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={PaginaInicial} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />
      <Stack.Screen name="Welcome" component={Welcome} />
    </Stack.Navigator>
  );
}
