import { View, Text, Button } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View>
      <Text>Home</Text>
      <Button
        title="Ir para detalhes"
        onPress={() => navigation.navigate('Details')}
      />
    </View>
  );
}