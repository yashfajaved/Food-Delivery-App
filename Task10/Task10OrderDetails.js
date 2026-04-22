import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, FlatList, Image, TouchableOpacity,
  ActivityIndicator, StatusBar, Dimensions, ScrollView,
  Alert, Animated, Linking, Share
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Modern Food Delivery Color Scheme
const COLORS = {
  primary: '#FF6B35',
  secondary: '#F7C35C',
  accent: '#2EC4B6',
  dark: '#1A1A2E',
  light: '#FFF8F0',
  grey: '#6C757D',
  success: '#28A745',
  danger: '#DC3545',
  warning: '#FFC107',
  white: '#FFFFFF',
  black: '#000000',
};

const API_URL = 'http://192.168.0.104/leohub_api';

export default function OrderDetails({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    fetchOrderDetails();
    startAnimation();
  }, []);

  const startAnimation = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    scaleAnim.setValue(0.9);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true })
    ]).start();
  };

  // UPDATED: Fetch order details from NEW table
  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`${API_URL}/get_order_details_new.php?id=${orderId}`);
      const data = await response.json();
      if (data.success) {
        setOrder(data.order);
        setItems(data.items);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return COLORS.success;
      case 'preparing': return COLORS.warning;
      case 'confirmed': return COLORS.accent;
      case 'pending': return COLORS.secondary;
      case 'cancelled': return COLORS.danger;
      default: return COLORS.grey;
    }
  };

  const getStatusStep = (status) => {
    const steps = ['pending', 'confirmed', 'preparing', 'delivered'];
    return steps.indexOf(status);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleTrackOrder = () => {
    Alert.alert('Track Order', 'Order tracking feature coming soon!');
  };

  const handleReorder = () => {
    Alert.alert('Reorder', 'Reorder feature coming soon!');
  };

  const handleContactSupport = () => {
    Linking.openURL('tel:+1234567890');
  };

  const handleShareOrder = async () => {
    try {
      await Share.share({
        message: `Order ${order?.order_number} - Total: $${order?.total_amount}\nStatus: ${order?.status}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const renderOrderItem = ({ item, index }) => (
    <Animated.View
      style={[
        styles.orderItem,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
          animationDelay: `${index * 100}ms`
        }
      ]}
    >
      <View style={styles.itemImageContainer}>
        <Text style={styles.itemEmoji}>🍕</Text>
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
      </View>
      <Text style={styles.itemPrice}>${parseFloat(item.price).toFixed(2)}</Text>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <TouchableOpacity onPress={handleShareOrder} style={styles.shareButton}>
            <Text style={styles.shareButtonText}>📤</Text>
          </TouchableOpacity>
        </View>

        {/* Order Status Card */}
        <Animated.View style={[styles.statusCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.statusHeader}>
            <Text style={styles.orderNumber}>{order?.order_number}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order?.status) }]}>
              <Text style={styles.statusText}>{order?.status.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressSteps}>
              {['pending', 'confirmed', 'preparing', 'delivered'].map((step, index) => (
                <View key={step} style={styles.progressStep}>
                  <View style={[
                    styles.progressDot,
                    getStatusStep(order?.status) >= index && styles.progressDotActive
                  ]}>
                    <Text style={styles.progressDotText}>
                      {getStatusStep(order?.status) >= index ? '✓' : index + 1}
                    </Text>
                  </View>
                  <Text style={styles.progressLabel}>
                    {step.charAt(0).toUpperCase() + step.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.statusFooter}>
            <Text style={styles.orderDate}>{formatDate(order?.order_date)}</Text>
          </View>
        </Animated.View>

        {/* Order Summary Card */}
        <Animated.View style={[styles.summaryCard, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
          <Text style={styles.sectionTitle}>Order Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Customer Name:</Text>
            <Text style={styles.summaryValue}>{order?.customer_name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phone Number:</Text>
            <Text style={styles.summaryValue}>{order?.customer_phone}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Address:</Text>
            <Text style={styles.summaryValue}>{order?.customer_address}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payment Method:</Text>
            <Text style={styles.summaryValue}>{order?.payment_method?.toUpperCase()}</Text>
          </View>
        </Animated.View>

        {/* Order Items */}
        <Animated.View style={[styles.itemsCard, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Items Ordered</Text>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderOrderItem}
            scrollEnabled={false}
          />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>${parseFloat(order?.total_amount).toFixed(2)}</Text>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionButton, styles.trackButton]} onPress={handleTrackOrder}>
            <Text style={styles.actionButtonText}>📍 Track Order</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.reorderButton]} onPress={handleReorder}>
            <Text style={styles.actionButtonText}>🔄 Reorder</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.supportButton]} onPress={handleContactSupport}>
            <Text style={styles.actionButtonText}>💬 Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.light },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.light },
  loadingText: { color: COLORS.dark, marginTop: 10, fontSize: 16 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: COLORS.primary },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backButtonText: { fontSize: 28, color: COLORS.white, fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.white },
  shareButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  shareButtonText: { fontSize: 24 },

  statusCard: { backgroundColor: COLORS.white, margin: 20, padding: 20, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  orderNumber: { fontSize: 18, fontWeight: 'bold', color: COLORS.dark },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { color: COLORS.white, fontWeight: 'bold', fontSize: 12 },

  progressContainer: { marginVertical: 20 },
  progressSteps: { flexDirection: 'row', justifyContent: 'space-between' },
  progressStep: { alignItems: 'center', flex: 1 },
  progressDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.grey, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  progressDotActive: { backgroundColor: COLORS.success },
  progressDotText: { color: COLORS.white, fontWeight: 'bold', fontSize: 12 },
  progressLabel: { fontSize: 10, color: COLORS.grey, textAlign: 'center' },
  statusFooter: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  orderDate: { fontSize: 12, color: COLORS.grey, textAlign: 'center' },

  summaryCard: { backgroundColor: COLORS.white, marginHorizontal: 20, marginBottom: 20, padding: 20, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.dark, marginBottom: 15 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 14, color: COLORS.grey },
  summaryValue: { fontSize: 14, fontWeight: '500', color: COLORS.dark, flex: 1, textAlign: 'right' },

  itemsCard: { backgroundColor: COLORS.white, marginHorizontal: 20, marginBottom: 20, padding: 20, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  orderItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  itemImageContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.secondary + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemEmoji: { fontSize: 24 },
  itemDetails: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '600', color: COLORS.dark },
  itemQuantity: { fontSize: 12, color: COLORS.grey, marginTop: 2 },
  itemPrice: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingTop: 15, borderTopWidth: 2, borderTopColor: '#F0F0F0' },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: COLORS.dark },
  totalAmount: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary },

  actionButtons: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 30, gap: 10 },
  actionButton: { flex: 1, paddingVertical: 14, borderRadius: 25, alignItems: 'center' },
  trackButton: { backgroundColor: COLORS.primary },
  reorderButton: { backgroundColor: COLORS.accent },
  supportButton: { backgroundColor: COLORS.dark },
  actionButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
});