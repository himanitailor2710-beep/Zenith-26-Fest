package com.zenith26.fest

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.os.Bundle
import android.view.View
import android.webkit.*
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader
import com.zenith26.fest.api.HybridApiBridge
import com.zenith26.fest.bridge.WebAppInterface
import com.zenith26.fest.databinding.ActivityAdminBinding

class AdminActivity : AppCompatActivity() {

    private lateinit var binding: ActivityAdminBinding
    private lateinit var assetLoader: WebViewAssetLoader
    private lateinit var hybridBridge: HybridApiBridge

    companion object {
        const val ASSET_ADMIN_URL = "https://appassets.androidplatform.net/assets/frontend/admin.html"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAdminBinding.inflate(layoutInflater)
        setContentView(binding.root)

        hybridBridge = HybridApiBridge(this)
        assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        setupToolbar()
        setupWebView()
        setupSwipeRefresh()
        setupBackNavigation()

        loadAdminUrl()
    }

    private fun setupToolbar() {
        binding.btnBackToStudent.setOnClickListener {
            finish()
        }

        binding.btnAdminRefresh.setOnClickListener {
            loadAdminUrl()
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val webView = binding.webView
        val settings = webView.settings

        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        webView.addJavascriptInterface(WebAppInterface(this, hybridBridge), "AndroidBridge")

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                binding.progressBar.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                binding.progressBar.visibility = View.GONE
                binding.swipeRefreshLayout.isRefreshing = false
                binding.errorContainer.visibility = View.GONE
                binding.webView.visibility = View.VISIBLE
            }

            override fun shouldInterceptRequest(
                view: WebView?,
                request: WebResourceRequest?
            ): WebResourceResponse? {
                if (request == null) return null
                val apiResponse = hybridBridge.handleRequest(request)
                if (apiResponse != null) {
                    return apiResponse
                }
                return assetLoader.shouldInterceptRequest(request.url)
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true) {
                    binding.webView.visibility = View.GONE
                    binding.errorContainer.visibility = View.VISIBLE
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                if (newProgress < 100) {
                    binding.progressBar.visibility = View.VISIBLE
                } else {
                    binding.progressBar.visibility = View.GONE
                }
            }
        }

        binding.btnRetry.setOnClickListener {
            binding.errorContainer.visibility = View.GONE
            loadAdminUrl()
        }
    }

    private fun setupSwipeRefresh() {
        binding.swipeRefreshLayout.setColorSchemeResources(
            R.color.amber_400,
            R.color.indigo_600
        )
        binding.swipeRefreshLayout.setProgressBackgroundColorSchemeResource(R.color.slate_900)
        binding.swipeRefreshLayout.setOnRefreshListener {
            loadAdminUrl()
        }
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (binding.webView.canGoBack()) {
                    binding.webView.goBack()
                } else {
                    isEnabled = false
                    finish()
                }
            }
        })
    }

    private fun loadAdminUrl() {
        binding.webView.loadUrl(ASSET_ADMIN_URL)
    }
}
