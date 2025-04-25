// src/navigation/StackNavigator.js

import React from 'react';
// Importamos el stack navigator nativo de React Navigation
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Importamos todas las pantallas de la aplicación
import PaginaInicial   from '../screens/PaginaInicial';
import Login           from '../screens/Login';
import Register        from '../screens/Register';
import Welcome         from '../screens/Welcome';
import Profile         from '../screens/Profile';
import AddEvent        from '../screens/AddEvent';
import CompanyDetails  from '../screens/CompanyDetails';
import ServiceDetails  from '../screens/ServiceDetails';
import MyReservations  from '../screens/MyReservations';

// Creamos la instancia del stack navigator
const Stack = createNativeStackNavigator();

/**
 * Componente que define la pila de navegación de la app.
 * - Oculta los headers por defecto (`headerShown: false`).
 * - Declara cada pantalla con un nombre de ruta y el componente asociado.
 */
export default function StackNavigator() {
  return (
    <Stack.Navigator
      // Opciones globales para todas las pantallas
      screenOptions={{
        headerShown: false, // Desactiva la cabecera nativa para personalizarla en cada pantalla si hace falta
      }}
    >
      {/* Pantalla inicial de bienvenida */}
      <Stack.Screen
        name="Home"
        component={PaginaInicial}
      />

      {/* Flujo de autenticación */}
      <Stack.Screen
        name="Login"
        component={Login}
      />
      <Stack.Screen
        name="Register"
        component={Register}
      />

      {/* Pantalla principal según tipo de usuario */}
      <Stack.Screen
        name="Welcome"
        component={Welcome}
      />

      {/* Perfil de usuario/empresa */}
      <Stack.Screen
        name="Profile"
        component={Profile}
      />

      {/* Gestión de eventos (solo empresas) */}
      <Stack.Screen
        name="AddEvent"
        component={AddEvent}
      />

      {/* Detalle de empresa y servicios */}
      <Stack.Screen
        name="CompanyDetails"
        component={CompanyDetails}
      />
      <Stack.Screen
        name="ServiceDetails"
        component={ServiceDetails}
      />

      {/* Reservas del usuario */}
      <Stack.Screen
        name="MyReservations"
        component={MyReservations}
      />
    </Stack.Navigator>
  );
}
  