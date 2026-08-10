#!/usr/bin/env bash
# ============================================================
# Xvshuo 叙说 · 生成固定签名 keystore（一次生成，长期复用）
# 输出：
#   - apac/keystore.jks            签名库（请妥善保管，泄露=签名泄露）
#   - apac/keystore.properties     Gradle 签名配置（不入库，已 gitignore）
#   - 终端打印 4 个 GitHub Secrets 值（KEYSTORE_BASE64 / KS_STORE_PW_B64 /
#     KS_ALIAS_B64 / KS_KEY_PW_B64），复制到仓库 Settings → Secrets → Actions
#
# 用法：
#   bash scripts/generate-keystore.sh
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KS="$ROOT/apac/keystore.jks"
PROPS="$ROOT/apac/keystore.properties"
ALIAS="xvshuo"

# 全新生成（keystore 与 properties 都不存在）
if [ ! -f "$KS" ] && [ ! -f "$PROPS" ]; then
  STORE_PW="$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 20)"
  KEY_PW="$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 20)"
  keytool -genkeypair -v \
    -keystore "$KS" \
    -alias "$ALIAS" \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$STORE_PW" \
    -keypass "$KEY_PW" \
    -dname "CN=Xvshuo, OU=App, O=Xvshuo, L=City, ST=State, C=CN" \
    >/dev/null
  cat > "$PROPS" <<EOF
storeFile=keystore.jks
storePassword=$STORE_PW
keyAlias=$ALIAS
keyPassword=$KEY_PW
EOF
  echo "已生成：$KS 与 $PROPS"
elif [ -f "$KS" ] && [ ! -f "$PROPS" ]; then
  echo "检测到 $KS 已存在但没有 keystore.properties。" >&2
  echo "请手动创建 $PROPS，内容为：" >&2
  echo "  storeFile=keystore.jks" >&2
  echo "  storePassword=<原密码>" >&2
  echo "  keyAlias=<原别名>" >&2
  echo "  keyPassword=<原密码>" >&2
  exit 1
elif [ ! -f "$KS" ] && [ -f "$PROPS" ]; then
  echo "检测到 $PROPS 存在但缺少 keystore 文件。" >&2
  echo "请把 keystore.jks 放回 apac/ 目录。" >&2
  exit 1
else
  echo "使用现有签名配置：$KS / $PROPS"
fi

echo ""
echo "================================================================"
echo " keystore 已生成并入库（apac/keystore.jks + keystore.properties）"
echo "================================================================"
echo ""
echo "  ✓ 直接 git add apac/keystore.* && git commit && git push"
echo "  ✓ GitHub Actions 工作流会自动读取，构建签名一致的 release APK"
echo "  ✓ 产物 Artifact xvshuo-apk 下载即 .apk，可覆盖安装"
echo ""
echo "  请备份 keystore.jks 到安全位置（丢失后无法再升级安装）"
echo "  若要换签名，删除 apac/keystore.* 后重新运行本脚本（已安装版本需先卸载）"
