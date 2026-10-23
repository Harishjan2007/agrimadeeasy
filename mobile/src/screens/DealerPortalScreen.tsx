import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Linking
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  MobileDataService,
  MobileDealerQuote,
  MobileDealerInquiry,
  MobileProduct
} from '../services/dataService';

function DealerPortalScreenContent({ navigation }: any) {
  const { t, language } = useLanguage();
  const { user, signOut, setUserRole } = useAuth();
  const isTa = language === 'ta';

  const [activeTab, setActiveTab] = useState<'quotes' | 'inventory' | 'inquiries' | 'profile'>('quotes');
  const [quotes, setQuotes] = useState<MobileDealerQuote[]>([]);
  const [inquiries, setInquiries] = useState<MobileDealerInquiry[]>([]);
  const [products, setProducts] = useState<MobileProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New Quote Modal State
  const [addQuoteModal, setAddQuoteModal] = useState(false);
  const [newCropName, setNewCropName] = useState('');
  const [newCategory, setNewCategory] = useState('Cereals');
  const [newPrice, setNewPrice] = useState('');
  const [newUnit, setNewUnit] = useState('quintal');
  const [newQuality, setNewQuality] = useState('Grade A (Moisture < 12%)');
  const [newTerms, setNewTerms] = useState('Spot Cash / Immediate Bank Transfer upon weighing');
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);

  // Edit Quote Modal State
  const [editingQuote, setEditingQuote] = useState<MobileDealerQuote | null>(null);
  const [editPriceText, setEditPriceText] = useState('');

  const dealerId = user?.id || 'd1';

  const loadData = async () => {
    try {
      const [qList, inqList, prodList] = await Promise.all([
        MobileDataService.getDealerQuotes(dealerId),
        MobileDataService.getDealerInquiries(dealerId),
        MobileDataService.getProducts()
      ]);
      setQuotes(Array.isArray(qList) ? qList : []);
      setInquiries(Array.isArray(inqList) ? inqList : []);
      setProducts(Array.isArray(prodList) ? prodList : []);
    } catch (err) {
      console.warn('Failed to load dealer portal data:', err);
      setQuotes([]);
      setInquiries([]);
      setProducts([]);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [dealerId]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddQuote = async () => {
    if (!newCropName.trim() || !newPrice.trim()) {
      Alert.alert('Required Fields', 'Please enter crop name and purchase price.');
      return;
    }
    const numPrice = Number(newPrice);
    if (isNaN(numPrice) || numPrice <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid numeric purchase price.');
      return;
    }

    setIsSubmittingQuote(true);
    const { data, error } = await MobileDataService.addDealerQuote({
      dealerId,
      cropName: newCropName.trim(),
      category: newCategory,
      purchasePrice: numPrice,
      buyingPrice: numPrice,
      priceUnit: newUnit.trim(),
      unit: newUnit.trim(),
      minQuality: newQuality.trim(),
      paymentTerms: newTerms.trim()
    });
    setIsSubmittingQuote(false);

    if (error) {
      Alert.alert('Notice', error.message || 'Failed to add purchase quote.');
      return;
    }

    setAddQuoteModal(false);
    setNewCropName('');
    setNewPrice('');
    Alert.alert('Quote Published', 'Your crop procurement quote is now active for farmers.');
    await loadData();
  };

  const handleSavePriceEdit = async () => {
    if (!editingQuote) return;
    const num = Number(editPriceText);
    if (isNaN(num) || num <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid positive number.');
      return;
    }

    await MobileDataService.updateDealerQuotePrice(dealerId, editingQuote.id, num);
    const displayUnit = editingQuote.price_unit || editingQuote.unit || 'unit';
    setEditingQuote(null);
    Alert.alert('Price Updated', `Procurement price updated to ₹${num}/${displayUnit}.`);
    await loadData();
  };

  const handleUpdateInquiry = async (inquiryId: string, status: 'reviewed' | 'accepted' | 'rejected') => {
    await MobileDataService.updateDealerInquiryStatus(dealerId, inquiryId, status);
    Alert.alert('Status Updated', `Inquiry status changed to ${(status || '').toUpperCase()}.`);
    await loadData();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Dealer Header */}
      <View style={styles.header}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text style={styles.shopTitle} numberOfLines={1}>
              {user?.shop_name || 'AgriME Certified Dealer Portal'}
            </Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>✓ Verified</Text>
            </View>
          </View>
          <Text style={styles.ownerSub} numberOfLines={1}>
            👤 {user?.name || 'Authorized Dealer'} • 📍 {user?.district || 'Tamil Nadu'}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity
            style={styles.browseAppBtn}
            onPress={() => navigation.navigate('MainTabs')}
          >
            <Text style={styles.browseAppText}>🏠 App</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.switchRoleBtn}
            onPress={() => {
              setUserRole('farmer');
              navigation.navigate('MainTabs');
            }}
          >
            <Text style={styles.switchRoleText}>🌾 Farmer View</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* KPI Stats Bar */}
      <View style={styles.kpiContainer}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiVal}>{(quotes || []).length}</Text>
          <Text style={styles.kpiLabel}>Active Quotes</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiVal}>
            {(inquiries || []).filter((i) => (i?.status || '').toLowerCase() === 'pending' || (i?.status || '').toLowerCase() === 'new').length}
          </Text>
          <Text style={styles.kpiLabel}>Pending Leads</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiVal}>{(products || []).length}</Text>
          <Text style={styles.kpiLabel}>Store Items</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'quotes' && styles.tabBtnActive]}
          onPress={() => setActiveTab('quotes')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'quotes' && styles.tabBtnTextActive]}>
            🌾 {isTa ? 'கொள்முதல் விலை' : 'Quotes'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'inquiries' && styles.tabBtnActive]}
          onPress={() => setActiveTab('inquiries')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'inquiries' && styles.tabBtnTextActive]}>
            📩 {isTa ? 'விசாரணைகள்' : 'Inquiries'} ({inquiries.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'inventory' && styles.tabBtnActive]}
          onPress={() => setActiveTab('inventory')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'inventory' && styles.tabBtnTextActive]}>
            📦 {isTa ? 'சரக்கு இருப்பு' : 'Inventory'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'profile' && styles.tabBtnActive]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'profile' && styles.tabBtnTextActive]}>
            🏪 {isTa ? 'விவரக்குறிப்பு' : 'Profile'}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#15803d" />
          <Text style={{ marginTop: 10, color: '#64748b', fontSize: 13 }}>Loading dealer records...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.contentScroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* TAB 1: QUOTES */}
          {activeTab === 'quotes' && (
            <View>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionHeading}>Your Procurement Quotes</Text>
                  <Text style={styles.sectionSub}>Prices offered to farmers for direct farm-gate collection</Text>
                </View>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => setAddQuoteModal(true)}
                >
                  <Text style={styles.actionBtnText}>+ Add Quote</Text>
                </TouchableOpacity>
              </View>

              {(quotes || []).length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyEmoji}>🌾</Text>
                  <Text style={styles.emptyText}>No crop procurement quotes published yet.</Text>
                </View>
              ) : (
                (quotes || []).map((q) => {
                  const displayPrice = Number(q.purchase_price ?? q.buying_price ?? 0);
                  const displayUnit = q.price_unit || q.unit || 'quintal';
                  const displayQuality = q.min_quality || 'Grade A (Moisture < 12%)';
                  const displayTerms = q.payment_terms || 'Spot Cash / Immediate Bank Transfer upon weighing';

                  return (
                    <View key={q.id} style={styles.quoteCard}>
                      <View style={styles.cardTopRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cropTitle}>{q.crop_name}</Text>
                          <Text style={styles.cropCategory}>{q.category || 'Agricultural Produce'}</Text>
                        </View>
                        <View style={styles.priceBadge}>
                          <Text style={styles.priceVal}>₹{displayPrice.toLocaleString('en-IN')}</Text>
                          <Text style={styles.priceUnit}>/{displayUnit}</Text>
                        </View>
                      </View>

                      <Text style={styles.qualityText}>📋 Spec: {displayQuality}</Text>
                      <Text style={styles.termsText}>💳 Terms: {displayTerms}</Text>

                      <View style={styles.quoteFooter}>
                        <Text style={styles.statusLive}>● Live on Farmer App</Text>
                        <TouchableOpacity
                          style={styles.editPriceBtn}
                          onPress={() => {
                            setEditingQuote(q);
                            setEditPriceText(String(displayPrice));
                          }}
                        >
                          <Text style={styles.editPriceBtnText}>✏️ Edit Price</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* TAB 2: INQUIRIES */}
          {activeTab === 'inquiries' && (
            <View>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionHeading}>Farmer Harvest Offers</Text>
                  <Text style={styles.sectionSub}>Lots submitted by farmers awaiting procurement</Text>
                </View>
              </View>

              {(inquiries || []).length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyEmoji}>📩</Text>
                  <Text style={styles.emptyText}>No farmer inquiries currently recorded.</Text>
                </View>
              ) : (
                (inquiries || []).map((inq) => {
                  const statusStr = (inq.status || 'pending').toLowerCase();
                  const isPending = statusStr === 'pending' || statusStr === 'new';
                  const isAccepted = statusStr === 'accepted' || statusStr === 'completed';
                  const noteContent = inq.notes || inq.message || 'Ready for farm inspection.';

                  return (
                    <View key={inq.id} style={styles.inquiryCard}>
                      <View style={styles.cardTopRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.inqFarmer}>{inq.farmer_name || 'Farmer'}</Text>
                          <Text style={styles.inqCrop}>
                            🌾 {inq.crop_name} • {inq.quantity ?? 0} {inq.unit || 'quintal'}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.inqBadge,
                            isPending
                              ? styles.badgePending
                              : isAccepted
                              ? styles.badgeAccepted
                              : styles.badgeReviewed
                          ]}
                        >
                          <Text style={styles.inqBadgeText}>{(inq.status || 'NEW').toUpperCase()}</Text>
                        </View>
                      </View>

                      <Text style={styles.inqNotes}>📝 "{noteContent}"</Text>

                      <View style={styles.inqActionsRow}>
                        <TouchableOpacity
                          style={styles.callFarmerBtn}
                          onPress={() => {
                            if (inq.farmer_phone) Linking.openURL(`tel:${inq.farmer_phone}`);
                            else Alert.alert('Contact', 'No phone number provided.');
                          }}
                        >
                          <Text style={styles.callFarmerText}>📞 Call {inq.farmer_phone || 'Farmer'}</Text>
                        </TouchableOpacity>

                        {isPending && (
                          <View style={{ flexDirection: 'row', gap: 6 }}>
                            <TouchableOpacity
                              style={styles.acceptBtn}
                              onPress={() => handleUpdateInquiry(inq.id, 'accepted')}
                            >
                              <Text style={styles.acceptBtnText}>✓ Accept</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.rejectBtn}
                              onPress={() => handleUpdateInquiry(inq.id, 'rejected')}
                            >
                              <Text style={styles.rejectBtnText}>✕ Decline</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* TAB 3: INVENTORY */}
          {activeTab === 'inventory' && (
            <View>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionHeading}>Farm Store Catalog</Text>
                  <Text style={styles.sectionSub}>Available retail inputs & supplies</Text>
                </View>
              </View>

              {(products || []).length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyEmoji}>📦</Text>
                  <Text style={styles.emptyText}>No catalog products found.</Text>
                </View>
              ) : (
                (products || []).map((p) => (
                  <View key={p.id} style={styles.inventoryCard}>
                    <View style={styles.cardTopRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.prodName}>{p.name}</Text>
                        <Text style={styles.prodCategory}>{p.category} • {p.dealer_name || 'AgriME Verified Dealer'}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.prodPrice}>₹{Number(p.price || 0).toLocaleString('en-IN')}</Text>
                        <Text style={styles.prodUnit}>/{p.unit || 'unit'}</Text>
                      </View>
                    </View>
                    <View style={styles.stockRow}>
                      <Text style={styles.stockText}>
                        📦 In Stock: <Text style={{ fontWeight: '800', color: (p.stock || 0) > 10 ? '#15803d' : '#dc2626' }}>{p.stock ?? 0} units</Text>
                      </Text>
                      <Text style={styles.deliveryBadge}>
                        {p.delivery_available ? '🚚 Cash on Delivery' : '🏪 In-Store Pickup'}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* TAB 4: PROFILE & QUICK SERVICES */}
          {activeTab === 'profile' && (
            <View>
              <View style={styles.profileSection}>
                <Text style={styles.sectionHeading}>Dealer Business Details</Text>
                <View style={styles.profileDetailRow}>
                  <Text style={styles.profileField}>Business Name:</Text>
                  <Text style={styles.profileVal}>{user?.shop_name || 'AgriME Procurement Depot'}</Text>
                </View>
                <View style={styles.profileDetailRow}>
                  <Text style={styles.profileField}>Authorized Contact:</Text>
                  <Text style={styles.profileVal}>{user?.name || 'Authorized Dealer'} {user?.phone ? `(${user.phone})` : ''}</Text>
                </View>
                <View style={styles.profileDetailRow}>
                  <Text style={styles.profileField}>Registered District:</Text>
                  <Text style={styles.profileVal}>{user?.district || 'Tamil Nadu'}, {user?.state || 'Tamil Nadu'}</Text>
                </View>
                <View style={styles.profileDetailRow}>
                  <Text style={styles.profileField}>Hours:</Text>
                  <Text style={styles.profileVal}>Mon - Sat: 7:30 AM - 7:30 PM</Text>
                </View>
              </View>

              <View style={styles.servicesGrid}>
                <Text style={styles.sectionHeading}>Explore AgriME Platform</Text>
                <View style={styles.gridRow}>
                  <TouchableOpacity
                    style={styles.gridTile}
                    onPress={() => {
                      try {
                        navigation.navigate('CropPrices');
                      } catch {
                        navigation.navigate('MainTabs', { screen: 'CropPrices' });
                      }
                    }}
                  >
                    <Text style={styles.gridEmoji}>📊</Text>
                    <Text style={styles.gridTitle}>Mandi Prices</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.gridTile}
                    onPress={() => navigation.navigate('Predictions')}
                  >
                    <Text style={styles.gridEmoji}>📈</Text>
                    <Text style={styles.gridTitle}>Price Forecasts</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.gridTile}
                    onPress={() => {
                      try {
                        navigation.navigate('Machinery');
                      } catch {
                        navigation.navigate('MainTabs', { screen: 'Machinery' });
                      }
                    }}
                  >
                    <Text style={styles.gridEmoji}>🚜</Text>
                    <Text style={styles.gridTitle}>Machinery</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.gridTile}
                    onPress={() => navigation.navigate('Schemes')}
                  >
                    <Text style={styles.gridEmoji}>🏛️</Text>
                    <Text style={styles.gridTitle}>Govt Schemes</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => {
                  Alert.alert('Sign Out', 'Sign out of Dealer Portal?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Sign Out', style: 'destructive', onPress: signOut }
                  ]);
                }}
              >
                <Text style={styles.logoutText}>🚪 Sign Out</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* Add Quote Modal */}
      <Modal visible={addQuoteModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Procurement Quote</Text>
            <Text style={styles.modalSub}>Farmers in your district will be able to view this quote.</Text>

            <Text style={styles.inputLabel}>Crop Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Paddy (Ponni), Groundnut, Turmeric"
              value={newCropName}
              onChangeText={setNewCropName}
            />

            <Text style={styles.inputLabel}>Purchase Price (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2350"
              keyboardType="numeric"
              value={newPrice}
              onChangeText={setNewPrice}
            />

            <Text style={styles.inputLabel}>Price Unit</Text>
            <TextInput
              style={styles.input}
              placeholder="quintal, bag (75kg), kg"
              value={newUnit}
              onChangeText={setNewUnit}
            />

            <Text style={styles.inputLabel}>Quality Requirement</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Grade A, Moisture < 12%"
              value={newQuality}
              onChangeText={setNewQuality}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setAddQuoteModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleAddQuote}
                disabled={isSubmittingQuote}
              >
                {isSubmittingQuote ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.submitBtnText}>Publish Quote</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Price Modal */}
      <Modal visible={Boolean(editingQuote)} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Procurement Price</Text>
            <Text style={styles.modalSub}>
              Update buying price for {editingQuote?.crop_name} ({editingQuote?.price_unit})
            </Text>

            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={editPriceText}
              onChangeText={setEditPriceText}
              placeholder="Enter new price in ₹"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditingQuote(null)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSavePriceEdit}
              >
                <Text style={styles.submitBtnText}>Save Price</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

