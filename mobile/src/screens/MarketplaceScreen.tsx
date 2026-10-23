import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  Linking,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { MobileDataService, MobileProduceListing } from '../services/dataService';

export default function MarketplaceScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');
  const [listings, setListings] = useState<MobileProduceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Listing Form Fields
  const [cropName, setCropName] = useState('');
  const [category, setCategory] = useState('Cereals');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('bags (75kg)');
  const [askingPrice, setAskingPrice] = useState('');
  const [priceUnit, setPriceUnit] = useState('bag');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const loadListings = async () => {
    try {
      const list = await MobileDataService.getProduceListings();
      setListings(list);
    } catch (e) {
      console.warn('Failed to load produce listings:', e);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadListings().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user?.location) {
      setLocation(user.district ? `${user.location}, ${user.district}` : user.location);
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadListings();
    setRefreshing(false);
  };

  const handleCreateListing = async () => {
    if (!cropName.trim() || !quantity.trim() || !askingPrice.trim()) {
      Alert.alert('Required Fields', 'Please enter crop name, quantity, and asking price.');
      return;
    }

    const numQty = Number(quantity);
    const numPrice = Number(askingPrice);

    if (numQty <= 0 || isNaN(numQty)) {
      Alert.alert('Invalid Quantity', 'Please enter a positive numeric quantity.');
      return;
    }
    if (numPrice <= 0 || isNaN(numPrice)) {
      Alert.alert('Invalid Price', 'Please enter a positive numeric asking price.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await MobileDataService.createProduceListing({
        farmerId: user?.id,
        farmerName: user?.name || 'Local Farmer',
        farmerPhone: user?.phone || '+91 98432 12345',
        cropName: cropName.trim(),
        category,
        quantity: numQty,
        unit: unit.trim(),
        askingPrice: numPrice,
        priceUnit: priceUnit.trim(),
        location: (location || user?.district || 'Tamil Nadu').trim(),
        description: description.trim()
      });

      setIsSubmitting(false);

      if (error) {
        Alert.alert('Notice', error.message || 'Could not publish produce listing.');
        return;
      }

      setModalVisible(false);
      setCropName('');
      setQuantity('');
      setAskingPrice('');
      setDescription('');
      Alert.alert('Produce Published', 'Your produce listing is now visible to wholesale buyers and traders.');
      await loadListings();
    } catch (err: any) {
      setIsSubmitting(false);
      Alert.alert('Error', err.message || 'Failed to submit listing.');
    }
  };

  const displayedListings = activeTab === 'mine' && user?.id
    ? listings.filter((l) => l.farmer_id === user.id)
    : listings;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header & Post Button */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.topTitle}>{t('listingsTitle')}</Text>
          <Text style={styles.topSub}>Direct wholesale farmer-to-buyer transactions</Text>
        </View>
        <TouchableOpacity
          style={styles.postBtn}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.postBtnText}>+ {t('newListing')}</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs: All Produce vs My Listings */}
      <View style={styles.subTabBar}>
        <TouchableOpacity
          style={[styles.subTabBtn, activeTab === 'all' && styles.subTabBtnActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.subTabBtnText, activeTab === 'all' && styles.subTabBtnTextActive]}>
            🌾 {t('allListings')} ({listings.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabBtn, activeTab === 'mine' && styles.subTabBtnActive]}
          onPress={() => setActiveTab('mine')}
        >
          <Text style={[styles.subTabBtnText, activeTab === 'mine' && styles.subTabBtnTextActive]}>
            📋 {t('myListings')} ({listings.filter((l) => l.farmer_id === user?.id).length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#15803d" />
        </View>
      ) : (
        <FlatList
          data={displayedListings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🌾</Text>
              <Text style={styles.emptyTitle}>{t('noListings')}</Text>
              {activeTab === 'mine' && (
                <TouchableOpacity style={styles.publishPromptBtn} onPress={() => setModalVisible(true)}>
                  <Text style={styles.publishPromptText}>+ Publish Your First Crop</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cropTitle}>{item.crop_name}</Text>
                  <Text style={styles.farmerSub}>
                    👨‍🌾 {item.farmer_name} • 📍 {item.location}
                  </Text>
                  {Boolean(item.description) && (
                    <Text style={styles.descText} numberOfLines={2}>{item.description}</Text>
                  )}
                </View>
                <View style={styles.qtyBadge}>
                  <Text style={styles.qtyBadgeText}>
                    {item.quantity} {item.unit}
                  </Text>
                </View>
              </View>

              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>{t('askingPrice')}:</Text>
                <Text style={styles.priceVal}>
                  ₹{item.asking_price.toLocaleString('en-IN')} / {item.price_unit}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.contactBtn}
                onPress={() => {
                  if (item.farmer_phone) {
                    Linking.openURL(`tel:${item.farmer_phone}`);
                  } else {
                    Alert.alert('Contact', 'No contact phone listed for this listing.');
                  }
                }}
              >
                <Text style={styles.contactBtnText}>
                  📞 {t('contactFarmer')} ({item.farmer_phone})
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Post Produce Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalHeading}>{t('newListing')}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalCloseIcon}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.fieldLabel}>Crop Name & Variety *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. ADT-45 Raw Paddy, Country Onion"
                value={cropName}
                onChangeText={setCropName}
              />

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.fieldLabel}>Quantity *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 50"
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Unit *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. quintals / bags"
                    value={unit}
                    onChangeText={setUnit}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.fieldLabel}>Asking Price (₹) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 2400"
                    value={askingPrice}
                    onChangeText={setAskingPrice}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Price Unit</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. bag / quintal"
                    value={priceUnit}
                    onChangeText={setPriceUnit}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Farm / Pickup Location *</Text>
              <TextInput
                style={styles.input}
                placeholder="Village, district or landmark"
                value={location}
                onChangeText={setLocation}
              />

              <Text style={styles.fieldLabel}>Quality & Harvesting Details</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                placeholder="Sun-dried, moisture percentage, harvest date, etc."
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>{t('cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitModalBtn, isSubmitting && styles.submitModalBtnDisabled]}
                  onPress={handleCreateListing}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.submitModalBtnText}>Publish Listing</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  topBar: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  topTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a'
  },
  topSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  postBtn: {
    backgroundColor: '#15803d',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10
  },
  postBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12
  },
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0'
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  subTabBtnActive: {
    borderBottomColor: '#15803d'
  },
  subTabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b'
  },
  subTabBtnTextActive: {
    color: '#15803d'
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  cropTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a'
  },
  farmerSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4
  },
  descText: {
    fontSize: 11,
    color: '#475569',
    marginTop: 4,
    lineHeight: 15
  },
  qtyBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0'
  },
  qtyBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857'
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8
  },
  priceLabel: {
    fontSize: 12,
    color: '#64748b'
  },
  priceVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a'
  },
  contactBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  contactBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a'
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
  publishPromptBtn: {
    backgroundColor: '#15803d',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 14
  },
  publishPromptText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13
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
    maxHeight: '90%'
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  modalHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a'
  },
  modalCloseIcon: {
    fontSize: 18,
    color: '#64748b',
    padding: 4
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
    marginTop: 2
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
  row: {
    flexDirection: 'row'
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    marginBottom: 20
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f1f5f9'
  },
  cancelBtnText: {
    color: '#64748b',
    fontWeight: '700'
  },
  submitModalBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#15803d'
  },
  submitModalBtnDisabled: {
    backgroundColor: '#86efac'
  },
  submitModalBtnText: {
    color: '#ffffff',
    fontWeight: '800'
  }
});
