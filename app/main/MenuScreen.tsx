import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Button, FAB, TextInput, Portal, Dialog } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { dishApi } from '../../services/api';
import type { Dish, DishCategory, CreateDishRequest } from '../../types';
import { CategoryLabels, CategoryColors } from '../../types';

const API_BASE_URL = 'http://8.135.17.245:18001';

export default function MenuScreen() {
  const { user } = useAuth();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);

  // 表单状态
  const [dishName, setDishName] = useState('');
  const [dishDescription, setDishDescription] = useState('');
  const [dishCategory, setDishCategory] = useState<DishCategory>('hot');
  const [dishImage, setDishImage] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';
  const categories: DishCategory[] = ['hot', 'cold', 'soup', 'staple', 'dessert', 'drink'];

  const loadData = async () => {
    try {
      const dishesData = await dishApi.getDishes();
      setDishes(dishesData);
    } catch (error) {
      console.error('Failed to load menu:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const resetForm = () => {
    setDishName('');
    setDishDescription('');
    setDishCategory('hot');
    setDishImage(null);
    setEditingDish(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (dish: Dish) => {
    setEditingDish(dish);
    setDishName(dish.name);
    setDishDescription(dish.description || '');
    setDishCategory(dish.category);
    setDishImage(dish.image || null);
    setModalVisible(true);
  };

  const handleSelectImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800,
    });

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.uri) {
        setDishImage(asset.uri);
      }
    }
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: 'image/jpeg',
        name: 'image.jpg',
      } as any);

      const response = await fetch(`${API_BASE_URL}/api/upload/image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        return `${API_BASE_URL}${data.url}`;
      }
      return null;
    } catch (error) {
      console.error('Upload image failed:', error);
      return null;
    }
  };

  const handleSaveDish = async () => {
    if (!dishName.trim()) {
      Alert.alert('提示', '请输入菜品名称');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = dishImage;
      
      // 如果选择了新图片，先上传
      if (dishImage && dishImage.startsWith('file://')) {
        const uploadedUrl = await uploadImage(dishImage);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      if (editingDish) {
        await dishApi.updateDish(editingDish.id, {
          name: dishName.trim(),
          description: dishDescription.trim(),
          category: dishCategory,
          image: imageUrl,
        });
        Alert.alert('成功', '菜品已更新');
      } else {
        await dishApi.createDish({
          name: dishName.trim(),
          description: dishDescription.trim(),
          category: dishCategory,
          image: imageUrl,
        });
        Alert.alert('成功', '菜品已添加');
      }

      setModalVisible(false);
      resetForm();
      await loadData();
    } catch (error: any) {
      Alert.alert('错误', error.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDish = async (dish: Dish) => {
    Alert.alert(
      '确认删除',
      `确定要删除"${dish.name}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await dishApi.deleteDish(dish.id);
              Alert.alert('成功', '菜品已删除');
              await loadData();
            } catch (error: any) {
              Alert.alert('错误', error.message || '删除失败');
            }
          },
        },
      ]
    );
  };

  const renderDishItem = ({ item }: { item: Dish }) => (
    <Card style={styles.dishCard}>
      <Card.Content>
        <View style={styles.dishHeader}>
          <View style={styles.dishInfo}>
            {item.image && (
              <Image source={{ uri: item.image }} style={styles.dishImage} />
            )}
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

          {isAdmin && (
            <View style={styles.dishActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => openEditModal(item)}
              >
                <MaterialCommunityIcons name="pencil" size={20} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteDish(item)}
              >
                <MaterialCommunityIcons name="delete" size={20} color={Colors.error} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* 标题栏 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>家庭菜谱</Text>
        <Text style={styles.headerSubtitle}>共 {dishes.length} 道菜品</Text>
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
            <MaterialCommunityIcons name="book-open" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>暂无菜谱</Text>
            {isAdmin ? (
              <Text style={styles.emptySubtext}>点击右下角添加菜品</Text>
            ) : (
              <Text style={styles.emptySubtext}>请联系管理员添加菜谱</Text>
            )}
          </View>
        }
      />

      {/* 管理员添加按钮 */}
      {isAdmin && (
        <FAB
          style={styles.fab}
          icon="plus"
          onPress={openAddModal}
          color="#FFFFFF"
        />
      )}

      {/* 添加/编辑菜品弹窗 */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingDish ? '编辑菜品' : '添加菜品'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* 图片选择 */}
            <TouchableOpacity style={styles.imagePicker} onPress={handleSelectImage}>
              {dishImage ? (
                <Image source={{ uri: dishImage }} style={styles.selectedImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <MaterialCommunityIcons name="camera" size={40} color={Colors.textMuted} />
                  <Text style={styles.imagePlaceholderText}>点击选择图片</Text>
                </View>
              )}
            </TouchableOpacity>

            <TextInput
              label="菜品名称"
              value={dishName}
              onChangeText={setDishName}
              mode="outlined"
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
            />

            <TextInput
              label="描述（可选）"
              value={dishDescription}
              onChangeText={setDishDescription}
              mode="outlined"
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
              multiline
              numberOfLines={2}
            />

            <Text style={styles.label}>分类</Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryOption,
                    dishCategory === cat && {
                      backgroundColor: CategoryColors[cat] + '20',
                      borderColor: CategoryColors[cat],
                    },
                  ]}
                  onPress={() => setDishCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryOptionText,
                      dishCategory === cat && { color: CategoryColors[cat] },
                    ]}
                  >
                    {CategoryLabels[cat]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              mode="contained"
              onPress={handleSaveDish}
              loading={loading}
              disabled={loading}
              style={styles.saveButton}
              labelStyle={styles.saveButtonLabel}
            >
              {editingDish ? '保存修改' : '添加菜品'}
            </Button>
          </View>
        </View>
      </Modal>
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
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 4,
  },
  dishList: {
    padding: 16,
    gap: 12,
  },
  dishCard: {
    backgroundColor: Colors.surface,
  },
  dishHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dishInfo: {
    flex: 1,
  },
  dishImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
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
  dishActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  imagePicker: {
    width: '100%',
    height: 150,
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
  },
  input: {
    backgroundColor: Colors.surface,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
    fontWeight: '500',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryOptionText: {
    fontSize: 13,
    color: Colors.textLight,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 8,
    marginTop: 8,
  },
  saveButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});