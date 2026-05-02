# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# react-native-html-to-pdf (PDFBox dependencies)
-dontwarn com.gemalto.jp2.**
-dontwarn com.github.jai_imageio.**
-dontwarn javax.xml.stream.**
-dontwarn org.apache.pdfbox.rendering.PDFRenderer
-dontwarn org.apache.pdfbox.pdmodel.font.FileSystemFontProvider
-dontwarn org.apache.pdfbox.pdmodel.font.FontMapperImpl

# react-native-sqlite-storage
-keep class io.sqlcipher.** { *; }
-dontwarn io.sqlcipher.**
