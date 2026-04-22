import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, FlatList, Image, TouchableOpacity,
  ActivityIndicator, StatusBar, Dimensions, ScrollView,
  Alert, Animated, Modal, TextInput, ImageBackground
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const COLORS = {
  primary: '#FF6B35',
  secondary: '#F7C35C',
  accent: '#2EC4B6',
  dark: '#1A1A2E',
  light: '#FFF8F0',
  grey: '#6C757D',
  success: '#28A745',
  white: '#FFFFFF',
};

const API_URL = 'http://192.168.0.104/leohub_api';

export default function FoodDeliveryApp({ navigation }) {
  const [foodItems, setFoodItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cartVisible, setCartVisible] = useState(false);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: '',
    paymentMethod: 'cash'
  });

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const cartAnim = useRef(new Animated.Value(0)).current;

  const categories = ['All', 'Pizza', 'Burger', 'Sushi', 'Appetizer', 'Sides', 'Salad', 'Dessert', 'Beverage'];

  useEffect(() => {
    fetchFoodItems();
    loadCart();
    startAnimation();
  }, []);

  const startAnimation = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true })
    ]).start();
  };

  const fetchFoodItems = async () => {
    try {
      const response = await fetch(`${API_URL}/get_food_items.php`);
      const data = await response.json();
      if (data.success) {
        setFoodItems(data.data);
      }
    } catch (error) {
      console.error('Error fetching food items:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCart = async () => {
    try {
      const savedCart = await AsyncStorage.getItem('food_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const saveCart = async (newCart) => {
    try {
      await AsyncStorage.setItem('food_cart', JSON.stringify(newCart));
    } catch (error) {
      console.error(error);
    }
  };

  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    let newCart;
    if (existingItem) {
      newCart = cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
    } else {
      newCart = [...cart, { ...item, quantity: 1 }];
    }
    setCart(newCart);
    saveCart(newCart);
    animateCart();
    Alert.alert('Added to Cart', `${item.name} added to your cart!`);
  };

  const animateCart = () => {
    Animated.sequence([
      Animated.timing(cartAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(cartAnim, { toValue: 0, duration: 200, useNativeDriver: true })
    ]).start();
  };

  const updateQuantity = (itemId, change) => {
    const newCart = cart.map(item => {
      if (item.id === itemId) {
        const newQuantity = item.quantity + change;
        if (newQuantity <= 0) return null;
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item !== null);
    setCart(newCart);
    saveCart(newCart);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
  };

  const placeOrder = async () => {
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      Alert.alert('Error', 'Please fill all customer information');
      return;
    }

    const orderData = {
      customer_name: customerInfo.name,
      customer_phone: customerInfo.phone,
      customer_address: customerInfo.address,
      total_amount: getCartTotal(),
      payment_method: customerInfo.paymentMethod,
      items: cart.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price
      }))
    };

    try {
      const response = await fetch(`${API_URL}/place_order.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', `Order placed successfully!\nOrder Number: ${data.order_number}`);
        setCart([]);
        saveCart([]);
        setCartVisible(false);
        setCheckoutVisible(false);
        setCustomerInfo({ name: '', phone: '', address: '', paymentMethod: 'cash' });
      }
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'Failed to place order');
    }
  };

  const filteredItems = selectedCategory === 'All'
    ? foodItems
    : foodItems.filter(item => item.category === selectedCategory);

  const FoodItemCard = ({ item }) => (
    <Animated.View style={[styles.foodCard, { opacity: fadeAnim, transform: [{ scale: slideAnim }] }]}>
      <View style={styles.cardImageContainer}>
        <Text style={styles.cardEmoji}>🍕</Text>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>⭐ {item.rating}</Text>
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.foodName}>{item.name}</Text>
        <Text style={styles.foodDescription} numberOfLines={2}>{item.description}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.foodPrice}>${item.price}</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => addToCart(item)}>
            <Text style={styles.addButtonText}>Add +</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  const CartModal = () => (
    <Modal visible={cartVisible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🛒 Your Cart</Text>
            <TouchableOpacity onPress={() => setCartVisible(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          {cart.length === 0 ? (
            <View style={styles.emptyCart}>
              <Text style={styles.emptyCartEmoji}>🛒</Text>
              <Text style={styles.emptyCartText}>Your cart is empty</Text>
              <Text style={styles.emptyCartSub}>Add some delicious items!</Text>
            </View>
          ) : (
            <>
              <FlatList
                data={cart}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.cartItem}>
                    <View style={styles.cartItemInfo}>
                      <Text style={styles.cartItemName}>{item.name}</Text>
                      <Text style={styles.cartItemPrice}>${item.price}</Text>
                    </View>
                    <View style={styles.quantityControls}>
                      <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} style={styles.qtyButton}>
                        <Text style={styles.qtyButtonText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} style={styles.qtyButton}>
                        <Text style={styles.qtyButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
              <View style={styles.cartFooter}>
                <Text style={styles.cartTotal}>Total: ${getCartTotal()}</Text>
                <TouchableOpacity style={styles.checkoutButton} onPress={() => {
                  setCartVisible(false);
                  setCheckoutVisible(true);
                }}>
                  <Text style={styles.checkoutButtonText}>Proceed to Checkout →</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  const CheckoutModal = () => (
    <Modal visible={checkoutVisible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <ScrollView style={styles.checkoutContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📝 Checkout</Text>
            <TouchableOpacity onPress={() => setCheckoutVisible(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              value={customerInfo.name}
              onChangeText={(text) => setCustomerInfo({ ...customerInfo, name: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone"
              keyboardType="phone-pad"
              value={customerInfo.phone}
              onChangeText={(text) => setCustomerInfo({ ...customerInfo, phone: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Delivery Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter your address"
              multiline
              numberOfLines={3}
              value={customerInfo.address}
              onChangeText={(text) => setCustomerInfo({ ...customerInfo, address: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Payment Method</Text>
            <View style={styles.paymentOptions}>
              {['cash', 'card', 'online'].map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[styles.paymentOption, customerInfo.paymentMethod === method && styles.activePayment]}
                  onPress={() => setCustomerInfo({ ...customerInfo, paymentMethod: method })}
                >
                  <Text style={[styles.paymentText, customerInfo.paymentMethod === method && styles.activePaymentText]}>
                    {method.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.orderSummary}>
            <Text style={styles.orderSummaryTitle}>Order Summary</Text>
            {cart.map((item) => (
              <View key={item.id} style={styles.orderSummaryRow}>
                <Text>{item.name} x{item.quantity}</Text>
                <Text>${(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
            <View style={styles.orderSummaryTotal}>
              <Text style={styles.totalText}>Total</Text>
              <Text style={styles.totalAmount}>${getCartTotal()}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.placeOrderButton} onPress={placeOrder}>
            <Text style={styles.placeOrderButtonText}>Place Order</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading menu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.headerTitle}>🍕 Food Delivery</Text>
            <Text style={styles.headerSubtitle}>Delicious food at your doorstep</Text>
          </View>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => navigation.navigate('OrderHistory')}
          >
            <Text style={styles.historyButtonText}>📋 History</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryChip, selectedCategory === cat && styles.activeCategory]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text style={[styles.categoryText, selectedCategory === cat && styles.activeCategoryText]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <FoodItemCard item={item} />}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />

      <CartModal />
      <CheckoutModal />

      {cart.length > 0 && (
        <AnimatedTouchable
          style={[styles.cartFab, { transform: [{ scale: cartAnim }] }]}
          onPress={() => setCartVisible(true)}
        >
          <Text style={styles.cartFabText}>🛒 {cart.length}</Text>
        </AnimatedTouchable>
      )}
    </View>
  );
}

const AnimatedTouchable = ({ onPress, style, children }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true })
    ]).start(() => onPress && onPress());
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity onPress={animatePress} activeOpacity={0.8}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.light },
  loadingText: { marginTop: 10, fontSize: 16, color: COLORS.dark },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 10, backgroundColor: COLORS.primary },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.white },
  headerSubtitle: { fontSize: 14, color: COLORS.secondary, marginTop: 5 },
  categoryScroll: { paddingHorizontal: 20, paddingVertical: 15, backgroundColor: COLORS.white },
  categoryChip: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F0F0', marginRight: 10 },
  activeCategory: { backgroundColor: COLORS.primary },
  categoryText: { fontSize: 14, color: COLORS.grey },
  activeCategoryText: { color: COLORS.white, fontWeight: 'bold' },
  listContainer: { padding: 10 },
  row: { justifyContent: 'space-between' },
  foodCard: { backgroundColor: COLORS.white, borderRadius: 15, width: width * 0.44, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  cardImageContainer: { height: 120, backgroundColor: COLORS.secondary + '30', borderTopLeftRadius: 15, borderTopRightRadius: 15, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  cardEmoji: { fontSize: 50 },
  ratingBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  ratingText: { fontSize: 10, color: COLORS.white, fontWeight: 'bold' },
  cardContent: { padding: 12 },
  foodName: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark },
  foodDescription: { fontSize: 12, color: COLORS.grey, marginVertical: 5, height: 32 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  foodPrice: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  addButton: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 12 },
  cartFab: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  cartFabText: { fontSize: 20, color: COLORS.white, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, maxHeight: '90%' },
  checkoutContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.dark },
  modalClose: { fontSize: 24, color: COLORS.grey },
  emptyCart: { alignItems: 'center', paddingVertical: 50 },
  emptyCartEmoji: { fontSize: 80, marginBottom: 20 },
  emptyCartText: { fontSize: 18, fontWeight: 'bold', color: COLORS.dark },
  emptyCartSub: { fontSize: 14, color: COLORS.grey, marginTop: 5 },
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 16, fontWeight: '500', color: COLORS.dark },
  cartItemPrice: { fontSize: 14, color: COLORS.primary, marginTop: 2 },
  quantityControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  qtyButtonText: { fontSize: 18, color: COLORS.white, fontWeight: 'bold' },
  qtyText: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark, minWidth: 30, textAlign: 'center' },
  cartFooter: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  cartTotal: { fontSize: 20, fontWeight: 'bold', color: COLORS.dark, marginBottom: 15 },
  checkoutButton: { backgroundColor: COLORS.success, padding: 15, borderRadius: 25, alignItems: 'center' },
  checkoutButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: 'bold', color: COLORS.dark, marginBottom: 8 },
  input: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 12, fontSize: 16 },
  textArea: { height: 80, textAlignVertical: 'top' },
  paymentOptions: { flexDirection: 'row', gap: 10 },
  paymentOption: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#F5F5F5', alignItems: 'center' },
  activePayment: { backgroundColor: COLORS.primary },
  paymentText: { color: COLORS.grey, fontWeight: '500' },
  activePaymentText: { color: COLORS.white },
  orderSummary: { backgroundColor: '#F5F5F5', borderRadius: 15, padding: 15, marginBottom: 20 },
  orderSummaryTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.dark, marginBottom: 10 },
  orderSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  orderSummaryTotal: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#DDD' },
  totalText: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark },
  totalAmount: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  placeOrderButton: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 25, alignItems: 'center', marginBottom: 20 },
  placeOrderButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 18 },
  historyButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  historyButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 12 },
});