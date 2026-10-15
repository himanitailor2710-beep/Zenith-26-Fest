package com.zenith26.fest

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Bitmap
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.webkit.*
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader
import com.google.android.material.textfield.TextInputEditText
import com.zenith26.fest.api.HybridApiBridge
import com.zenith26.fest.api.NetworkConfig
import com.zenith26.fest.bridge.WebAppInterface
import com.zenith26.fest.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var assetLoader: WebViewAssetLoader
    private lateinit var hybridBridge: HybridApiBridge

    companion object {
        const val ASSET_BASE_URL = "https://appassets.androidplatform.net/assets/frontend/index.html"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        hybridBridge = HybridApiBridge(this)
        assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        setupToolbar()
        setupWebView()
        setupSwipeRefresh()
        setupErrorView()
        setupBackNavigation()

        loadPortalUrl()
    }

    private fun setupToolbar() {
        binding.btnNavAdmin.setOnClickListener {
            val intent = Intent(this, AdminActivity::class.java)
            startActivity(intent)
        }

        binding.btnServerSettings.setOnClickListener {
            showServerConfigDialog()
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
                injectFetchBridge(view)
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                binding.progressBar.visibility = View.GONE
                binding.swipeRefreshLayout.isRefreshing = false
                binding.errorContainer.visibility = View.GONE
                binding.webView.visibility = View.VISIBLE
                injectFetchBridge(view)
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
    }

    private fun injectFetchBridge(view: WebView?) {
        val js = """
            (function() {
              if (window.__zenithFetchHooked) return;
              window.__zenithFetchHooked = true;
              const _origFetch = window.fetch;
              window.fetch = async function(url, options) {
                const uStr = url ? url.toString() : "";
                if (options && options.method && options.method.toUpperCase() === 'POST' && window.AndroidBridge && window.AndroidBridge.postApi) {
                  try {
                    const raw = window.AndroidBridge.postApi(uStr, options.body || '{}');
                    const parsed = JSON.parse(raw);
                    return new Response(parsed.body, {
                      status: parsed.status,
                      statusText: parsed.status === 201 ? 'Created' : (parsed.status === 400 ? 'Bad Request' : (parsed.status === 409 ? 'Conflict' : 'OK')),
                      headers: { 'Content-Type': 'application/json' }
                    });
                  } catch(e) {
                    console.error("AndroidBridge error", e);
                  }
                }
                return _origFetch(url, options);
              };
            })();
        """.trimIndent()
        view?.evaluateJavascript(js, null)
    }

    private fun setupSwipeRefresh() {
        binding.swipeRefreshLayout.setColorSchemeResources(
            R.color.indigo_600,
            R.color.purple_600,
            R.color.pink_500
        )
        binding.swipeRefreshLayout.setProgressBackgroundColorSchemeResource(R.color.slate_900)
        binding.swipeRefreshLayout.setOnRefreshListener {
            loadPortalUrl()
        }
    }

    private fun setupErrorView() {
        binding.btnRetry.setOnClickListener {
            binding.errorContainer.visibility = View.GONE
            binding.progressBar.visibility = View.VISIBLE
            loadPortalUrl()
        }

        binding.btnConfigureServer.setOnClickListener {
            showServerConfigDialog()
        }
    }

    private fun setupBackNavigation() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val webView = binding.webView
                webView.evaluateJavascript(
                    "(function() { var m = document.getElementById('detail-modal'); if (m && !m.classList.contains('hidden')) { m.classList.add('hidden'); document.body.classList.remove('overflow-hidden'); return true; } return false; })();"
                ) { result ->
                    val modalWasOpen = result == "true"
                    if (!modalWasOpen) {
                        if (webView.canGoBack()) {
                            webView.goBack()
                        } else {
                            isEnabled = false
                            onBackPressedDispatcher.onBackPressed()
                        }
                    }
                }
            }
        })
    }

    private fun loadPortalUrl() {
        binding.webView.loadUrl(ASSET_BASE_URL)
    }

    private fun showServerConfigDialog() {
        val dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_server_config, null)
        val etUrl = dialogView.findViewById<TextInputEditText>(R.id.etServerUrl)
        etUrl.setText(NetworkConfig.getBaseUrl(this))

        AlertDialog.Builder(this, R.style.Theme_Zenith26)
            .setView(dialogView)
            .setPositiveButton("Save") { _, _ ->
                val newUrl = etUrl.text?.toString()?.trim()
                if (!newUrl.isNullOrEmpty()) {
                    NetworkConfig.setBaseUrl(this, newUrl)
                    Toast.makeText(this, "Remote server set to $newUrl", Toast.LENGTH_SHORT).show()
                    loadPortalUrl()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
}
