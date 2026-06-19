# Capacitor
-keep class com.getcapacitor.** { *; }
-keep class com.mrrobot.lottoai.** { *; }

# AndroidX
-keep class androidx.** { *; }
-keepattributes *Annotation*

# WebView JavaScript Interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Kotlin
-keep class kotlin.** { *; }
-dontwarn kotlin.**

# Serialization
-keepattributes Signature
-keepattributes EnclosingMethod
