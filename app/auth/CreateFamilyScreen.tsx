import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Button, TextInput, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/Colors';
import { authApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function CreateFamilyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { setUser, setFamily } = useAuth();

  const [familyName, setFamilyName] = useState('');
  const [adminNickname, setAdminNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      Alert.alert('提示', '请输入家庭名称');
      return;
    }
    if (!adminNickname.trim()) {
      Alert.alert('提示', '请输入您的昵称');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authApi.createFamily({
        familyName: familyName.trim(),
        adminNickname: adminNickname.trim(),
      });

      console.log('CreateFamily: API success, setting user and family');
      setUser(result.user);
      setFamily(result.family);
      console.log('CreateFamily: State updated, navigating to Main');
      
      // 使用replace替换当前栈，避免返回
      navigation.replace('Main');
    } catch (error: any) {
      Alert.alert('错误', error.message || '创建家庭失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>创建家庭</Text>
        <Text style={styles.subtitle}>
          创建一个新家庭，您将成为家庭管理员
        </Text>

        <Card style={styles.formCard}>
          <Card.Content>
            <TextInput
              label="家庭名称"
              placeholder="例如：幸福小家"
              value={familyName}
              onChangeText={setFamilyName}
              maxLength={20}
              mode="outlined"
              style={styles.input}
              outlineColor={Colors.border}
              activeOutlineColor={Colors.primary}
            />
            <Text style={styles.helperText}>
              给您的家庭起个好听的名字
            </Text>

            <TextInput
              label="您的昵称"
              placeholder="例如：爸爸"
              value={adminNickname}
              onChangeText={setAdminNickname}
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
          <Text style={styles.infoTitle}>管理员权限说明</Text>
          <Text style={styles.infoText}>• 添加/删除家庭成员</Text>
          <Text style={styles.infoText}>• 设置其他成员为管理员</Text>
          <Text style={styles.infoText}>• 添加/编辑/删除菜谱</Text>
          <Text style={styles.infoText}>• 管理家庭设置</Text>
        </View>

        <Button
          mode="contained"
          onPress={handleCreateFamily}
          loading={isLoading}
          disabled={isLoading}
          style={styles.createButton}
          labelStyle={styles.buttonLabel}
        >
          创建家庭
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate('JoinFamily')}
          style={styles.switchButton}
          labelStyle={styles.switchButtonLabel}
        >
          已有家庭？加入家庭
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
    backgroundColor: Colors.primaryLight + '20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryDark,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 4,
  },
  createButton: {
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
