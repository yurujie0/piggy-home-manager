#!/bin/bash

# 小猪管家APP构建脚本
# 使用方法: ./build-apk.sh [版本名]

set -e

# 配置
JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ANDROID_HOME=/home/yurujie/android-sdk
GRADLE_BIN=~/.gradle/wrapper/dists/gradle-8.10.2-all/b56q50gs7qqx1aauwgq4zjvl7/gradle-8.10.2/bin/gradle

# 获取版本名
VERSION=${1:-"v1.1.0"}
FILENAME="piggy-home-manager-${VERSION}.apk"

echo "========================================"
echo "开始构建小猪管家APP"
echo "版本: ${VERSION}"
echo "========================================"

# 1. 清理并重新生成 Android 项目
echo "[1/5] 清理并重新生成 Android 项目..."
cd ~/.openclaw/workspace/piggy-home-manager
rm -rf android
npx expo prebuild --platform android 2>&1 | tail -5

# 2. 配置 SDK 路径
echo "[2/5] 配置 SDK 路径..."
echo "sdk.dir=/home/yurujie/android-sdk" > android/local.properties

# 3. 修改 Gradle 版本
echo "[3/5] 修改 Gradle 版本..."
sed -i 's/gradle-8.8/gradle-8.10.2/' android/gradle/wrapper/gradle-wrapper.properties

# 4. 构建 Release APK
echo "[4/5] 构建 Release APK..."
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export ANDROID_HOME=/home/yurujie/android-sdk
export PATH=$JAVA_HOME/bin:$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

cd android
$GRADLE_BIN assembleRelease 2>&1 | tail -20

# 5. 使用 PUT 接口上传
echo "[5/5] 上传 APK..."
curl -X PUT "http://8.135.17.245:18000/upload?filename=${FILENAME}" \
  -T app/build/outputs/apk/release/app-release.apk

echo ""
echo "========================================"
echo "构建完成!"
echo "文件名: ${FILENAME}"
echo "========================================"
