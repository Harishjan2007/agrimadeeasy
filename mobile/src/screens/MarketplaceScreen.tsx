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
  Alert
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { MobileDataService, MobileProduceListing } from '../services/dataService';

export default function MarketplaceScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [listings, setListings] = useState<MobileProduceListing[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  // New Listing Form Fields
  const [cropName, setCropName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('bags (75kg)');
  const [askingPrice, setAskingPrice] = useState('');
  const [location, setLocation] = useState(user.location || 'Thanjavur');

  useEffect(() => {
    MobileDataService.getProduceListings().then(setListings);
  }, []);

  const handleCreateListing = () => {
    if (!cropName || !quantity || !askingPrice) {
      Alert.alert('Required Fields', 'Please enter crop name, quantity, and asking price.');
      return;
    }

    const newListing: MobileProduceListing = {
      id: 'lst-' + Date.now(),
      crop_name: cropName.trim(),
      quantity: Number(quantity),
      unit: unit,
      asking_price: Number(askingPrice),
      price_unit: 'bag',
      location: location.trim(),
      farmer_name: user.name,
      farmer_phone: user.phone
    };

    setListings([newListing, ...listings]);
    setModalVisible(false);
    setCropName('');
    setQuantity('');
    setAskingPrice('');
    Alert.alert('Produce Posted', 'Your produce listing is now visible to wholesale buyers and traders.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <View>
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

      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cropTitle}>{item.crop_name}</Text>
                <Text style={styles.farmerSub}>
                  👨‍🌾 {item.farmer_name} • 📍 {item.location}
                </Text>
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
                ₹{item.asking_price} / {item.price_unit}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.contactBtn}
              onPress={() => Linking.openURL(`tel:${item.farmer_phone}`)}
            >
              <Text style={styles.contactBtnText}>
                📞 {t('contactFarmer')} ({item.farmer_phone})
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Post Produce Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeading}>{t('newListing')}</Text>

            <TextInput
              style={styles.input}
              placeholder="Crop name & variety (e.g. ADT-45 Paddy)"
              value={cropName}
              onChangeText={setCropName}
            />

            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                placeholder="Quantity (e.g. 50)"
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Unit (e.g. quintals / bags)"
                value={unit}
                onChangeText={setUnit}
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Asking price in ₹ (e.g. 2400)"
              value={askingPrice}
              onChangeText={setAskingPrice}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Village or farm pickup location"
              value={location}
              onChangeText={setLocation}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>{t('close')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitModalBtn}
                onPress={handleCreateListing}
              >
                <Text style={styles.submitModalBtnText}>Publish Listing</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  listContainer: {
    padding: 16
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20
  },
  modalHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16
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
    marginTop: 10
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
  submitModalBtnText: {
    color: '#ffffff',
    fontWeight: '800'
  }
});
