package com.zenith26.fest.api

import android.content.Context
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

/**
 * Singleton factory creating Retrofit service instances pointing to the configured FastAPI server.
 */
object ApiClient {
    private var retrofitInstance: Retrofit? = null
    private var serviceInstance: ZenithApiService? = null

    @Synchronized
    fun getService(context: Context): ZenithApiService {
        if (serviceInstance == null) {
            val baseUrl = NetworkConfig.getBaseUrl(context)
            val client = OkHttpClient.Builder()
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(15, TimeUnit.SECONDS)
                .writeTimeout(15, TimeUnit.SECONDS)
                .addInterceptor(HttpLoggingInterceptor().apply {
                    level = HttpLoggingInterceptor.Level.BASIC
                })
                .build()

            val retrofit = Retrofit.Builder()
                .baseUrl(baseUrl)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build()

            retrofitInstance = retrofit
            serviceInstance = retrofit.create(ZenithApiService::class.java)
        }
        return serviceInstance!!
    }

    @Synchronized
    fun resetClient() {
        retrofitInstance = null
        serviceInstance = null
    }
}
