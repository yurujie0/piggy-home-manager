import React, { useEffect, useState } from 'react';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Colors } from './constants/Colors';

// Auth Screens
import WelcomeScreen from './app/auth/WelcomeScreen';
import CreateFamilyScreen from './app/auth/CreateFamilyScreen';
import JoinFamilyScreen from './app/auth/JoinFamilyScreen';

// Main Screens
import HomeScreen from './app/main/HomeScreen';
import OrderScreen from './app/main/OrderScreen';
import MenuScreen from './app/main/MenuScreen';
import ProfileScreen from './app/main/ProfileScreen';

// 自定义主题
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
  },
};

// 底部导航栏
function BottomTabBar({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  const tabs = [
    { key: 'home', label: '首页', icon: 'home' },
    { key: 'order', label: '点餐', icon: 'food' },
    { key: 'menu', label: '菜谱', icon: 'book-open' },
    { key: 'profile', label: '我的', icon: 'account' },
  ];

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={styles.tabItem}
          onPress={() => onTabChange(tab.key)}
        >
          <MaterialCommunityIcons
            name={activeTab === tab.key ? tab.icon : `${tab.icon}-outline`}
            size={24}
            color={activeTab === tab.key ? Colors.primary : Colors.textLight}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === tab.key && styles.tabLabelActive,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// 主应用内容
function MainContent() {
  const [activeTab, setActiveTab] = useState('home');
  const { user, family, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  // 渲染当前页面
  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen onNavigate={(screen: string) => setActiveTab(screen)} />;
      case 'order':
        return <OrderScreen onNavigate={(screen: string) => setActiveTab(screen)} />;
      case 'menu':
        return <MenuScreen onNavigate={(screen: string) => setActiveTab(screen)} />;
      case 'profile':
        return <ProfileScreen onNavigate={(screen: string) => setActiveTab(screen)} />;
      default:
        return <HomeScreen onNavigate={(screen: string) => setActiveTab(screen)} />;
    }
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.screenWrapper}>{renderScreen()}</View>
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </View>
  );
}

// 认证流程
function AuthFlow() {
  const [authScreen, setAuthScreen] = useState<'welcome' | 'create' | 'join'>('welcome');
  const { user, family } = useAuth();

  // 如果已登录且有家庭，进入主应用
  if (user && family) {
    return <MainContent />;
  }

  // 如果已登录但没有家庭，显示创建/加入家庭页面
  if (user && !family) {
    return (
      <CreateFamilyScreen
        onNavigateToJoin={() => setAuthScreen('join')}
        onNavigateToMain={() => {}}
      />
    );
  }

  // 根据当前认证页面显示
  switch (authScreen) {
    case 'welcome':
      return (
        <WelcomeScreen
          onNavigateToCreate={() => setAuthScreen('create')}
          onNavigateToJoin={() => setAuthScreen('join')}
        />
      );
    case 'create':
      return (
        <CreateFamilyScreen
          onNavigateToJoin={() => setAuthScreen('join')}
          onNavigateToMain={() => {}}
        />
      );
    case 'join':
      return (
        <JoinFamilyScreen
          onNavigateToCreate={() => setAuthScreen('create')}
          onNavigateToMain={() => {}}
        />
      );
    default:
      return <WelcomeScreen onNavigateToCreate={() => setAuthScreen('create')} onNavigateToJoin={() => setAuthScreen('join')} />;
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <SafeAreaView style={styles.container} edges={['top']}>
            <AuthFlow />
            <StatusBar style="dark" backgroundColor={Colors.background} />
          </SafeAreaView>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mainContainer: {
    flex: 1,
  },
  screenWrapper: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 10,
    color: Colors.text,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    height: 70,
    paddingBottom: 10,
    paddingTop: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textLight,
    marginTop: 4,
  },
  tabLabelActive: {
    color: Colors.primary,
  },
});
