import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, FlatList, Image, TouchableOpacity,
  ActivityIndicator, StatusBar, Dimensions, ScrollView,
  Alert, Animated, RefreshControl, ImageBackground
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

// Modern Food Delivery Color Scheme
const COLORS = {
  primary: '#FF6B35',      // Vibrant Orange
  secondary: '#F7C35C',    // Warm Yellow
  accent: '#2EC4B6',       // Teal
  dark: '#1A1A2E',         // Dark Navy
  light: '#FFF8F0',        // Cream White
  grey: '#6C757D',         // Grey
  success: '#28A745',      // Green
  danger: '#DC3545',       // Red
  warning: '#FFC107',      // Yellow
  white: '#FFFFFF',
  black: '#000000',
};

const API_URL = 'http://192.168.0.104/leohub_api';

export default function OrderHistory({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    fetchOrders();
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

  // UPDATED: Fetch orders from NEW table
  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/get_orders_new.php`);
      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered': return '✅';
      case 'preparing': return '🍳';
      case 'confirmed': return '✓';
      case 'pending': return '⏳';
      case 'cancelled': return '❌';
      default: return '📦';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderOrderCard = ({ item, index }) => (
    <Animated.View
      style={[
        styles.orderCard,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
          animationDelay: `${index * 100}ms`
        }
      ]}
    >
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          <View style={styles.orderNumberContainer}>
            <Text style={styles.orderNumber}>{item.order_number}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>
                {getStatusIcon(item.status)} {item.status.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.orderDate}>{formatDate(item.order_date)}</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Customer</Text>
              <Text style={styles.infoValue}>{item.customer_name}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Total Amount</Text>
              <Text style={[styles.infoValue, styles.totalAmount]}>${parseFloat(item.total_amount).toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Payment</Text>
              <Text style={styles.infoValue}>{item.payment_method.toUpperCase()}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Order ID</Text>
              <Text style={styles.infoValue}>#{item.id}</Text>
            </View>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
          >
            <Text style={styles.detailsButtonText}>View Details →</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      <ImageBackground
        source={{ uri: 'https://www.transparenttextures.com/patterns/cubes.png' }}
        style={styles.background}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🍔 Order History</Text>
          <Text style={styles.headerSubtitle}>Track all your food orders</Text>
        </View>

        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🍕</Text>
              <Text style={styles.emptyText}>No orders yet</Text>
              <Text style={styles.emptySubText}>Your order history will appear here</Text>
            </View>
          }
        />
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark },
  background: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.dark },
  loadingText: { color: COLORS.white, marginTop: 10, fontSize: 16 },
  header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20 },
  headerTitle: { fontSize: 34, fontWeight: 'bold', color: COLORS.white },
  headerSubtitle: { fontSize: 14, color: COLORS.secondary, marginTop: 5 },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  orderCard: { backgroundColor: COLORS.white, borderRadius: 20, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  cardContent: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderNumberContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  orderNumber: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: 'bold', color: COLORS.white },
  orderDate: { fontSize: 12, color: COLORS.grey },
  cardBody: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F0F0F0', paddingVertical: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoItem: { flex: 1 },
  infoLabel: { fontSize: 11, color: COLORS.grey, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '500', color: COLORS.dark },
  totalAmount: { color: COLORS.primary, fontWeight: 'bold', fontSize: 16 },
  cardFooter: { marginTop: 12, alignItems: 'flex-end' },
  detailsButton: { paddingVertical: 8, paddingHorizontal: 16, backgroundColor: COLORS.primary + '10', borderRadius: 20 },
  detailsButtonText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  emptyContainer: { alignItems: 'center', paddingTop: 100 },
  emptyEmoji: { fontSize: 80, marginBottom: 20 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: COLORS.white, marginBottom: 10 },
  emptySubText: { fontSize: 14, color: COLORS.grey },
});