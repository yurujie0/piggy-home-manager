#!/bin/bash

# 小猪管家 - 发布脚本
# 用于构建和发布APK

set -e

echo "🐷 小猪管家 - 发布脚本"
echo "========================"

# 版本信息
VERSION="1.0.0"
VERSION_CODE=1
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "📦 版本: $VERSION"
echo "📅 时间: $TIMESTAMP"
echo ""

# 检查环境
echo "🔍 检查环境..."

if [ ! -d "node_modules" ]; then
    echo "❌ 请先运行 npm install"
    exit 1
fi

if [ -z "$ANDROID_HOME" ]; then
    echo "⚠️ 未设置 ANDROID_HOME 环境变量"
    export ANDROID_HOME=/home/yurujie/android-sdk
    echo "   已设置为: $ANDROID_HOME"
fi

if [ -z "$JAVA_HOME" ]; then
    echo "⚠️ 未设置 JAVA_HOME 环境变量"
    export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
    echo "   已设置为: $JAVA_HOME"
fi

echo "✅ 环境检查完成"
echo ""

# 清理旧构建
echo "🧹 清理旧构建..."
rm -rf android
rm -rf dist
mkdir -p dist
echo "✅ 清理完成"
echo ""

# 生成Android项目
echo "📱 生成Android项目..."
npx expo prebuild --platform android --clean
echo "✅ 项目生成完成"
echo ""

# 配置SDK路径
echo "⚙️ 配置SDK路径..."
cd android
echo "sdk.dir=/home/yurujie/android-sdk" > local.properties
echo "✅ 配置完成"
echo ""

# 构建Release APK
echo "🔨 构建Release APK..."
echo "   这可能需要几分钟..."

# 使用Gradle构建
if [ -f "~/.gradle/wrapper/dists/gradle-8.10.2-all/b56q50gs7qqx1aauwgq4zjvl7/gradle-8.10.2/bin/gradle" ]; then
    ~/.gradle/wrapper/dists/gradle-8.10.2-all/b56q50gs7qqx1aauwgq4zjvl7/gradle-8.10.2/bin/gradle assembleRelease
else
    ./gradlew assembleRelease
fi

# 检查构建结果
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    echo "✅ APK构建成功"
    
    # 复制并重命名APK
    cd ..
    APK_NAME="piggy-home-manager-v${VERSION}-${TIMESTAMP}.apk"
    cp android/app/build/outputs/apk/release/app-release.apk "dist/$APK_NAME"
    
    # 创建最新版本链接
    cp "dist/$APK_NAME" "dist/piggy-home-manager-latest.apk"
    
    # 生成版本信息
    cat > dist/version.json << EOF
{
  "version": "$VERSION",
  "versionCode": $VERSION_CODE,
  "buildTime": "$TIMESTAMP",
  "apkName": "$APK_NAME",
  "downloadUrl": "/download/$APK_NAME"
}
EOF
    
    echo ""
    echo "🎉 构建完成！"
    echo "========================"
    echo "📦 APK文件: dist/$APK_NAME"
    echo "📊 文件大小: $(ls -lh dist/$APK_NAME | awk '{print $5}')"
    echo "🔗 最新版本: dist/piggy-home-manager-latest.apk"
    echo ""
    echo "📤 上传命令:"
    echo "   curl -X POST -F 'file=@dist/$APK_NAME' http://8.135.17.245:18000/upload"
    echo ""
    
else
    echo "❌ APK构建失败"
    exit 1
fi

# 可选：上传到文件服务器
if [ "$1" == "--upload" ]; then
    echo "📤 正在上传到文件服务器..."
    UPLOAD_RESULT=$(curl -s -X POST -F "file=@dist/$APK_NAME" http://8.135.17.245:18000/upload)
    echo "✅ 上传完成"
    echo "📋 上传结果: $UPLOAD_RESULT"
fi

echo ""
echo "🐷 小猪管家发布完成！"
