import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Button, Divider, Dialog, Portal, TextInput } from 'react-native-paper';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { familyApi } from '../../services/api';

export default function ProfileScreen() {
  const { user, family, logout, setFamily } = useAuth();
  const [inviteCode, setInviteCode] = useState(family?.inviteCode || '');
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [refreshingCode, setRefreshingCode] = useState(false);

  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    Alert.alert(
      '确认退出',
      '确定要退出登录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '退出',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleRefreshInviteCode = async () => {
    if (!isAdmin) return;

    Alert.alert(
      '刷新邀请码',
      '刷新后旧邀请码将失效，确定要继续吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '刷新',
          onPress: async () => {
            setRefreshingCode(true);
            try {
              const newCode = await familyApi.refreshInviteCode();
              setInviteCode(newCode);
              if (family) {
                setFamily({ ...family, inviteCode: newCode });
              }
              Alert.alert('成功', '邀请码已刷新');
            } catch (error: any) {
              Alert.alert('错误', error.message || '刷新失败');
            } finally {
              setRefreshingCode(false);
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    ...(isAdmin
      ? [
          {
            icon: 'account-group',
            title: '成员管理',
            subtitle: '管理家庭成员',
            onPress: () => {},
          },
          {
            icon: 'home',
            title: '家庭设置',
            subtitle: '修改家庭信息',
            onPress: () => {},
          },
        ]
      : []),
    {
      icon: 'bell',
      title: '消息通知',
      subtitle: '设置通知偏好',
      onPress: () => {},
    },
    {
      icon: 'help-circle',
      title: '帮助与反馈',
      subtitle: '常见问题、意见反馈',
      onPress: () => {},
    },
    {
      icon: 'information',
      title: '关于',
      subtitle: '版本信息、隐私政策',
      onPress: () => {},
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* 用户信息卡片 */}
      <View style={styles.header}>
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>🐷</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.nickname}</Text>
            <View style={styles.roleBadge}>
              <MaterialCommunityIcons
                name={isAdmin ? 'shield-account' : 'account'}
                size={14}
                color={isAdmin ? Colors.primary : Colors.textLight}
              />
              <Text
                style={[
                  styles.roleText,
                  isAdmin && { color: Colors.primary },
                ]}
              >
                {isAdmin ? '管理员' : '成员'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 家庭信息卡片 */}
      <Card style={styles.familyCard}>
        <Card.Content>
          <View style={styles.familyHeader}>
            <MaterialCommunityIcons name="home" size={24} color={Colors.primary} />
            <Text style={styles.familyName}>{family?.name}</Text>
          </View>

          <Divider style={styles.divider} />

          {/* 邀请码区域 */}
          <View style={styles.inviteCodeSection}>
            <Text style={styles.inviteCodeLabel}>家庭邀请码</Text>
            <View style={styles.inviteCodeRow}>
              <View style={styles.inviteCodeDisplay}>
                <Text style={styles.inviteCode}>
                  {showInviteCode ? inviteCode : '••••••'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => setShowInviteCode(!showInviteCode)}
              >
                <MaterialCommunityIcons
                  name={showInviteCode ? 'eye-off' : 'eye'}
                  size={20}
                  color={Colors.primary}
                />
              </TouchableOpacity>
            </View>

            {isAdmin && (
              <Button
                mode="text"
                onPress={handleRefreshInviteCode}
                loading={refreshingCode}
                style={styles.refreshButton}
                labelStyle={styles.refreshButtonLabel}
              >
                刷新邀请码
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* 菜单列表 */}
      <View style={styles.menuSection}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.menuItem,
              index === menuItems.length - 1 && styles.menuItemLast,
            ]}
            onPress={item.onPress}
            activeOpacity={0.8}
          >
            <View style={styles.menuIconContainer}>
              <MaterialCommunityIcons
                name={item.icon}
                size={22}
                color={Colors.primary}
              />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={Colors.textMuted}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* 退出登录按钮 */}
      <Button
        mode="outlined"
        onPress={handleLogout}
        style={styles.logoutButton}
        labelStyle={styles.logoutButtonLabel}
      >
        退出登录
      </Button>

      {/* 版本信息 */}
      <Text style={styles.versionText}>小猪管家 v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.primary,
    padding: 24,
    paddingTop: 48,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarEmoji: {
    fontSize: 32,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  familyCard: {
    margin: 16,
    marginTop: -12,
    backgroundColor: Colors.surface,
    elevation: 4,
  },
  familyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  familyName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  divider: {
    marginVertical: 16,
    backgroundColor: Colors.divider,
  },
  inviteCodeSection: {
    alignItems: 'center',
  },
  inviteCodeLabel: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
  },
  inviteCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inviteCodeDisplay: {
    backgroundColor: Colors.primaryLight + '20',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  inviteCode: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    letterSpacing: 4,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    marginTop: 12,
  },
  refreshButtonLabel: {
    fontSize: 14,
    color: Colors.primary,
  },
  menuSection: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: Colors.textLight,
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
    borderColor: Colors.error,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutButtonLabel: {
    fontSize: 16,
    color: Colors.error,
  },
  versionText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
});