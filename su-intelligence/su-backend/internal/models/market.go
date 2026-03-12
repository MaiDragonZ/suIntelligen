package models

type Asset struct {
	Symbol string  `json:"symbol"`
	Name   string  `json:"name"`
	Price  float64 `json:"price"`
	Change float64 `json:"change"`
	Open   float64 `json:"open"`
	High   float64 `json:"high"`
	Low    float64 `json:"low"`
	Volume string  `json:"volume"`
	Cap    string  `json:"cap"`
}

type ChartPoint struct {
	T     string  `json:"t"`
	Open  float64 `json:"open"`
	High  float64 `json:"high"`
	Low   float64 `json:"low"`
	Close float64 `json:"close"`
	Value float64 `json:"value"`
}

type MarketSummary struct {
	TotalVolume  string `json:"total_volume"`
	GainersCount int    `json:"gainers_count"`
	LosersCount  int    `json:"losers_count"`
}
