export interface Strategy {
  id: string;
  name: string;
  margin: number;
  marginType: "percentage" | "rupees";
  basePrice: number; // Base price for calculating margin in rupees
  status: "active" | "inactive";
  lastUpdated: string;
}

const strategyNames = [
  "MACD Crossover",
  "RSI Divergence",
  "Moving Average",
  "Bollinger Bands",
  "Fibonacci Retracement",
  "Price Action",
  "Trend Following",
  "Mean Reversion",
  "Breakout Trading",
  "Momentum Trading",
];

export function generateRandomStrategies(count: number = 5): Strategy[] {
  return Array.from({ length: count }, (_, index) => ({
    id: (index + 1).toString(),
    name: strategyNames[Math.floor(Math.random() * strategyNames.length)],
    margin: parseFloat((Math.random() * 20 + 5).toFixed(2)), // Random margin between 5 and 25
    marginType: Math.random() > 0.5 ? "percentage" : "rupees",
    basePrice: parseFloat((Math.random() * 1000 + 500).toFixed(2)), // Random base price between 500 and 1500
    status: Math.random() > 0.5 ? "active" : "inactive",
    lastUpdated: new Date(
      Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
    ).toLocaleDateString(), // Random date within last 30 days
  }));
}
