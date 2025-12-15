# Quick Start: Build AAB Without Expo

Follow these steps to build your AAB file locally:

## 1️⃣ Install Java (Required)

```bash
# Install Java 17 using Homebrew
brew install openjdk@17

# Set JAVA_HOME (add to ~/.zshrc for persistence)
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc
source ~/.zshrc
```

## 2️⃣ Ensure Android Project Exists

```bash
# If android folder doesn't exist, generate it
npx expo prebuild --platform android
```

## 3️⃣ Create Release Signing Key

```bash
# Navigate to app directory
cd android/app

# Generate keystore (you'll be prompted for passwords and info)
keytool -genkeypair -v -storetype PKCS12 \
  -keystore kamwaalay-release-key.keystore \
  -alias kamwaalay-key-alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Return to project root
cd ../..
```

**Remember your passwords! You'll need them in the next step.**

## 4️⃣ Configure Signing (One-time Setup)

Create or edit `android/gradle.properties` and add these lines (replace with your actual passwords):

```properties
KAMWAALAY_UPLOAD_STORE_FILE=kamwaalay-release-key.keystore
KAMWAALAY_UPLOAD_KEY_ALIAS=kamwaalay-key-alias
KAMWAALAY_UPLOAD_STORE_PASSWORD=your_keystore_password_here
KAMWAALAY_UPLOAD_KEY_PASSWORD=your_key_password_here
```

## 5️⃣ Update build.gradle (One-time Setup)

Edit `android/app/build.gradle` and add signing configuration inside the `android` block:

```gradle
android {
    ...
    
    signingConfigs {
        release {
            if (project.hasProperty('KAMWAALAY_UPLOAD_STORE_FILE')) {
                storeFile file(KAMWAALAY_UPLOAD_STORE_FILE)
                storePassword KAMWAALAY_UPLOAD_STORE_PASSWORD
                keyAlias KAMWAALAY_UPLOAD_KEY_ALIAS
                keyPassword KAMWAALAY_UPLOAD_KEY_PASSWORD
            }
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"
        }
    }
}
```

## 6️⃣ Build the AAB! 🎉

```bash
# Navigate to android directory
cd android

# Build release AAB
./gradlew bundleRelease
```

## 7️⃣ Find Your AAB

Your AAB file will be at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## Troubleshooting

**"SDK location not found"**
- Make sure ANDROID_HOME is set: `echo $ANDROID_HOME`
- Should show: `/Users/kazmi/Library/Android/sdk`

**"Java version mismatch"**
- Run: `java -version`
- Should show Java 17 or higher

**Build fails**
- Try cleaning first: `./gradlew clean`
- Then build again: `./gradlew bundleRelease`

---

## After Building

Upload `app-release.aab` to Google Play Console. Google Play will automatically generate optimized APKs for different devices.

For more details, see `BUILD_AAB.md`.
