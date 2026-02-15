#!/bin/bash
# Configure Android project for Capacitor 6 with correct package name and SDK versions
set -e

cd "$(dirname "$0")/.."

echo "=== Configuring Android project ==="

# Fix variables.gradle — compileSdk/targetSdk 34 for Capacitor 6
cat > android/variables.gradle << 'VAREOF'
ext {
    minSdkVersion = 22
    compileSdkVersion = 34
    targetSdkVersion = 34
    androidxActivityVersion = '1.8.0'
    androidxAppCompatVersion = '1.6.1'
    androidxCoordinatorLayoutVersion = '1.2.0'
    androidxCoreVersion = '1.12.0'
    androidxFragmentVersion = '1.6.2'
    coreSplashScreenVersion = '1.0.1'
    androidxWebkitVersion = '1.8.0'
    junitVersion = '4.13.2'
    androidxJunitVersion = '1.1.5'
    androidxEspressoCoreVersion = '3.5.1'
    cordovaAndroidVersion = '10.1.1'
}
VAREOF
echo "  ✓ variables.gradle (compileSdk=34, targetSdk=34)"

# Fix root build.gradle — AGP 8.2.1, google-services 4.4.2
cat > android/build.gradle << 'BUILDEOF'
// Top-level build file where you can add configuration options common to all sub-projects/modules.

buildscript {

    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.1'
        classpath 'com.google.gms:google-services:4.4.2'

        // NOTE: Do not place your application dependencies here; they belong
        // in the individual module build.gradle files
    }
}

apply from: "variables.gradle"

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

task clean(type: Delete) {
    delete rootProject.buildDir
}
BUILDEOF
echo "  ✓ build.gradle (AGP 8.2.1, google-services 4.4.2)"

# Fix package name in app/build.gradle
sed -i 's/namespace "com\..*"/namespace "com.codevel.invoicebaba"/' android/app/build.gradle
sed -i 's/applicationId "com\..*"/applicationId "com.codevel.invoicebaba"/' android/app/build.gradle
echo "  ✓ app/build.gradle (namespace=com.codevel.invoicebaba)"

# Fix strings.xml
cat > android/app/src/main/res/values/strings.xml << 'STREOF'
<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">Invoice Baba</string>
    <string name="title_activity_main">Invoice Baba</string>
    <string name="package_name">com.codevel.invoicebaba</string>
    <string name="custom_url_scheme">com.codevel.invoicebaba</string>
</resources>
STREOF
echo "  ✓ strings.xml"

# Fix Java package directory
mkdir -p android/app/src/main/java/com/codevel/invoicebaba
cat > android/app/src/main/java/com/codevel/invoicebaba/MainActivity.java << 'JAVAEOF'
package com.codevel.invoicebaba;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {}
JAVAEOF
rm -rf android/app/src/main/java/com/invoicebaba 2>/dev/null || true
echo "  ✓ MainActivity.java (com.codevel.invoicebaba)"

echo "=== Android configuration complete ==="
