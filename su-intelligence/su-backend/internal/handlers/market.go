package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"su-intelligence/internal/models"
	"su-intelligence/pkg/response"
)

// รายการ symbols ที่ต้องการ
var symbolMeta = map[string]string{
	"BTC":  "Bitcoin",
	"ETH":  "Ethereum",
	"SOL":  "Solana",
	"AAPL": "Apple",
	"NVDA": "NVIDIA",
	"TSLA": "Tesla",
}

// แยก crypto / stock
var cryptoSymbols = map[string]bool{"BTC": true, "ETH": true, "SOL": true}

// Simple cache — ป้องกัน rate limit (free tier = 25 req/day สำหรับ premium, 5 req/min standard)
type cache struct {
	mu      sync.RWMutex
	data    map[string]cacheEntry
}

type cacheEntry struct {
	value     interface{}
	expiresAt time.Time
}

var globalCache = &cache{data: make(map[string]cacheEntry)}

func (c *cache) get(key string) (interface{}, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	e, ok := c.data[key]
	if !ok || time.Now().After(e.expiresAt) {
		return nil, false
	}
	return e.value, true
}

func (c *cache) set(key string, value interface{}, ttl time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.data[key] = cacheEntry{value: value, expiresAt: time.Now().Add(ttl)}
}

// ── Alpha Vantage fetchers ────────────────────────────────────────────

func avKey() string {
	return os.Getenv("ALPHA_VANTAGE_KEY")
}

// fetchQuote — ดึง GLOBAL_QUOTE สำหรับ stock
func fetchStockQuote(symbol string) (*models.Asset, error) {
	cacheKey := "quote_" + symbol
	if v, ok := globalCache.get(cacheKey); ok {
		return v.(*models.Asset), nil
	}

	url := fmt.Sprintf(
		"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=%s&apikey=%s",
		symbol, avKey(),
	)
	body, err := httpGet(url)
	if err != nil {
		return nil, err
	}

	var resp struct {
		GlobalQuote struct {
			Symbol        string `json:"01. symbol"`
			Open          string `json:"02. open"`
			High          string `json:"03. high"`
			Low           string `json:"04. low"`
			Price         string `json:"05. price"`
			Volume        string `json:"06. volume"`
			ChangePercent string `json:"10. change percent"`
		} `json:"Global Quote"`
	}
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, err
	}

	q := resp.GlobalQuote
	asset := &models.Asset{
		Symbol: symbol,
		Name:   symbolMeta[symbol],
		Price:  parseFloat(q.Price),
		Open:   parseFloat(q.Open),
		High:   parseFloat(q.High),
		Low:    parseFloat(q.Low),
		Change: parsePercent(q.ChangePercent),
		Volume: formatVolume(parseInt(q.Volume)),
		Cap:    "N/A",
	}

	globalCache.set(cacheKey, asset, 5*time.Minute)
	return asset, nil
}

// fetchCryptoQuote — ดึง CURRENCY_EXCHANGE_RATE สำหรับ crypto
func fetchCryptoQuote(symbol string) (*models.Asset, error) {
	cacheKey := "crypto_" + symbol
	if v, ok := globalCache.get(cacheKey); ok {
		return v.(*models.Asset), nil
	}

	url := fmt.Sprintf(
		"https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=%s&to_currency=USD&apikey=%s",
		symbol, avKey(),
	)
	body, err := httpGet(url)
	if err != nil {
		return nil, err
	}

	var resp struct {
		Rate struct {
			FromCode string `json:"1. From_Currency Code"`
			ToCode   string `json:"3. To_Currency Code"`
			Rate     string `json:"5. Exchange Rate"`
			BidPrice string `json:"8. Bid Price"`
			AskPrice string `json:"9. Ask Price"`
		} `json:"Realtime Currency Exchange Rate"`
	}
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, err
	}

	price := parseFloat(resp.Rate.Rate)
	asset := &models.Asset{
		Symbol: symbol,
		Name:   symbolMeta[symbol],
		Price:  price,
		Open:   parseFloat(resp.Rate.BidPrice),
		High:   price,
		Low:    price,
		Change: 0, // exchange rate endpoint ไม่มี % change
		Volume: "N/A",
		Cap:    "N/A",
	}

	globalCache.set(cacheKey, asset, 5*time.Minute)
	return asset, nil
}

