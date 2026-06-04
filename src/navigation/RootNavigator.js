import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme';

import RoleSelectScreen    from '../screens/RoleSelectScreen';
import LoginScreen         from '../screens/LoginScreen';
import RegisterScreen      from '../screens/RegisterScreen';
import OrdersScreen        from '../screens/OrdersScreen';
import OrderDetailScreen   from '../screens/OrderDetailScreen';
import CatalogScreen       from '../screens/CatalogScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import NewProductScreen    from '../screens/NewProductScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user, bootstrapping } = useAuth();

  if (bootstrapping) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgDark, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'none' }}>
        {!user ? (
          <>
            <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
            <Stack.Screen name="Login"      component={LoginScreen} />
            <Stack.Screen name="Register"   component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Orders"         component={OrdersScreen} />
            <Stack.Screen name="OrderDetail"    component={OrderDetailScreen} />
            <Stack.Screen name="AddItems"       component={CatalogScreen} initialParams={{ mode: 'select' }} />
            <Stack.Screen name="Products"       component={CatalogScreen} initialParams={{ mode: 'manage' }} />
            <Stack.Screen
              name="ProductDetail"
              component={ProductDetailScreen}
              options={{ presentation: 'transparentModal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen name="ProductEdit"    component={NewProductScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