class DealerPortalErrorBoundary extends React.Component<
  { children: React.ReactNode; navigation?: any },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; navigation?: any }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('DealerPortalScreen caught runtime error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 36, marginBottom: 12 }}>🏪</Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', textAlign: 'center' }}>
            Dealer Portal Notice
          </Text>
          <Text style={{ fontSize: 12, color: '#64748B', marginTop: 6, textAlign: 'center' }}>
            {this.state.error?.message || 'A render issue occurred in the dealer portal.'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            <TouchableOpacity
              style={{ backgroundColor: '#15803d', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 }}
              onPress={() => this.setState({ hasError: false, error: null })}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Retry Portal</Text>
            </TouchableOpacity>
            {this.props.navigation && (
              <TouchableOpacity
                style={{ backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 }}
                onPress={() => this.props.navigation.navigate('MainTabs')}
              >
                <Text style={{ color: '#334155', fontWeight: '700' }}>🌾 Farmer View</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

export default function DealerPortalScreen(props: any) {
  return (
    <DealerPortalErrorBoundary navigation={props.navigation}>
      <DealerPortalScreenContent {...props} />
    </DealerPortalErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  shopTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a'
  },
  ownerSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  verifiedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803d'
  },
  browseAppBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  browseAppText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155'
  },
  switchRoleBtn: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  switchRoleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d'
  },
  kpiContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0'
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center'
  },
  kpiVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a'
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 2
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0'
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderColor: 'transparent'
  },
  tabBtnActive: {
    borderColor: '#15803d'
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b'
  },
  tabBtnTextActive: {
    color: '#15803d'
  },
  contentScroll: {
    padding: 16,
    paddingBottom: 40
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a'
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1
  },
  actionBtn: {
    backgroundColor: '#15803d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 8
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center'
  },
  quoteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  cropTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a'
  },
  cropCategory: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  priceVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803d'
  },
  priceUnit: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d'
  },
  qualityText: {
    fontSize: 12,
    color: '#334155',
    marginTop: 8
  },
  termsText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 3
  },
  quoteFooter: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statusLive: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d'
  },
  editPriceBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  editPriceBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155'
  },
  inquiryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  inqFarmer: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a'
  },
  inqCrop: {
    fontSize: 12,
    color: '#15803d',
    fontWeight: '700',
    marginTop: 2
  },
  inqBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  badgePending: {
    backgroundColor: '#fef3c7'
  },
  badgeAccepted: {
    backgroundColor: '#dcfce7'
  },
  badgeReviewed: {
    backgroundColor: '#e0e7ff'
  },
  inqBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0f172a'
  },
  inqNotes: {
    fontSize: 12,
    color: '#475569',
    fontStyle: 'italic',
    marginTop: 8
  },
  inqActionsRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  callFarmerBtn: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe'
  },
  callFarmerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1d4ed8'
  },
  acceptBtn: {
    backgroundColor: '#15803d',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6
  },
  acceptBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff'
  },
  rejectBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6
  },
  rejectBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#dc2626'
  },
  inventoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  prodName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a'
  },
  prodCategory: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  prodPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a'
  },
  prodUnit: {
    fontSize: 10,
    color: '#64748b'
  },
  stockRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  stockText: {
    fontSize: 12,
    color: '#475569'
  },
  deliveryBadge: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600'
  },
  profileSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16
  },
  profileDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9'
  },
  profileField: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600'
  },
  profileVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a'
  },
  servicesGrid: {
    marginBottom: 20
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10
  },
  gridTile: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  gridEmoji: {
    fontSize: 24,
    marginBottom: 4
  },
  gridTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f172a'
  },
  logoutBtn: {
    backgroundColor: '#fee2e2',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fca5a5'
  },
  logoutText: {
    color: '#b91c1c',
    fontWeight: '800',
    fontSize: 13
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a'
  },
  modalSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 14
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10,
    marginBottom: 4
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a'
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9'
  },
  cancelBtnText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 12
  },
  submitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#15803d'
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12
  }
});
