import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { Button, Dialog, Portal } from 'react-native-paper';
import { Colors } from '../constants/Colors';
import type { VersionInfo } from '../types';

interface UpdateDialogProps {
  visible: boolean;
  updateInfo: VersionInfo | null;
  onDismiss: () => void;
}

export function UpdateDialog({ visible, updateInfo, onDismiss }: UpdateDialogProps) {
  if (!updateInfo) return null;

  const handleUpdate = () => {
    if (updateInfo.downloadUrl) {
      Linking.openURL(updateInfo.downloadUrl);
    }
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>发现新版本</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.versionText}>版本: {updateInfo.version}</Text>
          <Text style={styles.notesText}>{updateInfo.releaseNotes}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          {!updateInfo.forceUpdate && (
            <Button onPress={onDismiss}>稍后更新</Button>
          )}
          <Button onPress={handleUpdate} mode="contained">
            立即更新
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  versionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
  },
});

export default UpdateDialog;