// fetchChart — ดึง TIME_SERIES_INTRADAY (60min) สำหรับ stock
func fetchStockChart(symbol string) ([]models.ChartPoint, error) {
	cacheKey := "chart_" + symbol
	if v, ok := globalCache.get(cacheKey); ok {
		return v.([]models.ChartPoint), nil
	}

	url := fmt.Sprintf(
		"https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=%s&interval=60min&outputsize=compact&apikey=%s",
		symbol, avKey(),
	)
	body, err := httpGet(url)
	if err != nil {
		return nil, err
	}

	var resp map[string]json.RawMessage
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, err
	}

	// หา key ที่ชื่อ "Time Series (60min)"
	tsRaw, ok := resp["Time Series (60min)"]
	if !ok {
		return nil, fmt.Errorf("no time series data for %s", symbol)
	}

	var ts map[string]struct {
		Open   string `json:"1. open"`
		High   string `json:"2. high"`
		Low    string `json:"3. low"`
		Close  string `json:"4. close"`
		Volume string `json:"5. volume"`
	}
	if err := json.Unmarshal(tsRaw, &ts); err != nil {
		return nil, err
	}

	// เรียงและเอาแค่ 24 จุดล่าสุด
	points := make([]models.ChartPoint, 0, len(ts))
	for t, v := range ts {
		close := parseFloat(v.Close)
		points = append(points, models.ChartPoint{
			T:     t,
			Open:  parseFloat(v.Open),
			High:  parseFloat(v.High),
			Low:   parseFloat(v.Low),
			Close: close,
			Value: close,
		})
	}

	// sort by time descending แล้วเอา 24 ตัวแรก
	for i := 0; i < len(points)-1; i++ {
		for j := i + 1; j < len(points); j++ {
			if points[i].T < points[j].T {
				points[i], points[j] = points[j], points[i]
			}
		}
	}
	if len(points) > 24 {
		points = points[:24]
	}
	// reverse ให้เรียงจากเก่าไปใหม่
	for i, j := 0, len(points)-1; i < j; i, j = i+1, j-1 {
		points[i], points[j] = points[j], points[i]
	}

	globalCache.set(cacheKey, points, 10*time.Minute)
	return points, nil
}

// ── Handler ───────────────────────────────────────────────────────────

type MarketHandler struct{}

func NewMarketHandler() *MarketHandler { return &MarketHandler{} }

// GET /market/assets
func (h *MarketHandler) ListAssets(c *gin.Context) {
	symbols := []string{"BTC", "ETH", "SOL", "AAPL", "NVDA", "TSLA"}

	type result struct {
		asset *models.Asset
		err   error
		idx   int
	}

	ch := make(chan result, len(symbols))
	for i, sym := range symbols {
		go func(idx int, s string) {
			var a *models.Asset
			var err error
			if cryptoSymbols[s] {
				a, err = fetchCryptoQuote(s)
			} else {
				a, err = fetchStockQuote(s)
			}
			ch <- result{a, err, idx}
		}(i, sym)
	}

	assets := make([]*models.Asset, len(symbols))
	for range symbols {
		r := <-ch
		if r.err != nil {
			// fallback — ส่ง stub แทน error
			assets[r.idx] = &models.Asset{Symbol: symbols[r.idx], Name: symbolMeta[symbols[r.idx]], Price: 0}
		} else {
			assets[r.idx] = r.asset
		}
	}

	response.OK(c, assets)
}

// GET /market/assets/:symbol
func (h *MarketHandler) GetAsset(c *gin.Context) {
	sym := strings.ToUpper(c.Param("symbol"))
	if _, ok := symbolMeta[sym]; !ok {
		response.NotFound(c, "asset not found")
		return
	}

	var asset *models.Asset
	var err error
	if cryptoSymbols[sym] {
		asset, err = fetchCryptoQuote(sym)
	} else {
		asset, err = fetchStockQuote(sym)
	}
	if err != nil {
		response.InternalError(c, err)
		return
	}
	response.OK(c, asset)
}

