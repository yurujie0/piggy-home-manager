import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Button } from 'react-native-paper';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { familyApi, orderApi, dishApi } from '../../services/api';
import type { FamilyMember, SelectedDish, Dish } from '../../types';

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
}

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { user, family } = useAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedDishes, setSelectedDishes] = useState<SelectedDish[]>([]);
  const [menuDishes, setMenuDishes] = useState<Dish[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = user?.role === 'admin';

  const loadData = async () => {
    try {
      const [membersData, selectedData, menuData] = await Promise.all([
        familyApi.getMembers(),
        orderApi.getSelectedDishes(),
        dishApi.getDishes(),
      ]);
      setMembers(membersData);
      setSelectedDishes(selectedData);
      setMenuDishes(menuData);
    } catch (error) {
      console.error('Failed to load home data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* 顶部欢迎区域 */}
      <View style={styles.header}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.greeting}>👋 欢迎回来</Text>
          <Text style={styles.nickname}>{user?.nickname}</Text>
        </View>
        <View style={styles.familyBadge}>
          <MaterialCommunityIcons name="home" size={16} color={Colors.primary} />
          <Text style={styles.familyName}>{family?.name}</Text>
        </View>
      </View>

      {/* 快捷统计卡片 */}
      <View style={styles.statsContainer}>
        <StatCard
          icon="food"
          title="今日点餐"
          value={selectedDishes.length.toString()}
          subtitle="道菜品"
          color={Colors.primary}
        />
        <StatCard
          icon="book-open"
          title="家庭菜谱"
          value={menuDishes.length.toString()}
          subtitle="道菜品"
          color={Colors.secondary}
        />
        <StatCard
          icon="account-group"
          title="家庭成员"
          value={(members.length + 1).toString()}
          subtitle="位成员"
          color={Colors.info}
        />
      </View>

      {/* 功能快捷入口 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>快捷功能</Text>
        <View style={styles.quickActions}>
          <QuickActionButton
            icon="food"
            title="去点餐"
            subtitle="选择今天想吃的菜"
            color={Colors.primary}
            onPress={() => onNavigate('order')}
          />
          <QuickActionButton
            icon="format-list-checks"
            title="查看已选"
            subtitle="看看全家想吃什么"
            color={Colors.secondary}
            onPress={() => onNavigate('order')}
          />
        </View>
      </View>

      {/* 管理员专属功能 */}
      {isAdmin && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>管理员功能</Text>
          <View style={styles.adminActions}>
            <AdminActionButton
              icon="account-group"
              title="成员管理"
              subtitle="添加/删除成员"
              onPress={() => {}}
            />
            <AdminActionButton
              icon="plus-circle"
              title="添加菜谱"
              subtitle="新增家庭菜品"
              onPress={() => onNavigate('menu')}
            />
            <AdminActionButton
              icon="pencil"
              title="编辑菜谱"
              subtitle="修改菜品信息"
              onPress={() => onNavigate('menu')}
            />
            <AdminActionButton
              icon="cog"
              title="家庭设置"
              subtitle="修改家庭信息"
              onPress={() => {}}
            />
          </View>
        </View>
      )}

      {/* 今日点餐预览 */}
      {selectedDishes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>今日已选菜品</Text>
          <Card style={styles.previewCard}>
            <Card.Content>
              {selectedDishes.slice(0, 5).map((dish, index) => (
                <View key={dish.id} style={styles.selectedDishItem}>
                  <Text style={styles.dishName}>
                    {index + 1}. {dish.dishName}
                  </Text>
                  <View style={styles.dishInfo}>
                    <Text style={styles.selectedBy}>@{dish.selectedByName}</Text>
                    <Text style={styles.dishQuantity}>x{dish.quantity}</Text>
                  </View>
                </View>
              ))}
              {selectedDishes.length > 5 && (
                <Text style={styles.moreText}>
                  还有 {selectedDishes.length - 5} 道菜品...
                </Text>
              )}
            </Card.Content>
          </Card>
        </View>
      )}

      {/* 邀请码展示（仅管理员可见） */}
      {isAdmin && family && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>家庭邀请码</Text>
          <Card style={styles.inviteCodeCard}>
            <Card.Content>
              <Text style={styles.inviteCodeLabel}>邀请家人加入</Text>
              <View style={styles.inviteCodeContainer}>
                <Text style={styles.inviteCode}>{family.inviteCode}</Text>
              </View>
              <Text style={styles.inviteCodeHint}>
                将此邀请码分享给家人，他们可以用此码加入家庭
              </Text>
            </Card.Content>
          </Card>
        </View>
      )}
    </ScrollView>
  );
}

// 统计卡片组件
function StatCard({
  icon,
  title,
  value,
  subtitle,
  color,
}: {
  icon: string;
  title: string;
  value: string;
  subtitle: string;
  color: string;
}) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
      <Text style={styles.statTitle}>{title}</Text>
      <View style={styles.statValueContainer}>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        <Text style={styles.statSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

// 快捷操作按钮组件
function QuickActionButton({
  icon,
  title,
  subtitle,
  color,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.quickActionButton, { borderColor: color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={icon} size={24} color="#FFFFFF" />
      </View>
      <View style={styles.quickActionText}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

// 管理员操作按钮组件
function AdminActionButton({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.adminActionButton}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons name={icon} size={20} color={Colors.primary} />
      <View style={styles.adminActionText}>
        <Text style={styles.adminActionTitle}>{title}</Text>
        <Text style={styles.adminActionSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.surface,
    padding: 24,
    paddingTop: 48,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  welcomeContainer: {
    marginBottom: 12,
  },
  greeting: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 4,
  },
  nickname: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  familyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight + '20',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  familyName: {
    fontSize: 14,
    color: Colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statTitle: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 8,
    marginBottom: 4,
  },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginLeft: 4,
  },
  section: {
    padding: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  quickActions: {
    gap: 12,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    flex: 1,
    marginLeft: 12,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 13,
    color: Colors.textLight,
  },
  adminActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  adminActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    width: '48%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  adminActionText: {
    marginLeft: 8,
    flex: 1,
  },
  adminActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  adminActionSubtitle: {
    fontSize: 12,
    color: Colors.textLight,
  },
  previewCard: {
    backgroundColor: Colors.surface,
  },
  selectedDishItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  dishName: {
    fontSize: 15,
    color: Colors.text,
    flex: 1,
  },
  dishInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedBy: {
    fontSize: 12,
    color: Colors.primary,
    marginRight: 8,
  },
  dishQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  moreText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  inviteCodeCard: {
    backgroundColor: Colors.surface,
  },
  inviteCodeLabel: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
  },
  inviteCodeContainer: {
    backgroundColor: Colors.primaryLight + '20',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  inviteCode: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 4,
  },
  inviteCodeHint: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});