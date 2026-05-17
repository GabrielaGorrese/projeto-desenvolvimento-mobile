import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import TelaLoginSelecao from '../screens/TelaLoginSelecao';
import TelaLoginAtendente from '../screens/TelaLoginAtendente';
import TelaMesas from '../screens/TelaMesas';
import TelaPedidos from '../screens/TelaPedidos';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="LoginSelection">
        <Stack.Screen
          name="LoginSelection"
          component={TelaLoginSelecao}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Login"
          component={TelaLoginAtendente}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Tables"
          component={TelaMesas}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Orders"
          component={TelaPedidos}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}