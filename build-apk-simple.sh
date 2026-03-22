#!/bin/bash

# 小猪管家 - 简化构建脚本
# 使用food-order-app的构建环境

set -e

echo "🐷 小猪管家 - 构建APK"
echo "======================"

# 版本信息
VERSION="1.0.0"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 设置环境
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export ANDROID_HOME=/home/yurujie/android-sdk
export PATH=$JAVA_HOME/bin:$PATH

cd /home/yurujie/.openclaw/workspace/piggy-home-manager

# 清理
echo "🧹 清理..."
rm -rf android dist
mkdir -p dist

# 复制food-order-app的android目录
echo "📱 复制构建环境..."
cp -r /home/yurujie/.openclaw/workspace/food-order-app/android .

# 修改应用配置
echo "⚙️ 修改应用配置..."
# 修改AndroidManifest.xml中的应用名称
sed -i 's/Food Order App/小猪管家/g' android/app/src/main/res/values/strings.xml || true
sed -i 's/com.yourcompany.foodorder/com.yourcompany.piggyhome/g' android/app/build.gradle || true

# 设置SDK路径
echo "sdk.dir=/home/yurujie/android-sdk" > android/local.properties

# 构建
echo "🔨 构建APK..."
cd android

# 使用本地gradle
export GRADLE_HOME=/home/yurujie/.gradle/wrapper/dists/gradle-8.10.2-all/b56q50gs7qqx1aauwgq4zjvl7/gradle-8.10.2
export PATH=$GRADLE_HOME/bin:$PATH

# 清理并构建
rm -rf .gradle build app/build
gradle assembleRelease

# 检查结果
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    echo "✅ 构建成功！"
    
    cd ..
    APK_NAME="piggy-home-manager-v${VERSION}-${TIMESTAMP}.apk"
    cp android/app/build/outputs/apk/release/app-release.apk "dist/$APK_NAME"
    
    echo ""
    echo "📦 APK文件: dist/$APK_NAME"
    ls -lh "dist/$APK_NAME"
    
    # 上传
    echo ""
    echo "📤 上传到文件服务器..."
    UPLOAD_RESULT=$(curl -s -X POST -F "file=@dist/$APK_NAME" http://8.135.17.245:18000/upload)
    echo "📋 上传结果: $UPLOAD_RESULT"
    
    # 提取下载链接
    DOWNLOAD_URL=$(echo $UPLOAD_RESULT | grep -o '"download_url":"[^"]*"' | cut -d'"' -f4)
    if [ ! -z "$DOWNLOAD_URL" ]; then
        echo ""
        echo "🔗 下载地址: http://8.135.17.245:18000$DOWNLOAD_URL"
    fi
else
    echo "❌ 构建失败"
    exit 1
fi

echo ""
echo "🎉 完成！"
