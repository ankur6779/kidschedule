# Keep WebView JS interfaces (none right now, but safe default)
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keep class androidx.webkit.** { *; }