// GET /market/assets/:symbol/chart
func (h *MarketHandler) GetChart(c *gin.Context) {
	sym := strings.ToUpper(c.Param("symbol"))

	// Crypto ไม่มี intraday ใน free tier — fallback ใช้ daily
	if cryptoSymbols[sym] {
		points, err := fetchCryptoDailyChart(sym)
		if err != nil {
			response.InternalError(c, err)
			return
		}
		response.OK(c, points)
		return
	}

	points, err := fetchStockChart(sym)
	if err != nil {
		response.InternalError(c, err)
		return
	}
	response.OK(c, points)
}

// fetchCryptoDailyChart — ใช้ DIGITAL_CURRENCY_DAILY สำหรับ crypto
func fetchCryptoDailyChart(symbol string) ([]models.ChartPoint, error) {
	cacheKey := "crypto_chart_" + symbol
	if v, ok := globalCache.get(cacheKey); ok {
		return v.([]models.ChartPoint), nil
	}

	url := fmt.Sprintf(
		"https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY&symbol=%s&market=USD&apikey=%s",
		symbol, avKey(),
	)
	body, err := httpGet(url)
	if err != nil {
		return nil, err
	}

	var resp map[string]json.RawMessage
	if err := json.Unmarshal(body, &resp); err != nil {
		return nil, err
	}

	tsRaw, ok := resp["Time Series (Digital Currency Daily)"]
	if !ok {
		return nil, fmt.Errorf("no crypto daily data for %s", symbol)
	}

	var ts map[string]map[string]string
	if err := json.Unmarshal(tsRaw, &ts); err != nil {
		return nil, err
	}

	points := make([]models.ChartPoint, 0, 24)
	for t, v := range ts {
		close := parseFloat(v["4a. close (USD)"])
		points = append(points, models.ChartPoint{
			T:     t,
			Open:  parseFloat(v["1a. open (USD)"]),
			High:  parseFloat(v["2a. high (USD)"]),
			Low:   parseFloat(v["3a. low (USD)"]),
			Close: close,
			Value: close,
		})
		if len(points) >= 24 {
			break
		}
	}

	for i, j := 0, len(points)-1; i < j; i, j = i+1, j-1 {
		points[i], points[j] = points[j], points[i]
	}

	globalCache.set(cacheKey, points, 30*time.Minute)
	return points, nil
}

// GET /market/summary
func (h *MarketHandler) Summary(c *gin.Context) {
	if v, ok := globalCache.get("summary"); ok {
		response.OK(c, v)
		return
	}
	// ใช้ hardcode summary เพราะ free tier มี limit
	s := models.MarketSummary{
		TotalVolume:  "N/A",
		GainersCount: 0,
		LosersCount:  0,
	}
	globalCache.set("summary", s, 5*time.Minute)
	response.OK(c, s)
}

// ── Helpers ───────────────────────────────────────────────────────────

func httpGet(url string) ([]byte, error) {
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	return io.ReadAll(resp.Body)
}

func parseFloat(s string) float64 {
	s = strings.TrimSpace(s)
	v, _ := strconv.ParseFloat(s, 64)
	return v
}

func parsePercent(s string) float64 {
	s = strings.TrimSuffix(strings.TrimSpace(s), "%")
	v, _ := strconv.ParseFloat(s, 64)
	return v
}

func parseInt(s string) int64 {
	s = strings.TrimSpace(s)
	v, _ := strconv.ParseInt(s, 10, 64)
	return v
}

func formatVolume(n int64) string {
	if n == 0 {
		return "N/A"
	}
	if n >= 1_000_000_000 {
		return fmt.Sprintf("%.1fB", float64(n)/1_000_000_000)
	}
	if n >= 1_000_000 {
		return fmt.Sprintf("%.1fM", float64(n)/1_000_000)
	}
	if n >= 1_000 {
		return fmt.Sprintf("%.1fK", float64(n)/1_000)
	}
	return fmt.Sprintf("%d", n)
}
