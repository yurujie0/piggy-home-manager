import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Button, FAB, TextInput } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { dishApi, uploadApi } from '../../services/api';
import type { Dish, DishCategory, CreateDishRequest } from '../../types';
import { CategoryLabels, CategoryColors } from '../../types';

export default function MenuScreen() {
  const { user } = useAuth();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // 表单状态
  const [dishName, setDishName] = useState('');
  const [dishDescription, setDishDescription] = useState('');
  const [dishCategory, setDishCategory] = useState<DishCategory>('hot');
  const [dishImage, setDishImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await dishApi.getDishes();
      setDishes(data);
    } catch (error: any) {
      console.log('[MenuScreen] Error:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const resetForm = () => {
    setDishName('');
    setDishDescription('');
    setDishCategory('hot');
    setDishImage(null);
  };

  const openModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const handlePickImage = async () => {
    try {
      // 请求权限
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('提示', '需要访问相册权限才能选择图片');
        return;
      }

      // 打开图片选择器
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        setUploadingImage(true);
        
        try {
          // 上传图片到服务器
          const imageUrl = await uploadApi.uploadImage(selectedImage.uri);
          setDishImage(imageUrl);
        } catch (error: any) {
          Alert.alert('上传失败', error.message || '图片上传失败，请重试');
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (error: any) {
      Alert.alert('错误', '选择图片时出错: ' + error.message);
    }
  };

  const handleRemoveImage = () => {
    setDishImage(null);
  };

  const handleSaveDish = async () => {
    if (!dishName.trim()) {
      Alert.alert('提示', '请输入菜品名称');
      return;
    }

    try {
      setLoading(true);
      const dishData: CreateDishRequest = {
        name: dishName.trim(),
        description: dishDescription.trim() || undefined,
        category: dishCategory,
        image: dishImage || undefined,
      };

      await dishApi.createDish(dishData);
      Alert.alert('成功', '菜品添加成功');
      closeModal();
      loadData();
    } catch (error: any) {
      Alert.alert('错误', error.message || '保存菜品失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDish = (dish: Dish) => {
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
              Alert.alert('成功', '菜品删除成功');
              loadData();
            } catch (error: any) {
              Alert.alert('错误', error.message || '删除菜品失败');
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
            <Text style={styles.dishName}>{item.name}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: CategoryColors[item.category] }]}>
              <Text style={styles.categoryText}>{CategoryLabels[item.category]}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => handleDeleteDish(item)} style={styles.deleteButton}>
            <MaterialCommunityIcons name="delete" size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>
        {item.image && (
          <Image source={{ uri: item.image }} style={styles.dishImage} resizeMode="cover" />
        )}
        {item.description && (
          <Text style={styles.dishDescription}>{item.description}</Text>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>菜谱管理</Text>
        <Text style={styles.subtitle}>共 {dishes.length} 道菜品</Text>
      </View>

      <FlatList
        data={dishes}
        renderItem={renderDishItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="book-open" size={64} color={Colors.textLight} />
            <Text style={styles.emptyText}>暂无菜品</Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={openModal}
        color="#FFFFFF"
      />

      {/* 添加菜品弹窗 - 使用 React Native Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>添加菜品</Text>
              
              {/* 图片上传区域 */}
              <Text style={styles.categoryLabel}>菜品图片</Text>
              <View style={styles.imageUploadContainer}>
                {dishImage ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: dishImage }} style={styles.imagePreview} resizeMode="cover" />
                    <TouchableOpacity 
                      style={styles.removeImageButton} 
                      onPress={handleRemoveImage}
                    >
                      <MaterialCommunityIcons name="close-circle" size={24} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.uploadButton} 
                    onPress={handlePickImage}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <ActivityIndicator color={Colors.primary} />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="camera-plus" size={32} color={Colors.primary} />
                        <Text style={styles.uploadButtonText}>点击上传图片</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
              
              <TextInput
                label="菜品名称 *"
                value={dishName}
                onChangeText={setDishName}
                style={styles.input}
                mode="outlined"
              />
              
              <TextInput
                label="菜品描述"
                value={dishDescription}
                onChangeText={setDishDescription}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={3}
              />
              
              <Text style={styles.categoryLabel}>菜品分类 *</Text>
              <View style={styles.categoryContainer}>
                {(['hot', 'cold', 'soup', 'staple', 'drink'] as DishCategory[]).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton,
                      dishCategory === cat && { backgroundColor: CategoryColors[cat] },
                    ]}
                    onPress={() => setDishCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        dishCategory === cat && { color: '#FFFFFF' },
                      ]}
                    >
                      {CategoryLabels[cat]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalButtons}>
                <Button 
                  onPress={closeModal} 
                  style={styles.modalButton}
                  mode="outlined"
                >
                  取消
                </Button>
                <Button 
                  onPress={handleSaveDish} 
                  loading={loading} 
                  style={styles.modalButton}
                  mode="contained"
                >
                  添加
                </Button>
              </View>
            </View>
          </ScrollView>
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
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
  },
  dishCard: {
    marginBottom: 12,
    backgroundColor: Colors.card,
  },
  dishHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dishInfo: {
    flex: 1,
  },
  dishName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  dishDescription: {
    fontSize: 14,
    color: Colors.textLight,
    marginTop: 8,
  },
  dishImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 12,
  },
  imageUploadContainer: {
    marginBottom: 12,
  },
  uploadButton: {
    height: 120,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  uploadButtonText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textLight,
  },
  imagePreviewContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.card,
    borderRadius: 12,
  },
  deleteButton: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: Colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textLight,
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
    backgroundColor: Colors.background,
  },
  categoryLabel: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
    marginTop: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryButtonText: {
    fontSize: 12,
    color: Colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});
