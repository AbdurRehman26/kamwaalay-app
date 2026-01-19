import re

file_path = 'android/app/build.gradle'

with open(file_path, 'r') as f:
    content = f.read()

# Replace the release signing config
# Since I know the structure, I can do a direct string replacement of the specific block I added before
# or a more robust regex replacement.

old_block = r"""        release {
            storeFile file('kamwaalay-upload-key.jks')
            storePassword 'password123'
            keyAlias 'my-key-alias'
            keyPassword 'password123'
        }"""

new_block = r"""        release {
            storeFile file('upload-keystore.jks')
            storePassword 'kamwaalay123'
            keyAlias 'upload'
            keyPassword 'kamwaalay123'
        }"""

if old_block in content:
    new_content = content.replace(old_block, new_block)
    with open(file_path, 'w') as f:
        f.write(new_content)
    print("Successfully updated build.gradle")
else:
    print("Could not find the old block to replace. Content might have changed.")
    # Fallback: try to replace using regex just in case whitespace is different
    pattern = r"release\s*{\s*storeFile\s*file\('kamwaalay-upload-key.jks'\)[^}]+\}"
    if re.search(pattern, content, re.DOTALL):
        new_content = re.sub(pattern, new_block, content, flags=re.DOTALL)
        with open(file_path, 'w') as f:
            f.write(new_content)
        print("Successfully updated build.gradle using regex fallback")
    else:
        print("FAILED: Could not find config to update.")
