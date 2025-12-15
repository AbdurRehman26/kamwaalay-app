#!/bin/bash

# Setup script for building AAB without Expo
# This script will guide you through the setup process

set -e

echo "🚀 Kamwaalay App - AAB Build Setup"
echo "===================================="
echo ""

# Check Java
echo "📋 Step 1: Checking Java installation..."
if ! command -v java &> /dev/null; then
    echo "❌ Java is not installed"
    echo "Installing Java 17 via Homebrew..."
    
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew is not installed. Please install it first:"
        echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
    
    brew install openjdk@17
    
    # Set JAVA_HOME
    export JAVA_HOME=$(/usr/libexec/java_home -v 17)
    
    # Add to shell profile
    if [ -f ~/.zshrc ]; then
        echo "" >> ~/.zshrc
        echo "# Java Home for Android builds" >> ~/.zshrc
        echo "export JAVA_HOME=\$(/usr/libexec/java_home -v 17)" >> ~/.zshrc
        echo "✅ Added JAVA_HOME to ~/.zshrc"
    fi
else
    echo "✅ Java is installed: $(java -version 2>&1 | head -n 1)"
fi

echo ""

# Check Android SDK
echo "📋 Step 2: Checking Android SDK..."
if [ -z "$ANDROID_HOME" ]; then
    echo "⚠️  ANDROID_HOME is not set"
    echo "Please set it in your ~/.zshrc:"
    echo "  export ANDROID_HOME=\$HOME/Library/Android/sdk"
    echo "  export PATH=\$PATH:\$ANDROID_HOME/emulator"
    echo "  export PATH=\$PATH:\$ANDROID_HOME/platform-tools"
else
    echo "✅ ANDROID_HOME is set: $ANDROID_HOME"
fi

echo ""

# Check if android folder exists
echo "📋 Step 3: Checking Android project..."
if [ ! -d "android" ]; then
    echo "⚠️  Android folder not found"
    echo "Generating native Android project..."
    npx expo prebuild --platform android
    echo "✅ Android project generated"
else
    echo "✅ Android project exists"
fi

echo ""

# Check for keystore
echo "📋 Step 4: Checking for release keystore..."
if [ ! -f "android/app/kamwaalay-release-key.keystore" ]; then
    echo "⚠️  Release keystore not found"
    echo ""
    echo "You need to create a signing key for release builds."
    echo "Run this command and follow the prompts:"
    echo ""
    echo "  cd android/app"
    echo "  keytool -genkeypair -v -storetype PKCS12 -keystore kamwaalay-release-key.keystore -alias kamwaalay-key-alias -keyalg RSA -keysize 2048 -validity 10000"
    echo ""
    echo "Then create android/gradle.properties with your keystore credentials."
    echo "See BUILD_AAB.md for detailed instructions."
else
    echo "✅ Release keystore found"
fi

echo ""
echo "===================================="
echo "✅ Setup check complete!"
echo ""
echo "Next steps:"
echo "1. If you need to create a keystore, follow the instructions above"
echo "2. Configure gradle.properties with your signing credentials"
echo "3. Run: cd android && ./gradlew bundleRelease"
echo ""
echo "For detailed instructions, see BUILD_AAB.md"
echo "===================================="
