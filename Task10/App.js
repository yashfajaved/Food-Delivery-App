import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import FoodDeliveryApp from './FoodDeliveryApp';
import OrderHistory from './Task10OrderHistory';
import OrderDetails from './Task10OrderDetails';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="FoodDelivery"
        screenOptions={{
          headerShown: false
        }}
      >
        <Stack.Screen name="FoodDelivery" component={FoodDeliveryApp} />
        <Stack.Screen name="OrderHistory" component={OrderHistory} />
        <Stack.Screen name="OrderDetails" component={OrderDetails} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
