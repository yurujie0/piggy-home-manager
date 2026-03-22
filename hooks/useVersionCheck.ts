import { useState, useEffect } from 'react';
import { versionApi } from '../services/api';
import type { VersionInfo } from '../types';

export function useVersionCheck() {
  const [updateInfo, setUpdateInfo] = useState<VersionInfo | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    checkVersion();
  }, []);

  const checkVersion = async () => {
    try {
      const info = await versionApi.checkUpdate();
      setUpdateInfo(info);
      // 这里应该比较当前版本和服务器版本
      // setHasUpdate(currentVersionCode < info.versionCode);
    } catch (error) {
      console.error('Version check failed:', error);
    }
  };

  const dismissUpdate = () => {
    setHasUpdate(false);
  };

  return { updateInfo, hasUpdate, dismissUpdate };
}
