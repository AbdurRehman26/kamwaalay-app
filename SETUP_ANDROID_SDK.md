# Android SDK Setup Guide

## Option 1: Use EAS Build (No Local SDK Required) ⭐ RECOMMENDED

EAS Build runs in the cloud and doesn't require local Android SDK setup.

### Steps:

1. **Login to EAS**:
   ```bash
   eas login
   ```

2. **Configure EAS project** (if not already done):
   ```bash
   eas build:configure
   ```

3. **Build APK**:
   ```bash
   eas build --platform android --profile preview
   ```

4. **Download APK**:
   - You'll get a download link when build completes
   - Or check: `eas build:list`

## Option 2: Install Android SDK for Local Builds

### Step 1: Install Android Studio

1. Download Android Studio from: https://developer.android.com/studio
2. Install it (drag to Applications folder)
3. Open Android Studio and complete the setup wizard
4. The SDK will be installed automatically during setup

### Step 2: Set ANDROID_HOME Environment Variable

Add to your `~/.zshrc` (or `~/.bash_profile` if using bash):

```bash
# Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Then reload:
```bash
source ~/.zshrc
```

### Step 3: Verify Installation

```bash
echo $ANDROID_HOME
# Should output: /Users/kazmi/Library/Android/sdk

adb version
# Should show Android Debug Bridge version
```

### Step 4: Create local.properties (if needed)

If the SDK path is still not detected, create `android/local.properties`:

```properties
sdk.dir=/Users/kazmi/Library/Android/sdk
```

### Step 5: Build APK

```bash
cd android
./gradlew assembleRelease
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

## Quick Fix: Create local.properties Manually

If you know where your SDK is installed, create `android/local.properties`:

```bash
echo "sdk.dir=/path/to/your/android/sdk" > android/local.properties
```

