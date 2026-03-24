import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Button, FAB } from 'react-native-paper';
// import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { dishApi, orderApi } from '../../services/api';
import type { Dish, SelectedDish, DishCategory } from '../../types';
import { CategoryLabels, CategoryColors } from '../../types';

interface OrderScreenProps {
  onNavigate?: (screen: string) => void;
}

export default function OrderScreen({ onNavigate }: OrderScreenProps) {
  const { user } = useAuth();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [selectedDishes, setSelectedDishes] = useState<SelectedDish[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<DishCategory | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const categories: (DishCategory | 'all')[] = ['all', 'hot', 'cold', 'soup', 'staple', 'dessert', 'drink'];

  const loadData = async () => {
    try {
      if (!user?.familyId) {
        console.log('User not in family, skipping load');
        setDishes([]);
        setSelectedDishes([]);
        return;
      }
      const [dishesData, selectedData] = await Promise.all([
        dishApi.getDishes(selectedCategory === 'all' ? undefined : selectedCategory),
        orderApi.getSelectedDishes(user.familyId),
      ]);
      setDishes(dishesData);
      setSelectedDishes(selectedData);
    } catch (error) {
      console.error('Failed to load order data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // useFocusEffect(
  //   useCallback(() => {
  //     loadData();
  //   }, [selectedCategory])
  // );
  
  // 使用 useEffect 替代 useFocusEffect
  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const handleSelectDish = async (dish: Dish) => {
    try {
      if (!user?.familyId) {
        Alert.alert('错误', '您还未加入家庭');
        return;
      }
      setLoading(true);
      await orderApi.selectDish({
        dishId: dish.id,
        quantity: 1,
      }, user.familyId);
      await loadData();
    } catch (error: any) {
      Alert.alert('错误', error.message || '选择菜品失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (selectedDish: SelectedDish, newQuantity: number) => {
    try {
      if (newQuantity <= 0) {
        await orderApi.unselectDish(selectedDish.id);
      } else {
        await orderApi.updateSelectedQuantity(selectedDish.id, newQuantity);
      }
      await loadData();
    } catch (error: any) {
      Alert.alert('错误', error.message || '更新失败');
    }
  };

  const getSelectedQuantity = (dishId: string) => {
    const selected = selectedDishes.find(sd => sd.dishId === dishId && sd.selectedBy === user?.id);
    return selected ? selected.quantity : 0;
  };

  const getTotalSelectedCount = () => {
    return selectedDishes.reduce((sum, sd) => sum + sd.quantity, 0);
  };

  const renderCategoryButton = (category: DishCategory | 'all') => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === category && styles.categoryButtonActive,
      ]}
      onPress={() => setSelectedCategory(category)}
    >
      <Text
        style={[
          styles.categoryButtonText,
          selectedCategory === category && styles.categoryButtonTextActive,
        ]}
      >
        {category === 'all' ? '全部' : CategoryLabels[category]}
      </Text>
    </TouchableOpacity>
  );

  const renderDishItem = ({ item }: { item: Dish }) => {
    const selectedQuantity = getSelectedQuantity(item.id);
    const isSelected = selectedQuantity > 0;

    return (
      <Card style={styles.dishCard}>
        <Card.Content>
          <View style={styles.dishHeader}>
            <View style={styles.dishInfo}>
              <Text style={styles.dishName}>{item.name}</Text>
              {item.description && (
                <Text style={styles.dishDescription}>{item.description}</Text>
              )}
              <View style={styles.dishTags}>
                <View
                  style={[
                    styles.categoryTag,
                    { backgroundColor: CategoryColors[item.category] + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryTagText,
                      { color: CategoryColors[item.category] },
                    ]}
                  >
                    {CategoryLabels[item.category]}
                  </Text>
                </View>

              </View>
            </View>
          </View>

          {isSelected ? (
            <View style={styles.quantityControl}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => {
                  const selected = selectedDishes.find(sd => sd.dishId === item.id && sd.selectedBy === user?.id);
                  if (selected) {
                    handleUpdateQuantity(selected, selectedQuantity - 1);
                  }
                }}
              >
                <MaterialCommunityIcons name="minus" size={20} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{selectedQuantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => {
                  const selected = selectedDishes.find(sd => sd.dishId === item.id && sd.selectedBy === user?.id);
                  if (selected) {
                    handleUpdateQuantity(selected, selectedQuantity + 1);
                  }
                }}
              >
                <MaterialCommunityIcons name="plus" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <Button
              mode="contained"
              onPress={() => handleSelectDish(item)}
              loading={loading}
              style={styles.selectButton}
              labelStyle={styles.selectButtonLabel}
            >
              想吃
            </Button>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* 今日已选统计 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>今日点餐</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="food" size={20} color={Colors.primary} />
            <Text style={styles.statValue}>{getTotalSelectedCount()}</Text>
            <Text style={styles.statLabel}>道菜品</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="account-group" size={20} color={Colors.secondary} />
            <Text style={styles.statValue}>
              {new Set(selectedDishes.map(sd => sd.selectedBy)).size}
            </Text>
            <Text style={styles.statLabel}>人参与</Text>
          </View>
        </View>
      </View>

      {/* 分类筛选 */}
      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          renderItem={({ item }) => renderCategoryButton(item)}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoryList}
        />
      </View>

      {/* 菜品列表 */}
      <FlatList
        data={dishes}
        renderItem={renderDishItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.dishList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="food-off" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>暂无菜品</Text>
            <Text style={styles.emptySubtext}>管理员可以添加菜谱</Text>
          </View>
        }
      />

      {/* 查看已选浮动按钮 */}
      {selectedDishes.length > 0 && (
        <FAB
          style={styles.fab}
          icon="format-list-checks"
          label={`已选 ${getTotalSelectedCount()}`}
          onPress={() => {}}
          color="#FFFFFF"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textLight,
  },
  categoryContainer: {
    paddingVertical: 12,
  },
  categoryList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    color: Colors.text,
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dishList: {
    padding: 16,
    gap: 12,
  },
  dishCard: {
    backgroundColor: Colors.surface,
    marginBottom: 12,
  },
  dishHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dishInfo: {
    flex: 1,
  },
  dishName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  dishDescription: {
    fontSize: 13,
    color: Colors.textLight,
    marginBottom: 8,
  },
  dishTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tag: {
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 12,
    color: Colors.textLight,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    minWidth: 30,
    textAlign: 'center',
  },
  selectButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  selectButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textLight,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: Colors.primary,
  },
});