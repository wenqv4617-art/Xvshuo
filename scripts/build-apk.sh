#!/usr/bin/env bash
# ============================================================
# Xvshuo 叙说 · APK 打包脚本
# 1) 把项目静态文件（index.html + scripts + styles + assets 等）
#    拷贝进 apac/app/src/main/assets/www/
# 2) 调用 Gradle 构建 Debug APK
#
# 前置条件（在装有 Android SDK 的机器上执行）：
#   - JDK 17+（Android Gradle Plugin 8.x 需要）
#   - Android SDK（环境变量 ANDROID_HOME 或 local.properties 指向 SDK）
#   - 首次运行建议用 Android Studio 打开 apac/ 目录，让 AS 生成 gradle wrapper
#
# 用法：
#   bash scripts/build-apk.sh          # 构建 debug
#   bash scripts/build-apk.sh release  # 构建 release（需配置签名）
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APAC="$ROOT/apac"
WWW="$APAC/app/src/main/assets/www"
MODE="${1:-debug}"

echo "[1/3] 同步静态文件到 assets/www …"
rm -rf "$WWW"
mkdir -p "$WWW"
# 排除：git、apac 壳工程自身、交付包、下载页、缓存
tar --exclude='./.git' \
    --exclude='./apac' \
    --exclude='./download.html' \
    --exclude='./Xvshuo-*.zip' \
    --exclude='./Xvshuo-*.html' \
    --exclude='./.codebuddy' \
    --exclude='./.github' \
    -C "$ROOT" -cf - . | tar -C "$WWW" -xf -
echo "    已拷贝 $(find "$WWW" -type f | wc -l | tr -d ' ') 个文件"

echo "[2/3] 定位 Gradle …"
GRADLEW="$APAC/gradlew"
GRADLE=""
if [ -x "$GRADLEW" ]; then
  GRADLE="$GRADLEW"
elif command -v gradle >/dev/null 2>&1; then
  GRADLE="$(command -v gradle)"
elif [ -n "${ANDROID_HOME:-}" ] || [ -n "${ANDROID_SDK_ROOT:-}" ]; then
  echo "    未找到 gradlew 或 gradle，请先用 Android Studio 打开 $APAC 生成 wrapper"
  exit 1
else
  echo "    未检测到 Android SDK（ANDROID_HOME）。请安装 Android Studio 后在 $APAC 中构建。"
  exit 1
fi

echo "[3/3] 构建 $MODE APK …"
"$GRADLE" -p "$APAC" assembleDebug

APK_OUT="$APAC/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_OUT" ]; then
  SIZE=$(du -h "$APK_OUT" | cut -f1)
  echo ""
  echo "✔ APK 已生成：$APK_OUT（$SIZE）"
  echo "  安装：adb install -r \"$APK_OUT\""
else
  echo "✘ 未找到 APK 输出，请查看上方构建日志"
  exit 1
fi
