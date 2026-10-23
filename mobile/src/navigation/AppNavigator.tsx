import React from 'react';
import { Text, View, ActivityIndicator, TouchableOpacity, SafeAreaView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

class AppNavigatorErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('AppNavigator caught runtime error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 36, marginBottom: 12 }}>🌾</Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', textAlign: 'center' }}>
            AgriME Application Notice
          </Text>
          <Text style={{ fontSize: 12, color: '#64748B', marginTop: 6, textAlign: 'center' }}>
            {this.state.error?.message || 'An unexpected rendering error occurred in the application.'}
          </Text>
          <TouchableOpacity
            style={{ marginTop: 20, backgroundColor: '#15803d', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Reload Application</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

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
import FarmStoreScreen from '../screens/FarmStoreScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AuthScreen from '../screens/AuthScreen';
import DealerPortalScreen from '../screens/DealerPortalScreen';
import MachineryProviderScreen from '../screens/MachineryProviderScreen';

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
        name="Profile"
        component={ProfileScreen}
        options={{ title: t('profile') }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { t } = useLanguage();

  if (isLoading || (isAuthenticated && !user)) {
    return (
      <View style={{ flex: 1, backgroundColor: '#15803d', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 36, fontWeight: '900', color: '#ffffff' }}>🌾 AgriME</Text>
        <Text style={{ fontSize: 13, color: '#bbf7d0', marginTop: 6, fontWeight: '600' }}>
          Farmer Decision & Service Platform
        </Text>
        <ActivityIndicator size="large" color="#ffffff" style={{ marginTop: 24 }} />
      </View>
    );
  }

  // Authoritative role routing
  const role = user?.role || 'farmer';

  return (
    <AppNavigatorErrorBoundary>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerBackVisible: false }}>
          {!isAuthenticated ? (
            <Stack.Screen
              name="Auth"
              component={AuthScreen}
              options={{ headerShown: false }}
            />
          ) : role === 'dealer' ? (
            // Dealer specific landing
            <>
              <Stack.Screen
                name="DealerPortal"
                component={DealerPortalScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="MainTabs"
                component={MainTabNavigator}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="MachineryProvider"
                component={MachineryProviderScreen}
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
              <Stack.Screen
                name="Marketplace"
                component={FarmStoreScreen}
                initialParams={{ initialTab: 'sell' }}
                options={{ title: t('farmStore') }}
              />
              <Stack.Screen
                name="CropPrices"
                component={CropPricesScreen}
                options={{ title: t('cropPrices') }}
              />
              <Stack.Screen
                name="Machinery"
                component={MachineryScreen}
                options={{ title: t('machinery') }}
              />
            </>
          ) : role === 'machinery_provider' ? (
            // Machinery Provider specific landing
            <>
              <Stack.Screen
                name="MachineryProvider"
                component={MachineryProviderScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="MainTabs"
                component={MainTabNavigator}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="DealerPortal"
                component={DealerPortalScreen}
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
              <Stack.Screen
                name="Marketplace"
                component={FarmStoreScreen}
                initialParams={{ initialTab: 'sell' }}
                options={{ title: t('farmStore') }}
              />
              <Stack.Screen
                name="CropPrices"
                component={CropPricesScreen}
                options={{ title: t('cropPrices') }}
              />
              <Stack.Screen
                name="Machinery"
                component={MachineryScreen}
                options={{ title: t('machinery') }}
              />
            </>
          ) : (
            // Farmer / Buyer / Default landing
            <>
              <Stack.Screen
                name="MainTabs"
                component={MainTabNavigator}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="DealerPortal"
                component={DealerPortalScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="MachineryProvider"
                component={MachineryProviderScreen}
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
              <Stack.Screen
                name="Marketplace"
                component={FarmStoreScreen}
                initialParams={{ initialTab: 'sell' }}
                options={{ title: t('farmStore') }}
              />
              <Stack.Screen
                name="CropPrices"
                component={CropPricesScreen}
                options={{ title: t('cropPrices') }}
              />
              <Stack.Screen
                name="Machinery"
                component={MachineryScreen}
                options={{ title: t('machinery') }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AppNavigatorErrorBoundary>
  );
}
