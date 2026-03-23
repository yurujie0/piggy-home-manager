import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Button, TextInput, Card } from 'react-native-paper';
import { Colors } from '../../constants/Colors';
import { authApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface JoinFamilyScreenProps {
  onNavigateToCreate: () => void;
  onNavigateToMain: () => void;
}

export default function JoinFamilyScreen({ onNavigateToCreate, onNavigateToMain }: JoinFamilyScreenProps) {
  const { setUser, setFamily } = useAuth();

  const [inviteCode, setInviteCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinFamily = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('提示', '请输入邀请码');
      return;
    }
    if (!nickname.trim()) {
      Alert.alert('提示', '请输入您的昵称');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authApi.joinFamily({
        inviteCode: inviteCode.trim().toUpperCase(),
        nickname: nickname.trim(),
      });

      console.log('JoinFamily: API success, setting user and family');
      setUser(result.user);
      setFamily(result.family);
      console.log('JoinFamily: State updated, navigating to Main');
      
      // 使用replace替换当前栈，避免返回
      onNavigateToMain();
    } catch (error: any) {
      Alert.alert('错误', error.message || '加入家庭失败，请检查邀请码是否正确');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>加入家庭</Text>
        <Text style={styles.subtitle}>
          输入邀请码，加入已有家庭
        </Text>

        <Card style={styles.formCard}>
          <Card.Content>
            <TextInput
              label="邀请码"
              placeholder="例如：ABC123"
              value={inviteCode}
              onChangeText={(text) => setInviteCode(text.toUpperCase())}
              maxLength={6}
              autoCapitalize="characters"
              mode="outlined"
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
            />
            <Text style={styles.helperText}>
              向家庭管理员索取6位邀请码
            </Text>

            <TextInput
              label="您的昵称"
              placeholder="例如：妈妈"
              value={nickname}
              onChangeText={setNickname}
              maxLength={10}
              mode="outlined"
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
            />
            <Text style={styles.helperText}>
              其他家庭成员将如何称呼您
            </Text>
          </Card.Content>
        </Card>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>普通成员权限</Text>
          <Text style={styles.infoText}>• 浏览家庭菜谱</Text>
          <Text style={styles.infoText}>• 添加/取消想吃的菜</Text>
          <Text style={styles.infoText}>• 查看全家的点餐情况</Text>
          <Text style={styles.infoText}>• 参与家庭互动</Text>
        </View>

        <Button
          mode="contained"
          onPress={handleJoinFamily}
          loading={isLoading}
          disabled={isLoading}
          style={styles.joinButton}
          labelStyle={styles.buttonLabel}
        >
          加入家庭
        </Button>

        <Button
          mode="text"
          onPress={onNavigateToCreate}
          style={styles.switchButton}
          labelStyle={styles.switchButtonLabel}
        >
          还没有家庭？创建家庭
        </Button>
      </View>
    </ScrollView>
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
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: 32,
  },
  formCard: {
    marginBottom: 16,
    backgroundColor: Colors.surface,
  },
  input: {
    backgroundColor: Colors.surface,
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 16,
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: Colors.secondaryLight + '20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondaryDark,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.secondary,
    marginBottom: 4,
  },
  joinButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  switchButton: {
    borderRadius: 12,
  },
  switchButtonLabel: {
    fontSize: 14,
    color: Colors.primary,
  },
});
