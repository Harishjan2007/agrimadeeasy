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
  Platform,
  Linking
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  MobileDataService,
  MobileProduct,
  MobileOrder,
  MobileProduceListing
} from '../services/dataService';

function FarmStoreScreenContent({ route, navigation }: any) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isTa = language === 'ta';

  const initialTab = route?.params?.initialTab;
  const [activeTab, setActiveTab] = useState<'catalog' | 'sell' | 'orders'>(
    initialTab === 'sell' ? 'sell' : 'catalog'
  );

  useEffect(() => {
    if (route?.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route?.params?.initialTab]);

  // E-commerce Store Catalog State
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
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Farmer Selling / Produce Marketplace State
  const [produceSubTab, setProduceSubTab] = useState<'all' | 'mine'>('all');
  const [produceListings, setProduceListings] = useState<MobileProduceListing[]>([]);
  const [produceModalVisible, setProduceModalVisible] = useState(false);
  const [isSubmittingProduce, setIsSubmittingProduce] = useState(false);

  // New Listing Form Fields
  const [newCropName, setNewCropName] = useState('');
  const [newProduceCategory, setNewProduceCategory] = useState('Cereals');
  const [newQuantity, setNewQuantity] = useState('');
  const [newUnit, setNewUnit] = useState('bags (75kg)');
  const [newAskingPrice, setNewAskingPrice] = useState('');
  const [newPriceUnit, setNewPriceUnit] = useState('bag');
  const [newProduceLocation, setNewProduceLocation] = useState('');
  const [newProduceDescription, setNewProduceDescription] = useState('');

  const categories = ['All', 'Seeds', 'Fertilizers', 'Bio-Inputs', 'Tools'];

  const loadCatalog = async () => {
    try {
      const list = await MobileDataService.getProducts();
      setProducts(Array.isArray(list) ? list : []);
    } catch (e) {
      console.warn('Failed to load farm store products:', e);
      setProducts([]);
    }
  };

  const loadOrders = async () => {
    try {
      const myOrders = await MobileDataService.getMyOrders(user?.id);
      setOrders(Array.isArray(myOrders) ? myOrders : []);
    } catch (e) {
      console.warn('Failed to load user orders:', e);
      setOrders([]);
    }
  };

  const loadProduceListings = async () => {
    try {
      const list = await MobileDataService.getProduceListings();
      setProduceListings(Array.isArray(list) ? list : []);
    } catch (e) {
      console.warn('Failed to load produce listings:', e);
      setProduceListings([]);
    }
  };

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([loadCatalog(), loadOrders(), loadProduceListings()]);
    setRefreshing(false);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadCatalog(), loadOrders(), loadProduceListings()]).finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      setCustomerName(user.name || '');
      setCustomerPhone(user.phone || '');
      setDeliveryAddress(user.location ? `${user.location}, ${user.district || 'Tamil Nadu'}` : '');
      setNewProduceLocation(user.district ? `${user.location || 'Farm'}, ${user.district}` : 'Tamil Nadu');
    }
  }, [user]);

  const filteredProducts = (products || []).filter((p) => {
    if (!p) return false;
    const s = (search || '').toLowerCase().trim();
    const name = (p.name || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    const dealer = (p.dealer_name || '').toLowerCase();
    const matchesSearch = !s || name.includes(s) || desc.includes(s) || dealer.includes(s);
    const matchesCat = !category || category === 'All' || p.category === category;
    return matchesSearch && matchesCat;
  });

  const displayedProduce = (produceSubTab === 'mine' && user?.id
    ? (produceListings || []).filter((l) => l && l.farmer_id === user.id)
    : (produceListings || [])).filter(Boolean);

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

      setSelectedProduct(null);
      await loadOrders();
      setActiveTab('orders');
      Alert.alert(
        'Order Received',
        `Your order #${createdOrder?.id?.slice(0, 8) || 'ORD'} has been successfully placed with ${selectedProduct.dealer_name}. Cash will be collected upon delivery or store pickup.`
      );
    } catch (err: any) {
      setIsSubmittingOrder(false);
      Alert.alert('Order Error', err.message || 'Failed to submit order.');
    }
  };

  const handleCreateProduceListing = async () => {
    if (!newCropName.trim() || !newQuantity.trim() || !newAskingPrice.trim()) {
      Alert.alert('Required Fields', 'Please enter crop name, quantity, and asking price.');
      return;
    }

    const numQty = Number(newQuantity);
    const numPrice = Number(newAskingPrice);

    if (numQty <= 0 || isNaN(numQty)) {
      Alert.alert('Invalid Quantity', 'Please enter a positive numeric quantity.');
      return;
    }
    if (numPrice <= 0 || isNaN(numPrice)) {
      Alert.alert('Invalid Price', 'Please enter a positive numeric asking price.');
      return;
    }

    setIsSubmittingProduce(true);

    try {
      const { data, error } = await MobileDataService.createProduceListing({
        farmerId: user?.id,
        farmerName: user?.name || 'Local Farmer',
        farmerPhone: user?.phone || '+91 98432 12345',
        cropName: newCropName.trim(),
        category: newProduceCategory,
        quantity: numQty,
        unit: newUnit.trim(),
        askingPrice: numPrice,
        priceUnit: newPriceUnit.trim(),
        location: (newProduceLocation || user?.district || 'Tamil Nadu').trim(),
        description: newProduceDescription.trim()
      });

      setIsSubmittingProduce(false);

      if (error) {
        Alert.alert('Notice', error.message || 'Could not publish produce listing.');
        return;
      }

      setProduceModalVisible(false);
      setNewCropName('');
      setNewQuantity('');
      setNewAskingPrice('');
      setNewProduceDescription('');
      Alert.alert('Produce Published', 'Your harvest lot is now visible to wholesale buyers and dealers.');
      await loadProduceListings();
      setProduceSubTab('mine');
    } catch (err: any) {
      setIsSubmittingProduce(false);
      Alert.alert('Error', err.message || 'Failed to submit produce listing.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 3 Main Tabs: Farm Store | Sell Produce | Orders */}
      <View style={styles.topTabBar}>
        <TouchableOpacity
          style={[styles.topTabBtn, activeTab === 'catalog' && styles.topTabBtnActive]}
          onPress={() => setActiveTab('catalog')}
        >
          <Text style={[styles.topTabBtnText, activeTab === 'catalog' && styles.topTabBtnTextActive]}>
            🛒 {t('farmStore') || 'Store'} ({products.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTabBtn, activeTab === 'sell' && styles.topTabBtnActive]}
          onPress={() => {
            setActiveTab('sell');
            loadProduceListings();
          }}
        >
          <Text style={[styles.topTabBtnText, activeTab === 'sell' && styles.topTabBtnTextActive]}>
            🌾 {isTa ? 'விளைபொருள் விற்பனை' : 'Sell Produce'} ({produceListings.length})
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
            📦 {t('orderHistory') || 'Orders'} ({orders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ================= TAB 1: STORE CATALOG ================= */}
      {activeTab === 'catalog' && (
        <>
          <View style={styles.noticeBanner}>
            <Text style={styles.noticeTitle}>🛡️ Direct Dealer Settlement</Text>
            <Text style={styles.noticeText}>
              {t('storeNotice') || 'Genuine seeds, fertilizers, and tools supplied directly by verified regional dealers.'}
            </Text>
          </View>

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

          {loading && !refreshing ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#15803d" />
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} />}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyEmoji}>🛒</Text>
                  <Text style={styles.emptyTitle}>No matching products available</Text>
                  <Text style={styles.emptySub}>Try searching with different terms or select 'All'.</Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={styles.productCard}>
                  <View style={styles.imageFallback}>
                    <Text style={{ fontSize: 28 }}>📦</Text>
                  </View>

                  <View style={styles.productContent}>
                    <View style={styles.cardHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.productName}>{item.name}</Text>
                        <Text style={styles.dealerName}>Store: {item.dealer_name}</Text>
                      </View>
                      <View style={styles.catBadge}>
                        <Text style={styles.catBadgeText}>{item.category}</Text>
                      </View>
                    </View>

                    <Text style={styles.productDesc} numberOfLines={2}>{item.description}</Text>

                    <View style={styles.priceStockRow}>
                      <View>
                        <Text style={styles.priceText}>
                          ₹{Number(item.price || 0).toLocaleString('en-IN')}{' '}
                          <Text style={styles.unitSub}>/ {item.unit || 'unit'}</Text>
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.stockBadge,
                          item.stock > 0 ? styles.stockIn : styles.stockOut
                        ]}
                      >
                        <Text
                          style={[
                            styles.stockText,
                            item.stock > 0 ? styles.stockInText : styles.stockOutText
                          ]}
                        >
                          {item.stock > 0 ? `In Stock (${item.stock})` : 'Out of Stock'}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.buyBtn, item.stock === 0 && styles.buyBtnDisabled]}
                      onPress={() => handleOpenOrderModal(item)}
                      disabled={item.stock === 0}
                    >
                      <Text style={styles.buyBtnText}>
                        {item.stock > 0 ? `🛒 ${t('buyNow') || 'Buy Now'}` : 'Unavailable'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </>
      )}

      {/* ================= TAB 2: FARMER PRODUCE SELLING ================= */}
      {activeTab === 'sell' && (
        <>
          {/* Post Produce Action Bar */}
          <View style={styles.sellTopBar}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sellHeading}>Wholesale Farmer Produce</Text>
              <Text style={styles.sellSub}>List your crop harvest for wholesale procurement</Text>
            </View>
            <TouchableOpacity
              style={styles.postProduceBtn}
              onPress={() => setProduceModalVisible(true)}
            >
              <Text style={styles.postProduceBtnText}>+ Sell Produce</Text>
            </TouchableOpacity>
          </View>

          {/* Sub Tabs: All Lots vs My Listings */}
          <View style={styles.subTabBar}>
            <TouchableOpacity
              style={[styles.subTabBtn, produceSubTab === 'all' && styles.subTabBtnActive]}
              onPress={() => setProduceSubTab('all')}
            >
              <Text style={[styles.subTabBtnText, produceSubTab === 'all' && styles.subTabBtnTextActive]}>
                🌾 All Available Produce ({produceListings.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.subTabBtn, produceSubTab === 'mine' && styles.subTabBtnActive]}
              onPress={() => setProduceSubTab('mine')}
            >
              <Text style={[styles.subTabBtnText, produceSubTab === 'mine' && styles.subTabBtnTextActive]}>
                👤 My Listings ({user ? produceListings.filter((l) => l.farmer_id === user.id).length : 0})
              </Text>
            </TouchableOpacity>
          </View>

          {loading && !refreshing ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#15803d" />
            </View>
          ) : (
            <FlatList
              data={displayedProduce}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} />}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyEmoji}>🌾</Text>
                  <Text style={styles.emptyTitle}>
                    {produceSubTab === 'mine' ? 'You have no active produce listings' : 'No produce listings currently available'}
                  </Text>
                  <Text style={styles.emptySub}>
                    {produceSubTab === 'mine'
                      ? 'Tap "+ Sell Produce" to publish your harvest lot directly to wholesale buyers.'
                      : 'Check back soon as local farmers publish newly harvested crops.'}
                  </Text>
                  {produceSubTab === 'mine' && (
                    <TouchableOpacity
                      style={styles.firstPostBtn}
                      onPress={() => setProduceModalVisible(true)}
                    >
                      <Text style={styles.firstPostBtnText}>+ Publish Your First Produce</Text>
                    </TouchableOpacity>
                  )}
                </View>
              }
              renderItem={({ item }) => {
                const isOwnListing = Boolean(user?.id && item.farmer_id === user.id);
                return (
                  <View style={styles.produceCard}>
                    <View style={styles.cardHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.produceCropTitle}>{item.crop_name}</Text>
                          {isOwnListing && (
                            <View style={styles.ownBadge}>
                              <Text style={styles.ownBadgeText}>Your Listing</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.produceFarmerSub}>
                          👨‍🌾 {item.farmer_name} • 📍 {item.location}
                        </Text>
                        {Boolean(item.description) && (
                          <Text style={styles.produceDescText} numberOfLines={2}>
                            {item.description}
                          </Text>
                        )}
                      </View>
                      <View style={styles.qtyPill}>
                        <Text style={styles.qtyPillText}>
                          {item.quantity} {item.unit}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.producePriceRow}>
                      <Text style={styles.producePriceLabel}>Asking Price:</Text>
                      <Text style={styles.producePriceVal}>
                        ₹{Number(item.asking_price || 0).toLocaleString('en-IN')} / {item.price_unit || 'unit'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.contactFarmerBtn}
                      onPress={() => {
                        if (item.farmer_phone) {
                          Linking.openURL(`tel:${item.farmer_phone}`);
                        } else {
                          Alert.alert('Contact', 'No contact phone listed for this farmer.');
                        }
                      }}
                    >
                      <Text style={styles.contactFarmerBtnText}>
                        📞 {isOwnListing ? 'Call Listing Phone' : 'Contact Farmer'} ({item.farmer_phone})
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          )}
        </>
      )}

      {/* ================= TAB 3: ORDER HISTORY ================= */}
      {activeTab === 'orders' && (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={styles.emptyTitle}>{t('noOrders') || 'No Orders Placed Yet'}</Text>
              <Text style={styles.emptySub}>
                Explore the Farm Store tab to purchase certified agricultural inputs.
              </Text>
              <TouchableOpacity
                style={styles.browseStoreBtn}
                onPress={() => setActiveTab('catalog')}
              >
                <Text style={styles.browseStoreBtnText}>Browse Farm Store →</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.orderIdText}>Order #{(item.order_number || item.id || '').slice(0, 8)}</Text>
                  <Text style={styles.orderDateText}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</Text>
                </View>
                <View
                  style={[
                    styles.orderStatusBadge,
                    (item.order_status || (item as any).status) === 'delivered' ? styles.orderDelivered : styles.orderConfirmed
                  ]}
                >
                  <Text
                    style={[
                      styles.orderStatusBadgeText,
                      (item.order_status || (item as any).status) === 'delivered' ? styles.orderDeliveredText : styles.orderConfirmedText
                    ]}
                  >
                    {((item.order_status || (item as any).status || 'placed') as string).toUpperCase()}
                  </Text>
                </View>
              </View>

              {(item.items || []).map((prod, idx) => (
                <View key={idx} style={styles.orderItemRow}>
                  <Text style={styles.orderItemName}>
                    {prod.product_name} × {prod.quantity}
                  </Text>
                  <Text style={styles.orderItemPrice}>
                    ₹{Number((prod.unit_price || 0) * (prod.quantity || 1)).toLocaleString('en-IN')}
                  </Text>
                </View>
              ))}

              <View style={styles.orderDivider} />

              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.paymentMethodLabel}>💳 {item.payment_method || 'Cash on Delivery'}</Text>
                  <Text style={styles.deliveryLocText}>📍 {item.delivery_address || 'Address provided'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.orderTotalLabel}>Total Amount</Text>
                  <Text style={styles.orderTotalVal}>
                    ₹{Number(item.total_amount || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* ================= MODAL: CREATE PRODUCE LISTING ================= */}
      <Modal visible={produceModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalHeading}>Sell Produce Directly</Text>
                <TouchableOpacity onPress={() => setProduceModalVisible(false)}>
                  <Text style={styles.modalCloseIcon}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>Crop Name & Variety *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. ADT-45 Raw Paddy, Country Onion"
                value={newCropName}
                onChangeText={setNewCropName}
              />

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.fieldLabel}>Quantity *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 50"
                    value={newQuantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Unit *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. bags (75kg)"
                    value={newUnit}
                    onChangeText={setNewUnit}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.fieldLabel}>Asking Price (₹) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 1850"
                    value={newAskingPrice}
                    onChangeText={setNewAskingPrice}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Price Per *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="bag / quintal / kg"
                    value={newPriceUnit}
                    onChangeText={setNewPriceUnit}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Farm Location *</Text>
              <TextInput
                style={styles.input}
                placeholder="Village / Farm Area, District"
                value={newProduceLocation}
                onChangeText={setNewProduceLocation}
              />

              <Text style={styles.fieldLabel}>Quality & Lot Details</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                placeholder="e.g. Moisture 11%, freshly harvested, ready for inspection"
                value={newProduceDescription}
                onChangeText={setNewProduceDescription}
                multiline
              />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setProduceModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitProduceBtn}
                  onPress={handleCreateProduceListing}
                  disabled={isSubmittingProduce}
                >
                  {isSubmittingProduce ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.submitProduceBtnText}>Publish Harvest Lot</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ================= MODAL: STORE ORDER CHECKOUT ================= */}
      {selectedProduct && (
        <Modal visible={Boolean(selectedProduct)} animationType="slide" transparent>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalHeaderRow}>
                  <Text style={styles.modalHeading}>Place Store Order</Text>
                  <TouchableOpacity onPress={() => setSelectedProduct(null)}>
                    <Text style={styles.modalCloseIcon}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.modalProductCard}>
                  <Text style={styles.modalProdName}>{selectedProduct.name}</Text>
                  <Text style={styles.modalDealerSub}>Store: {selectedProduct.dealer_name}</Text>
                  <Text style={styles.modalPriceText}>
                    ₹{selectedProduct.price} / {selectedProduct.unit || 'unit'}
                  </Text>
                </View>

                {/* Quantity Control */}
                <Text style={styles.fieldLabel}>Quantity</Text>
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
                    = ₹{Number((selectedProduct.price || 0) * (orderQuantity || 1)).toLocaleString('en-IN')}
                  </Text>
                </View>

                {/* Fulfillment Method */}
                <Text style={styles.fieldLabel}>Fulfillment Method</Text>
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
                      Cash on Delivery
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
                      Store Pickup
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.fieldLabel}>Contact Name *</Text>
                <TextInput
                  style={styles.input}
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder="Your Full Name"
                />

                <Text style={styles.fieldLabel}>Contact Phone *</Text>
                <TextInput
                  style={styles.input}
                  value={customerPhone}
                  onChangeText={setCustomerPhone}
                  placeholder="10-digit mobile number"
                  keyboardType="phone-pad"
                />

                {fulfillmentMethod === 'delivery' && (
                  <>
                    <Text style={styles.fieldLabel}>Delivery Address *</Text>
                    <TextInput
                      style={styles.input}
                      value={deliveryAddress}
                      onChangeText={setDeliveryAddress}
                      placeholder="Village / Farm Field, District"
                    />
                  </>
                )}

                <View style={styles.modalTotalBox}>
                  <Text style={styles.modalTotalLabel}>Total Payable:</Text>
                  <Text style={styles.modalTotalVal}>
                    ₹{Number((selectedProduct.price || 0) * (orderQuantity || 1)).toLocaleString('en-IN')}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.submitOrderBtn}
                  onPress={handleConfirmOrder}
                  disabled={isSubmittingOrder}
                >
                  {isSubmittingOrder ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.submitOrderBtnText}>Confirm Order</Text>
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

