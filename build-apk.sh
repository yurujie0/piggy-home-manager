#!/bin/bash

# 小猪管家 - 构建脚本
# 支持 Android APK 构建

echo "🐷 小猪管家 - 开始构建..."

# 设置环境变量
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export ANDROID_HOME=/home/yurujie/android-sdk
export PATH=$JAVA_HOME/bin:$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# 清理旧构建
echo "🧹 清理旧构建..."
rm -rf android
rm -rf dist

# 生成 Android 项目
echo "📱 生成 Android 项目..."
npx expo prebuild --platform android

# 配置 SDK 路径
echo "⚙️ 配置 SDK 路径..."
cd android
echo "sdk.dir=/home/yurujie/android-sdk" > local.properties

# 构建 Release APK
echo "🔨 构建 Release APK..."
~/.gradle/wrapper/dists/gradle-8.10.2-all/b56q50gs7qqx1aauwgq4zjvl7/gradle-8.10.2/bin/gradle assembleRelease

# 检查构建结果
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    echo "✅ 构建成功！"
    
    # 复制并重命名 APK
    cd ..
    mkdir -p dist
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    cp android/app/build/outputs/apk/release/app-release.apk "dist/piggy-home-manager-v1.0.0-${TIMESTAMP}.apk"
    
    echo "📦 APK 位置: dist/piggy-home-manager-v1.0.0-${TIMESTAMP}.apk"
    ls -lh "dist/piggy-home-manager-v1.0.0-${TIMESTAMP}.apk"
else
    echo "❌ 构建失败！"
    exit 1
fi

echo "🎉 构建完成！"
