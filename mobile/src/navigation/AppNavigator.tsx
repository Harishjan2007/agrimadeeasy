import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

import HomeScreen from '../screens/HomeScreen';
import CropPricesScreen from '../screens/CropPricesScreen';
import PredictionsScreen from '../screens/PredictionsScreen';
import MachineryScreen from '../screens/MachineryScreen';
import MachineryBookingScreen from '../screens/MachineryBookingScreen';
import MachineryTrackingScreen from '../screens/MachineryTrackingScreen';
import DealersScreen from '../screens/DealersScreen';
import SchemesScreen from '../screens/SchemesScreen';
import MarketplaceScreen from '../screens/MarketplaceScreen';
import FarmStoreScreen from '../screens/FarmStoreScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AuthScreen from '../screens/AuthScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: '#ffffff'
        },
        headerTitleStyle: {
          fontWeight: '900',
          color: '#0f172a',
          fontSize: 17
        },
        tabBarActiveTintColor: '#15803d',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderColor: '#e2e8f0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700'
        },
        tabBarIcon: ({ focused }) => {
          let emoji = '🌾';
          if (route.name === 'Home') emoji = '🏠';
          if (route.name === 'CropPrices') emoji = '📊';
          if (route.name === 'Machinery') emoji = '🚜';
          if (route.name === 'Marketplace') emoji = '🌾';
          if (route.name === 'Profile') emoji = '👤';
          return <Text style={{ fontSize: 18 }}>{emoji}</Text>;
        }
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: t('home') }}
      />
      <Tab.Screen
        name="CropPrices"
        component={CropPricesScreen}
        options={{ title: t('cropPrices') }}
      />
      <Tab.Screen
        name="Machinery"
        component={MachineryScreen}
        options={{ title: t('machinery') }}
      />
      <Tab.Screen
        name="Marketplace"
        component={MarketplaceScreen}
        options={{ title: t('marketplace') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: t('profile') }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerBackTitleVisible: false }}>
        {!isAuthenticated ? (
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="MainTabs"
              component={MainTabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="MachineryBooking"
              component={MachineryBookingScreen}
              options={{ title: t('bookNow') }}
            />
            <Stack.Screen
              name="MachineryTracking"
              component={MachineryTrackingScreen}
              options={{ title: t('trackTrip') }}
            />
            <Stack.Screen
              name="Predictions"
              component={PredictionsScreen}
              options={{ title: t('predictions') }}
            />
            <Stack.Screen
              name="Dealers"
              component={DealersScreen}
              options={{ title: t('dealers') }}
            />
            <Stack.Screen
              name="Schemes"
              component={SchemesScreen}
              options={{ title: t('schemes') }}
            />
            <Stack.Screen
              name="FarmStore"
              component={FarmStoreScreen}
              options={{ title: t('farmStore') }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
