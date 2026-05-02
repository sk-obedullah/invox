/**
 * AppNavigator - React Navigation setup
 * Bottom tabs + Stack navigators
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../theme';

// Screens
import HomeScreen from '../screens/HomeScreen';
import CreateInvoiceScreen from '../screens/CreateInvoiceScreen';
import InvoiceDetailScreen from '../screens/InvoiceDetailScreen';
import CustomerListScreen from '../screens/CustomerListScreen';
import CustomerFormScreen from '../screens/CustomerFormScreen';
import ItemListScreen from '../screens/ItemListScreen';
import ItemFormScreen from '../screens/ItemFormScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EditSettingsScreen from '../screens/EditSettingsScreen';
import ActivationScreen from '../screens/ActivationScreen';
import { useSettingsStore } from '../../store/useSettingsStore';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HomeTabs = () => {
  const theme = useAppTheme();
  const { colors } = theme.custom;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderLight,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Invoices',
          tabBarIcon: ({ color, size }) => (
            <Icon name="file-document-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CustomersTab"
        component={CustomerListScreen}
        options={{
          tabBarLabel: 'Customers',
          tabBarIcon: ({ color }) => (
            <Icon name="account-group-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ItemsTab"
        component={ItemListScreen}
        options={{
          tabBarLabel: 'Items',
          tabBarIcon: ({ color }) => (
            <Icon name="tag-multiple-outline" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Icon name="cog-outline" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const isActivated = useSettingsStore((s) => s.is_activated);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {!isActivated ? (
        <Stack.Screen name="Activation" component={ActivationScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={HomeTabs} />
          <Stack.Screen name="CreateInvoice" component={CreateInvoiceScreen} />
          <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
          <Stack.Screen name="CustomerForm" component={CustomerFormScreen} />
          <Stack.Screen name="ItemForm" component={ItemFormScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="EditSettings" component={EditSettingsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
