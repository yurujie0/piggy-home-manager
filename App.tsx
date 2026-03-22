import React, { useEffect, useState } from 'react';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Colors } from './constants/Colors';
import { ErrorBoundary } from './components/ErrorBoundary';

// Auth Screens
import WelcomeScreen from './app/auth/WelcomeScreen';
import CreateFamilyScreen from './app/auth/CreateFamilyScreen';
import JoinFamilyScreen from './app/auth/JoinFamilyScreen';

// Main Screens
import HomeScreen from './app/main/HomeScreen';
import OrderScreen from './app/main/OrderScreen';
import MenuScreen from './app/main/MenuScreen';
import ProfileScreen from './app/main/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// 自定义主题
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary,
    primaryContainer: Colors.primaryLight,
    secondary: Colors.secondary,
    secondaryContainer: Colors.secondaryLight,
    background: Colors.background,
    surface: Colors.surface,
    surfaceVariant: Colors.card,
    error: Colors.error,
    onPrimary: '#FFFFFF',
    onSurface: Colors.text,
    onSurfaceVariant: Colors.textLight,
    outline: Colors.border,
    outlineVariant: Colors.divider,
  },
  roundness: 4,
};

// 自定义 Tab Bar 样式
const tabBarOptions = {
  tabBarActiveTintColor: Colors.primary,
  tabBarInactiveTintColor: Colors.textLight,
  tabBarStyle: {
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
  tabBarLabelStyle: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  headerShown: false,
};

// 主应用底部导航
function MainTabs() {
  return (
    <Tab.Navigator screenOptions={tabBarOptions}>
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: '首页',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'home' : 'home-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="OrderTab"
        component={OrderScreen}
        options={{
          title: '点餐',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'food' : 'food-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="MenuTab"
        component={MenuScreen}
        options={{
          title: '菜谱',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'book-open' : 'book-open-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: '我的',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'account' : 'account-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// 加载中组件
function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={{ marginTop: 10, color: Colors.text }}>加载中...</Text>
    </View>
  );
}

// 根导航 - 简化版本，避免条件渲染导致的问题
function RootNavigator() {
  const { user, family, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // 确定初始路由
  let initialRoute = 'Welcome';
  if (user && family) {
    initialRoute = 'Main';
  } else if (user && !family) {
    initialRoute = 'CreateFamily';
  }

  console.log('RootNavigator render:', { user: !!user, family: !!family, initialRoute });

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="CreateFamily" component={CreateFamilyScreen} />
        <Stack.Screen name="JoinFamily" component={JoinFamilyScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
            <ErrorBoundary>
              <RootNavigator />
            </ErrorBoundary>
            <StatusBar style="dark" backgroundColor={Colors.background} />
          </SafeAreaView>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
