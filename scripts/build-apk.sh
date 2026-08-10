#!/usr/bin/env bash
# ============================================================
# Xvshuo 叙说 · APK 打包脚本
#   1) 把项目静态文件（index.html + scripts + styles + assets 等）
#      拷贝进 apac/app/src/main/assets/www/
#   2) 调用 Gradle 构建 APK（debug / release）
#
# 用法：
#   bash scripts/build-apk.sh sync     # 仅同步静态文件到 assets/www
#   bash scripts/build-apk.sh debug    # 同步 + 构建 Debug APK（默认）
#   bash scripts/build-apk.sh release  # 同步 + 构建 Release APK（固定签名需 keystore.properties）
#
# 固定签名（release 覆盖安装必需）：
#   运行 bash scripts/generate-keystore.sh 生成 keystore，
#   并把输出配置到 CI（GitHub Secrets）或本地 apac/keystore.properties。
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APAC="$ROOT/apac"
WWW="$APAC/app/src/main/assets/www"
MODE="${1:-debug}"

sync_www() {
  echo "[sync] 同步静态文件到 assets/www …"
  rm -rf "$WWW"
  mkdir -p "$WWW"
  tar --exclude='./.git' \
      --exclude='./apac' \
      --exclude='./download.html' \
      --exclude='./Xvshuo-*.zip' \
      --exclude='./Xvshuo-*.html' \
      --exclude='./.codebuddy' \
      --exclude='./.github' \
      -C "$ROOT" -cf - . | tar -C "$WWW" -xf -
  echo "      已拷贝 $(find "$WWW" -type f | wc -l | tr -d ' ') 个文件"
}

find_gradle() {
  if [ -x "$APAC/gradlew" ]; then
    echo "$APAC/gradlew"
  elif command -v gradle >/dev/null 2>&1; then
    command -v gradle
  else
    echo "    未找到 gradlew 或 gradle。请用 Android Studio 打开 $APAC 生成 wrapper，" >&2
    echo "    或在 CI（GitHub Actions）中通过 gradle/actions/setup-gradle 提供。" >&2
    exit 1
  fi
}

if [ "$MODE" = "sync" ]; then
  sync_www
  echo "  同步完成。"
  exit 0
fi

sync_www

if [ "$MODE" = "release" ] && [ ! -f "$APAC/keystore.properties" ]; then
  echo ""
  echo "!! 未找到 apac/keystore.properties，release 将使用 debug 签名（每次不同，无法覆盖安装）。" >&2
  echo "   请先运行：bash scripts/generate-keystore.sh" >&2
  echo ""
fi

GRADLE="$(find_gradle)"
echo "[build] 使用 Gradle: $GRADLE"
"$GRADLE" -p "$APAC" "assemble$(echo "${MODE^}")"

if [ "$MODE" = "release" ]; then
  APK_OUT="$APAC/app/build/outputs/apk/release/app-release.apk"
else
  APK_OUT="$APAC/app/build/outputs/apk/debug/app-debug.apk"
fi
if [ -f "$APK_OUT" ]; then
  SIZE=$(du -h "$APK_OUT" | cut -f1)
  echo ""
  echo "✔ APK 已生成：$APK_OUT（$SIZE）"
  echo "  安装：adb install -r \"$APK_OUT\""
else
  echo "✘ 未找到 APK 输出，请查看上方构建日志" >&2
  exit 1
fi
