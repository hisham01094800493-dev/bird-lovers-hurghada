package com.birdlovers.hurghada;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

import androidx.annotation.Nullable;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {
    private static final int AUDIO_PERMISSION_REQUEST = 4101;
    private static final int MAX_INITIAL_LOAD_RETRIES = 3;
    private static final long INITIAL_RETRY_DELAY_MS = 1500L;

    private final Handler retryHandler = new Handler(Looper.getMainLooper());
    private PermissionRequest pendingPermissionRequest;
    private boolean initialPageLoaded = false;
    private boolean initialPageFailed = false;
    private boolean retryQueued = false;
    private int initialLoadRetryCount = 0;

    private final Runnable retryInitialPage = () -> {
        retryQueued = false;
        if (initialPageLoaded || bridge == null || isFinishing() || isDestroyed()) return;
        bridge.reload();
    };

    private final WebViewListener initialLoadListener = new WebViewListener() {
        @Override
        public void onPageLoaded(WebView webView) {
            initialPageLoaded = true;
            initialPageFailed = false;
            retryQueued = false;
            retryHandler.removeCallbacks(retryInitialPage);
        }

        @Override
        public void onPageCommitVisible(WebView webView, String url) {
            initialPageLoaded = true;
            initialPageFailed = false;
            retryQueued = false;
            retryHandler.removeCallbacks(retryInitialPage);
        }

        @Override
        public void onReceivedError(WebView webView) {
            // Capacitor reports network/DNS failures here. Limit retries to the
            // initial navigation; once any page finishes loading, stop retrying.
            initialPageFailed = true;
            scheduleInitialLoadRetry();
        }
    };

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        // Register before BridgeActivity creates and starts the WebView, so the
        // first transient DNS/network failure is not missed.
        bridgeBuilder.addWebViewListener(initialLoadListener);
        super.onCreate(savedInstanceState);

        if (bridge == null) return;

        bridge.getWebView().setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    boolean wantsAudio = false;
                    for (String resource : request.getResources()) {
                        if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) {
                            wantsAudio = true;
                            break;
                        }
                    }
                    if (!wantsAudio) {
                        request.deny();
                        return;
                    }
                    if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) {
                        request.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
                    } else {
                        pendingPermissionRequest = request;
                        ActivityCompat.requestPermissions(MainActivity.this, new String[]{Manifest.permission.RECORD_AUDIO}, AUDIO_PERMISSION_REQUEST);
                    }
                });
            }
        });
    }

    private void scheduleInitialLoadRetry() {
        if (initialPageLoaded || retryQueued || initialLoadRetryCount >= MAX_INITIAL_LOAD_RETRIES) return;
        retryQueued = true;
        initialLoadRetryCount++;
        long delay = INITIAL_RETRY_DELAY_MS * initialLoadRetryCount;
        retryHandler.postDelayed(retryInitialPage, delay);
    }

    @Override
    public void onResume() {
        super.onResume();
        // If the app was opened before connectivity returned, retry the initial
        // page automatically instead of requiring the user to press the screen.
        if (initialPageFailed && !initialPageLoaded) {
            if (initialLoadRetryCount >= MAX_INITIAL_LOAD_RETRIES) {
                initialLoadRetryCount = 0;
            }
            scheduleInitialLoadRetry();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != AUDIO_PERMISSION_REQUEST || pendingPermissionRequest == null) return;
        if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            pendingPermissionRequest.grant(new String[]{PermissionRequest.RESOURCE_AUDIO_CAPTURE});
        } else {
            pendingPermissionRequest.deny();
        }
        pendingPermissionRequest = null;
    }

    @Override
    public void onDestroy() {
        retryHandler.removeCallbacks(retryInitialPage);
        if (pendingPermissionRequest != null) {
            pendingPermissionRequest.deny();
            pendingPermissionRequest = null;
        }
        super.onDestroy();
    }
}
