import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Button } from 'react-native-paper';
import { Colors } from '../../constants/Colors';

interface WelcomeScreenProps {
  onNavigateToCreate: () => void;
  onNavigateToJoin: () => void;
}

export default function WelcomeScreen({ onNavigateToCreate, onNavigateToJoin }: WelcomeScreenProps) {

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        {/* Logo区域 */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoEmoji}>🐷</Text>
          </View>
          <Text style={styles.title}>小猪管家</Text>
          <Text style={styles.subtitle}>您的家庭百宝箱</Text>
        </View>

        {/* 功能介绍 */}
        <View style={styles.featuresContainer}>
          <FeatureItem
            icon="👨‍👩‍👧‍👦"
            title="家庭管理"
            description="创建或加入家庭，与家人共享便捷生活"
          />
          <FeatureItem
            icon="🍽️"
            title="智能点餐"
            description="全家一起选菜，实时同步，不再纠结吃什么"
          />
          <FeatureItem
            icon="📋"
            title="菜谱管理"
            description="管理员维护家庭菜谱，成员随时浏览"
          />
        </View>

        {/* 操作按钮 */}
        <View style={styles.buttonsContainer}>
          <Button
            mode="contained"
            onPress={onNavigateToCreate}
            style={styles.primaryButton}
            labelStyle={styles.buttonLabel}
          >
            创建家庭
          </Button>
          <Button
            mode="outlined"
            onPress={onNavigateToJoin}
            style={styles.secondaryButton}
            labelStyle={styles.outlineButtonLabel}
          >
            加入家庭
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

// 功能项组件
function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoEmoji: {
    fontSize: 50,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.textLight,
  },
  featuresContainer: {
    marginBottom: 40,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.textLight,
  },
  buttonsContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 8,
  },
  secondaryButton: {
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  outlineButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
});