class FarmStoreErrorBoundary extends React.Component<
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
    console.error('FarmStoreScreen caught runtime error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 36, marginBottom: 12 }}>🛒</Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', textAlign: 'center' }}>
            Farm Store Notice
          </Text>
          <Text style={{ fontSize: 12, color: '#64748B', marginTop: 6, textAlign: 'center' }}>
            {this.state.error?.message || 'A render issue occurred in the farm store.'}
          </Text>
          <TouchableOpacity
            style={{ marginTop: 20, backgroundColor: '#15803d', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Reload Store</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

export default function FarmStoreScreen(props: any) {
  return (
    <FarmStoreErrorBoundary>
      <FarmStoreScreenContent {...props} />
    </FarmStoreErrorBoundary>
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
    borderColor: 'transparent'
  },
  topTabBtnActive: {
    borderColor: '#15803d'
  },
  topTabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b'
  },
  topTabBtnTextActive: {
    color: '#15803d'
  },
  noticeBanner: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#bbf7d0'
  },
  noticeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#166534'
  },
  noticeText: {
    fontSize: 11,
    color: '#15803d',
    marginTop: 1
  },
  searchSection: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0'
  },
  searchInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 8
  },
  catTab: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    marginRight: 6
  },
  catTabActive: {
    backgroundColor: '#15803d'
  },
  catTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b'
  },
  catTabTextActive: {
    color: '#ffffff'
  },
  listContainer: {
    padding: 14,
    paddingBottom: 30
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    gap: 12
  },
  imageFallback: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  productContent: {
    flex: 1
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  productName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a'
  },
  dealerName: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1
  },
  catBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  catBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569'
  },
  productDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4
  },
  priceStockRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  priceText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a'
  },
  unitSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b'
  },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  stockIn: {
    backgroundColor: '#dcfce7'
  },
  stockOut: {
    backgroundColor: '#fee2e2'
  },
  stockText: {
    fontSize: 10,
    fontWeight: '800'
  },
  stockInText: {
    color: '#15803d'
  },
  stockOutText: {
    color: '#dc2626'
  },
  buyBtn: {
    backgroundColor: '#15803d',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  buyBtnDisabled: {
    backgroundColor: '#cbd5e1'
  },
  buyBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12
  },
  sellTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0'
  },
  sellHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a'
  },
  sellSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1
  },
  postProduceBtn: {
    backgroundColor: '#15803d',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8
  },
  postProduceBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12
  },
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    padding: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0'
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  subTabBtnActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a'
  },
  subTabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b'
  },
  subTabBtnTextActive: {
    color: '#ffffff'
  },
  produceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  produceCropTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a'
  },
  produceFarmerSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  produceDescText: {
    fontSize: 11,
    color: '#475569',
    marginTop: 4
  },
  qtyPill: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  qtyPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d'
  },
  producePriceRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6
  },
  producePriceLabel: {
    fontSize: 11,
    color: '#64748b'
  },
  producePriceVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a'
  },
  contactFarmerBtn: {
    marginTop: 10,
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  contactFarmerBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a'
  },
  ownBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  ownBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#b45309'
  },
  firstPostBtn: {
    backgroundColor: '#15803d',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12
  },
  firstPostBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  orderIdText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a'
  },
  orderDateText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1
  },
  orderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  orderDelivered: {
    backgroundColor: '#dcfce7'
  },
  orderConfirmed: {
    backgroundColor: '#dbeafe'
  },
  orderStatusBadgeText: {
    fontSize: 9,
    fontWeight: '900'
  },
  orderDeliveredText: {
    color: '#15803d'
  },
  orderConfirmedText: {
    color: '#1d4ed8'
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  orderItemName: {
    fontSize: 12,
    color: '#334155'
  },
  orderItemPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a'
  },
  orderDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 8
  },
  paymentMethodLabel: {
    fontSize: 11,
    color: '#64748b'
  },
  deliveryLocText: {
    fontSize: 11,
    color: '#334155',
    marginTop: 2
  },
  orderTotalLabel: {
    fontSize: 10,
    color: '#64748b'
  },
  orderTotalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803d',
    marginTop: 1
  },
  browseStoreBtn: {
    backgroundColor: '#15803d',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12
  },
  browseStoreBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%'
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  modalHeading: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a'
  },
  modalCloseIcon: {
    fontSize: 18,
    fontWeight: '900',
    color: '#64748b',
    padding: 4
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginTop: 8,
    marginBottom: 4
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 13,
    color: '#0f172a'
  },
  row: {
    flexDirection: 'row'
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9'
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569'
  },
  submitProduceBtn: {
    backgroundColor: '#15803d',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  submitProduceBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff'
  },
  modalProductCard: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  modalProdName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a'
  },
  modalDealerSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  modalPriceText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803d',
    marginTop: 4
  },
  qtyControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10
  },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
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
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a'
  },
  qtyTotalSummary: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803d'
  },
  fulfillmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10
  },
  fulfillmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
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
    fontSize: 18,
    marginBottom: 2
  },
  fulfillmentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b'
  },
  fulfillmentTextActive: {
    color: '#15803d'
  },
  modalTotalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  modalTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a'
  },
  modalTotalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#15803d'
  },
  submitOrderBtn: {
    backgroundColor: '#15803d',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  submitOrderBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800'
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 10
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a'
  },
  emptySub: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4
  }
});
