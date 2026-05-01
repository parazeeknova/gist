package middleware

import (
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func TestRateLimiter_AllowsUnderLimit(t *testing.T) {
	limiter := NewRateLimiter(5, time.Minute)

	for i := 0; i < 5; i++ {
		if !limiter.Allow("test-key") {
			t.Errorf("request %d should have been allowed", i+1)
		}
	}
}

func TestRateLimiter_BlocksOverLimit(t *testing.T) {
	limiter := NewRateLimiter(3, time.Minute)

	for i := 0; i < 3; i++ {
		if !limiter.Allow("test-key") {
			t.Fatalf("request %d should have been allowed", i+1)
		}
	}

	if limiter.Allow("test-key") {
		t.Error("4th request should have been blocked")
	}
}

func TestRateLimiter_DifferentKeysIndependent(t *testing.T) {
	limiter := NewRateLimiter(2, time.Minute)

	// Exhaust key-1
	limiter.Allow("key-1")
	limiter.Allow("key-1")

	if limiter.Allow("key-1") {
		t.Error("key-1 should be blocked")
	}

	// key-2 should still work
	if !limiter.Allow("key-2") {
		t.Error("key-2 should be allowed")
	}
}

func TestRateLimiter_Cleanup(t *testing.T) {
	limiter := NewRateLimiter(1, 10*time.Millisecond)

	if !limiter.Allow("key") {
		t.Fatal("first request should be allowed")
	}

	// Wait for the window to expire
	time.Sleep(15 * time.Millisecond)

	if !limiter.Allow("key") {
		t.Error("request after window expiry should be allowed")
	}
}

func TestRateLimiter_Concurrent(t *testing.T) {
	limiter := NewRateLimiter(100, time.Minute)
	var wg sync.WaitGroup
	allowed := 0
	var mu sync.Mutex

	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if limiter.Allow("concurrent-key") {
				mu.Lock()
				allowed++
				mu.Unlock()
			}
		}()
	}

	wg.Wait()

	if allowed != 100 {
		t.Errorf("all 100 concurrent requests should be allowed, got %d", allowed)
	}
}

func TestRateLimitLogin_Middleware(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/auth/login", RateLimitLogin(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Should allow up to 5 requests from the same IP
	for i := 0; i < 5; i++ {
		w := httptest.NewRecorder()
		req, _ := http.NewRequest("POST", "/auth/login", nil)
		r.ServeHTTP(w, req)

		if w.Code != http.StatusOK {
			t.Errorf("request %d: status = %d, want %d", i+1, w.Code, http.StatusOK)
		}
	}

	// 6th request should be rate-limited
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/auth/login", nil)
	r.ServeHTTP(w, req)

	if w.Code != http.StatusTooManyRequests {
		t.Errorf("6th request: status = %d, want %d", w.Code, http.StatusTooManyRequests)
	}
}
