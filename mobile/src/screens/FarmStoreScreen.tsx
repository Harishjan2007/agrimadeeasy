import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Alert,
  Image,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  MobileDataService,
  MobileProduct,
  MobileOrder
} from '../services/dataService';

export default function FarmStoreScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'catalog' | 'orders'>('catalog');
  const [products, setProducts] = useState<MobileProduct[]>([]);
  const [orders, setOrders] = useState<MobileOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  // Order Placement Modal State
  const [selectedProduct, setSelectedProduct] = useState<MobileProduct | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Broken image tracker to cleanly render fallback icons
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const categories = ['All', 'Seeds', 'Fertilizers', 'Bio-Inputs', 'Tools'];

  const loadCatalog = async () => {
    try {
      const list = await MobileDataService.getProducts();
      setProducts(list);
    } catch (e) {
      console.warn('Failed to load farm store products:', e);
    }
  };

  const loadOrders = async () => {
    try {
      const myOrders = await MobileDataService.getMyOrders(user?.id);
      setOrders(myOrders);
    } catch (e) {
      console.warn('Failed to load user orders:', e);
    }
  };

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([loadCatalog(), loadOrders()]);
    setRefreshing(false);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadCatalog(), loadOrders()]).finally(() => setLoading(false));
  }, [user?.id]);

  // Sync user profile fields to modal
  useEffect(() => {
    if (user) {
      setCustomerName(user.name || '');
      setCustomerPhone(user.phone || '');
      setDeliveryAddress(user.location ? `${user.location}, ${user.district}` : '');
    }
  }, [user]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.dealer_name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === 'All' || p.category === category;
    return matchesSearch && matchesCat;
  });

  const handleOpenOrderModal = (product: MobileProduct) => {
    setSelectedProduct(product);
    setOrderQuantity(1);
    setFulfillmentMethod('delivery');
    setOrderNotes('');
  };

  const handleConfirmOrder = async () => {
    if (!selectedProduct) return;

    if (!customerName.trim() || !customerPhone.trim()) {
      Alert.alert('Required Contact Information', 'Please provide your name and contact phone number.');
      return;
    }

    if (fulfillmentMethod === 'delivery' && !deliveryAddress.trim()) {
      Alert.alert('Delivery Address Required', 'Please provide a destination address for Cash on Delivery.');
      return;
    }

    if (orderQuantity <= 0 || orderQuantity > selectedProduct.stock) {
      Alert.alert('Invalid Quantity', `Available stock for this item is ${selectedProduct.stock}.`);
      return;
    }

    setIsSubmittingOrder(true);

    try {
      const { data: createdOrder, error } = await MobileDataService.createOrder({
        customerId: user?.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryAddress: deliveryAddress.trim(),
        fulfillmentMethod: fulfillmentMethod,
        notes: orderNotes.trim(),
        items: [
          {
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            category: selectedProduct.category,
            quantity: orderQuantity,
            unitPrice: selectedProduct.price
          }
        ]
      });

      setIsSubmittingOrder(false);

      if (error) {
        Alert.alert('Order Placement Notice', error.message || 'Could not place order.');
        return;
      }

      const ordNum = createdOrder?.order_number || 'ORD-NEW';
      const paymentNote = fulfillmentMethod === 'pickup'
        ? 'Payment is settled in-person at the dealer counter upon pickup.'
        : 'Payment is settled via Cash on Delivery (COD) upon delivery.';

      Alert.alert(
        t('orderPlaced'),
        `Order #${ordNum} has been recorded.\n\nTotal: ₹${(orderQuantity * selectedProduct.price).toLocaleString('en-IN')}\n\n${paymentNote}`,
        [
          {
            text: 'View My Orders',
            onPress: () => {
              setSelectedProduct(null);
              setActiveTab('orders');
              loadOrders();
            }
          },
          {
            text: 'Continue Shopping',
            onPress: () => {
              setSelectedProduct(null);
              loadOrders();
            }
          }
        ]
      );
    } catch (err: any) {
      setIsSubmittingOrder(false);
      Alert.alert('Order Error', err.message || 'Failed to submit order.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Navigation & Sub-Tabs */}
      <View style={styles.topTabBar}>
        <TouchableOpacity
          style={[styles.topTabBtn, activeTab === 'catalog' && styles.topTabBtnActive]}
          onPress={() => setActiveTab('catalog')}
        >
          <Text style={[styles.topTabBtnText, activeTab === 'catalog' && styles.topTabBtnTextActive]}>
            🛒 {t('farmStore')} ({products.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTabBtn, activeTab === 'orders' && styles.topTabBtnActive]}
          onPress={() => {
            setActiveTab('orders');
            loadOrders();
          }}
        >
          <Text style={[styles.topTabBtnText, activeTab === 'orders' && styles.topTabBtnTextActive]}>
            📦 {t('orderHistory')} ({orders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Honest Transparency Notice Banner */}
      <View style={styles.noticeBanner}>
        <Text style={styles.noticeTitle}>🛡️ Direct Dealer Settlement</Text>
        <Text style={styles.noticeText}>{t('storeNotice')}</Text>
      </View>

      {activeTab === 'catalog' ? (
        <>
          {/* Search & Category Filter Section */}
          <View style={styles.searchSection}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search certified seeds, fertilizers, bio-inputs..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#94a3b8"
            />

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={categories}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.catTab, category === item && styles.catTabActive]}
                  onPress={() => setCategory(item)}
                >
                  <Text style={[styles.catTabText, category === item && styles.catTabTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#15803d" />
              <Text style={styles.loadingText}>{t('loading')}</Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} />}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyEmoji}>🌾</Text>
                  <Text style={styles.emptyTitle}>{t('noProducts')}</Text>
                </View>
              }
              renderItem={({ item }) => {
                const isImageBroken = brokenImages[item.id] || !item.image_url;

                return (
                  <View style={styles.card}>
                    {/* Image Header or Fallback Icon */}
                    <View style={styles.imageContainer}>
                      {!isImageBroken && item.image_url ? (
                        <Image
                          source={{ uri: item.image_url }}
                          style={styles.productImg}
                          resizeMode="cover"
                          onError={() => setBrokenImages((prev) => ({ ...prev, [item.id]: true }))}
                        />
                      ) : (
                        <View style={styles.imagePlaceholder}>
                          <Text style={styles.placeholderEmoji}>
                            {item.category === 'Seeds' ? '🌾' : item.category === 'Fertilizers' ? '🧪' : item.category === 'Bio-Inputs' ? '🌱' : '🛠️'}
                          </Text>
                        </View>
                      )}
                      <View style={styles.catBadge}>
                        <Text style={styles.catBadgeText}>{item.category}</Text>
                      </View>
                    </View>

                    {/* Content Section */}
                    <View style={styles.cardBody}>
                      <Text style={styles.prodName}>{item.name}</Text>
                      {Boolean(item.description) && (
                        <Text style={styles.prodDesc} numberOfLines={2}>
                          {item.description}
                        </Text>
                      )}

                      <Text style={styles.dealerName}>
                        🏪 {item.dealer_name}
                      </Text>

                      <View style={styles.priceRow}>
                        <View>
                          <Text style={styles.priceVal}>
                            ₹{item.price.toLocaleString('en-IN')}{' '}
                            <Text style={styles.unitText}>/ {item.unit || item.pack_size || 'unit'}</Text>
                          </Text>
                          {Boolean(item.pack_size) && (
                            <Text style={styles.packSizeText}>Pack: {item.pack_size}</Text>
                          )}
                        </View>

                        <View style={styles.stockBadge}>
                          <Text style={[styles.stockText, item.stock <= 0 && styles.outOfStockText]}>
                            {item.stock > 0 ? `${t('inStock')}: ${item.stock}` : t('outOfStock')}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={[styles.orderBtn, item.stock <= 0 && styles.orderBtnDisabled]}
                        disabled={item.stock <= 0}
                        onPress={() => handleOpenOrderModal(item)}
                      >
                        <Text style={styles.orderBtnText}>{t('orderNow')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </>
      ) : (
        /* Orders History View */
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={styles.emptyTitle}>{t('noOrders')}</Text>
              <TouchableOpacity style={styles.browseStoreBtn} onPress={() => setActiveTab('catalog')}>
                <Text style={styles.browseStoreBtnText}>Browse Farm Store</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.orderCardHeader}>
                <View>
                  <Text style={styles.orderNumText}>{item.order_number}</Text>
                  <Text style={styles.orderDateText}>
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                  </Text>
                </View>

                <View style={styles.orderStatusBadge}>
                  <Text style={styles.orderStatusText}>
                    {item.order_status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.orderDivider} />

              {/* Order Items */}
              {item.items && item.items.map((it, idx) => (
                <View key={idx} style={styles.orderItemRow}>
                  <Text style={styles.orderItemName}>
                    {it.product_name} <Text style={styles.orderItemQty}>× {it.quantity}</Text>
                  </Text>
                  <Text style={styles.orderItemPrice}>
                    ₹{it.total_price.toLocaleString('en-IN')}
                  </Text>
                </View>
              ))}

              <View style={styles.orderDivider} />

              <View style={styles.orderSummaryRow}>
                <View>
                  <Text style={styles.paymentMethodLabel}>
                    💳 {item.payment_method}
                  </Text>
                  <Text style={styles.deliveryLocText}>
                    📍 {item.delivery_address}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.orderTotalLabel}>{t('totalAmount')}</Text>
                  <Text style={styles.orderTotalVal}>
                    ₹{item.total_amount.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* Order Placement Modal */}
      {selectedProduct && (
        <Modal visible={Boolean(selectedProduct)} animationType="slide" transparent>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContainer}>
              <ScrollView contentContainerStyle={styles.modalScroll}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Place Farm Order</Text>
                  <TouchableOpacity onPress={() => setSelectedProduct(null)}>
                    <Text style={styles.modalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Selected Item Summary */}
                <View style={styles.modalProductCard}>
                  <Text style={styles.modalProdName}>{selectedProduct.name}</Text>
                  <Text style={styles.modalDealerSub}>Store: {selectedProduct.dealer_name}</Text>
                  <Text style={styles.modalPriceText}>
                    ₹{selectedProduct.price} / {selectedProduct.unit || 'unit'}
                  </Text>
                </View>

                {/* Quantity Selector */}
                <Text style={styles.formLabel}>Quantity</Text>
                <View style={styles.qtyControlRow}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => setOrderQuantity((q) => Math.max(1, q - 1))}
                  >
                    <Text style={styles.qtyBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyDisplayVal}>{orderQuantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => setOrderQuantity((q) => Math.min(selectedProduct.stock, q + 1))}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyTotalSummary}>
                    = ₹{(orderQuantity * selectedProduct.price).toLocaleString('en-IN')}
                  </Text>
                </View>

                {/* Fulfillment Method Selector */}
                <Text style={styles.formLabel}>{t('paymentMethod')}</Text>
                <View style={styles.fulfillmentRow}>
                  <TouchableOpacity
                    style={[
                      styles.fulfillmentBtn,
                      fulfillmentMethod === 'delivery' && styles.fulfillmentBtnActive
                    ]}
                    onPress={() => setFulfillmentMethod('delivery')}
                  >
                    <Text style={styles.fulfillmentEmoji}>🚚</Text>
                    <Text
                      style={[
                        styles.fulfillmentText,
                        fulfillmentMethod === 'delivery' && styles.fulfillmentTextActive
                      ]}
                    >
                      {t('cod')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.fulfillmentBtn,
                      fulfillmentMethod === 'pickup' && styles.fulfillmentBtnActive
                    ]}
                    onPress={() => setFulfillmentMethod('pickup')}
                  >
                    <Text style={styles.fulfillmentEmoji}>🏪</Text>
                    <Text
                      style={[
                        styles.fulfillmentText,
                        fulfillmentMethod === 'pickup' && styles.fulfillmentTextActive
                      ]}
                    >
                      {t('pickup')}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Customer Details Form */}
                <Text style={styles.formLabel}>{t('fullName')} *</Text>
                <TextInput
                  style={styles.input}
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="Your Full Name"
                />

                <Text style={styles.formLabel}>{t('phone')} *</Text>
                <TextInput
                  style={styles.input}
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  placeholder="Contact Mobile Number"
                  keyboardType="phone-pad"
                />

                {fulfillmentMethod === 'delivery' && (
                  <>
                    <Text style={styles.formLabel}>{t('deliveryAddress')} *</Text>
                    <TextInput
                      style={[styles.input, { height: 60 }]}
                      value={deliveryAddress}
                      onChangeText={setDeliveryAddress}
                      placeholder="Village / Farm delivery destination"
                      multiline
                    />
                  </>
                )}

                <Text style={styles.formLabel}>Delivery Instructions / Notes</Text>
                <TextInput
                  style={styles.input}
                  value={orderNotes}
                  onChangeText={setOrderNotes}
                  placeholder="Optional field / landmark directions"
                />

                {/* Total Summary */}
                <View style={styles.modalTotalBox}>
                  <Text style={styles.modalTotalLabel}>{t('totalAmount')}:</Text>
                  <Text style={styles.modalTotalVal}>
                    ₹{(orderQuantity * selectedProduct.price).toLocaleString('en-IN')}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.submitOrderBtn, isSubmittingOrder && styles.submitOrderBtnDisabled]}
                  onPress={handleConfirmOrder}
                  disabled={isSubmittingOrder}
                >
                  {isSubmittingOrder ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.submitOrderBtnText}>
                      Confirm Order ({fulfillmentMethod === 'pickup' ? 'Store Pickup' : 'COD'})
                    </Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  topTabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0'
  },
  topTabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  topTabBtnActive: {
    borderBottomColor: '#15803d'
  },
  topTabBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b'
  },
  topTabBtnTextActive: {
    color: '#15803d'
  },
  noticeBanner: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#fde68a'
  },
  noticeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400e',
    marginBottom: 2
  },
  noticeText: {
    fontSize: 11,
    color: '#b45309',
    lineHeight: 15
  },
  searchSection: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0'
  },
  searchInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 12
  },
  catTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8
  },
  catTabActive: {
    backgroundColor: '#0f172a'
  },
  catTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b'
  },
  catTabTextActive: {
    color: '#ffffff'
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600'
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden'
  },
  imageContainer: {
    height: 140,
    backgroundColor: '#f1f5f9',
    position: 'relative'
  },
  productImg: {
    width: '100%',
    height: '100%'
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ecfdf5'
  },
  placeholderEmoji: {
    fontSize: 48
  },
  catBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff'
  },
  cardBody: {
    padding: 16
  },
  prodName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a'
  },
  prodDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 16
  },
  dealerName: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    marginTop: 8
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12
  },
  priceVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#15803d'
  },
  unitText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600'
  },
  packSizeText: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2
  },
  stockBadge: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  stockText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '700'
  },
  outOfStockText: {
    color: '#dc2626'
  },
  orderBtn: {
    backgroundColor: '#15803d',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14
  },
  orderBtnDisabled: {
    backgroundColor: '#94a3b8'
  },
  orderBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800'
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 10
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b'
  },
  browseStoreBtn: {
    backgroundColor: '#15803d',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 16
  },
  browseStoreBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  orderNumText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a'
  },
  orderDateText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  orderStatusBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0'
  },
  orderStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857'
  },
  orderDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2
  },
  orderItemName: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '600',
    flex: 1
  },
  orderItemQty: {
    color: '#64748b',
    fontWeight: '700'
  },
  orderItemPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a'
  },
  orderSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4
  },
  paymentMethodLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569'
  },
  deliveryLocText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  orderTotalLabel: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '700'
  },
  orderTotalVal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#15803d'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%'
  },
  modalScroll: {
    padding: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a'
  },
  modalCloseText: {
    fontSize: 18,
    color: '#64748b',
    padding: 4
  },
  modalProductCard: {
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14
  },
  modalProdName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a'
  },
  modalDealerSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  modalPriceText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#15803d',
    marginTop: 6
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    marginTop: 4
  },
  qtyControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12
  },
  qtyBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a'
  },
  qtyDisplayVal: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a'
  },
  qtyTotalSummary: {
    fontSize: 15,
    fontWeight: '800',
    color: '#15803d',
    marginLeft: 8
  },
  fulfillmentRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14
  },
  fulfillmentBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center'
  },
  fulfillmentBtnActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#15803d'
  },
  fulfillmentEmoji: {
    fontSize: 22,
    marginBottom: 4
  },
  fulfillmentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textAlign: 'center'
  },
  fulfillmentTextActive: {
    color: '#15803d'
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 10
  },
  modalTotalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  modalTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a'
  },
  modalTotalVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#15803d'
  },
  submitOrderBtn: {
    backgroundColor: '#15803d',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6
  },
  submitOrderBtnDisabled: {
    backgroundColor: '#86efac'
  },
  submitOrderBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800'
  }
});
