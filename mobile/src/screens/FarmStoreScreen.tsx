import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  dealer: string;
}

const STORE_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Certified CR-1009 Sub-1 Paddy Seeds',
    category: 'Seeds',
    price: 950,
    stock: 45,
    unit: '30kg bag',
    dealer: 'Cauvery Agro Fertilizers'
  },
  {
    id: 'prod-2',
    name: 'Neem-Coated Urea (Iffco)',
    category: 'Fertilizers',
    price: 266,
    stock: 120,
    unit: '45kg bag',
    dealer: 'Cauvery Agro Fertilizers'
  },
  {
    id: 'prod-3',
    name: 'Bio-Organic Trichoderma Viride (1kg)',
    category: 'Bio-Inputs',
    price: 180,
    stock: 60,
    unit: 'packet',
    dealer: 'Kongu Bio-Inputs'
  },
  {
    id: 'prod-4',
    name: 'Drip Irrigation Inline Lateral 16mm (400m)',
    category: 'Tools',
    price: 2450,
    stock: 15,
    unit: 'bundle',
    dealer: 'Jain Irrigation Dealership'
  }
];

export default function FarmStoreScreen() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const categories = ['All', 'Seeds', 'Fertilizers', 'Bio-Inputs', 'Tools'];

  const filtered = STORE_PRODUCTS.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === 'All' || p.category === category;
    return matchesSearch && matchesCat;
  });

  const handleOrder = (product: Product) => {
    Alert.alert(
      'Order Placed (COD / Dealer Pickup)',
      `Your reservation for "${product.name}" (₹${product.price}) has been notified to ${product.dealer}. Payment is settled via Cash-on-Delivery or upon in-person pickup.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Honest Transparency Notice Banner */}
      <View style={styles.noticeBanner}>
        <Text style={styles.noticeTitle}>🛡️ Direct Dealer Settlement</Text>
        <Text style={styles.noticeText}>{t('storeNotice')}</Text>
      </View>

      <View style={styles.topSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search farm inputs, seeds, fertilizers..."
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
              <Text
                style={[
                  styles.catTabText,
                  category === item && styles.catTabTextActive
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.prodName}>{item.name}</Text>
                <Text style={styles.dealerName}>Store: {item.dealer}</Text>
              </View>
              <View style={styles.catBadge}>
                <Text style={styles.catBadgeText}>{item.category}</Text>
              </View>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceVal}>
                ₹{item.price} <Text style={styles.unitText}>/ {item.unit}</Text>
              </Text>
              <Text style={styles.stockText}>In Stock: {item.stock}</Text>
            </View>

            <TouchableOpacity
              style={styles.orderBtn}
              onPress={() => handleOrder(item)}
            >
              <Text style={styles.orderBtnText}>Reserve for Pickup / COD</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
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
  topSection: {
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
  prodName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a'
  },
  dealerName: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  catBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569'
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12
  },
  priceVal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#15803d'
  },
  unitText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600'
  },
  stockText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600'
  },
  orderBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14
  },
  orderBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800'
  }
});
