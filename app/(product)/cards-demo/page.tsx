"use client";

import { CoolCard, CoolCardDemo } from "@/components/ui/cool-card";
import {
  TrendingUp,
  BarChart3,
  IndianRupee,
  Zap,
  Eye,
  Brain,
  Shield,
} from "lucide-react";

export default function CardsDemo() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      {/* Full Demo */}
      <CoolCardDemo />

      {/* Trading Specific Examples */}
      <div className="max-w-7xl mx-auto p-8 mt-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Trading Dashboard Cards
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Perfect for your trading application with real-world examples
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
          {/* Strategy Performance Card */}
          <CoolCard
            variant="glass"
            title="Strategy Performance"
            icon={<TrendingUp className="h-5 w-5 text-green-600" />}
            footer="Updated 2 minutes ago"
          >
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    +₹2.4L
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Total P&L
                  </div>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">89.2%</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Win Rate
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Trades Today
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  42
                </span>
              </div>
            </div>
          </CoolCard>

          {/* Risk Management Card */}
          <CoolCard
            variant="neon"
            title="Risk Management"
            icon={<Shield className="h-5 w-5 text-orange-600" />}
            highlight
          >
            <div className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Portfolio Risk
                </span>
                <span className="text-sm font-semibold text-orange-600">
                  Medium
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Used Capital</span>
                  <span>68%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full w-[68%] bg-gradient-to-r from-orange-500 to-red-500 rounded-full" />
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Max drawdown: -₹45,000
              </div>
            </div>
          </CoolCard>

          {/* AI Strategy Card */}
          <CoolCard
            variant="pattern"
            title="AI Trading Bot"
            icon={<Brain className="h-5 w-5 text-purple-600" />}
            footer="Next trade in 3 minutes"
          >
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Status
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-semibold text-green-600">
                    Active
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-purple-600">1.2k</div>
                  <div className="text-xs text-gray-500">Signals</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-600">94.5%</div>
                  <div className="text-xs text-gray-500">Accuracy</div>
                </div>
              </div>
            </div>
          </CoolCard>

          {/* Market Watch Card */}
          <CoolCard
            variant="floating"
            title="Market Watch"
            icon={<Eye className="h-5 w-5 text-blue-600" />}
          >
            <div className="space-y-3 mt-4">
              {[
                { symbol: "NIFTY 50", price: "19,245.30", change: "+0.85%" },
                { symbol: "BANKNIFTY", price: "44,532.20", change: "+1.12%" },
                { symbol: "RELIANCE", price: "2,456.75", change: "-0.45%" },
              ].map((stock, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center text-sm"
                >
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {stock.symbol}
                    </div>
                    <div className="text-xs text-gray-500">₹{stock.price}</div>
                  </div>
                  <div
                    className={`font-semibold ${
                      stock.change.startsWith("+")
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {stock.change}
                  </div>
                </div>
              ))}
            </div>
          </CoolCard>

          {/* Quick Actions Card */}
          <CoolCard
            variant="gradient"
            title="Quick Actions"
            icon={<Zap className="h-5 w-5 text-yellow-600" />}
          >
            <div className="space-y-3 mt-4">
              <button className="w-full p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                New Strategy
              </button>
              <button className="w-full p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                Place Order
              </button>
              <button className="w-full p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">
                Backtest
              </button>
            </div>
          </CoolCard>

          {/* Portfolio Summary Card */}
          <CoolCard
            variant="default"
            title="Portfolio Summary"
            icon={<BarChart3 className="h-5 w-5 text-gray-600" />}
            footer="As of today, 3:45 PM"
          >
            <div className="space-y-4 mt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  ₹15.8L
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Value
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div className="font-semibold text-green-600">+₹2.4L</div>
                  <div className="text-gray-500">Realized</div>
                </div>
                <div>
                  <div className="font-semibold text-blue-600">+₹1.2L</div>
                  <div className="text-gray-500">Unrealized</div>
                </div>
                <div>
                  <div className="font-semibold text-purple-600">₹12.2L</div>
                  <div className="text-gray-500">Invested</div>
                </div>
              </div>
            </div>
          </CoolCard>
        </div>

        {/* Large Feature Cards */}
        <div className="grid gap-8 md:grid-cols-2 mb-16">
          <CoolCard variant="glass" className="md:col-span-1">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <IndianRupee className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Premium Strategy Pack
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Advanced algorithmic trading strategies
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-white/50 dark:bg-zinc-800/50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">12</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Strategies
                  </div>
                </div>
                <div className="p-3 bg-white/50 dark:bg-zinc-800/50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">94.2%</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Success Rate
                  </div>
                </div>
                <div className="p-3 bg-white/50 dark:bg-zinc-800/50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">₹50L</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Max Capital
                  </div>
                </div>
              </div>

              <button className="w-full p-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all transform hover:scale-105">
                Upgrade Now
              </button>
            </div>
          </CoolCard>

          <CoolCard variant="neon" className="md:col-span-1">
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Today's Performance
                </h3>
                <div className="text-4xl font-bold text-green-600 mb-1">
                  +₹42,350
                </div>
                <div className="text-sm text-green-600 font-medium">
                  +2.89% • Best day this month!
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Winning Trades
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    23/27
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full w-[85%] bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
                </div>
                <div className="text-xs text-center text-gray-600 dark:text-gray-400">
                  85% win rate today
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <div className="text-sm font-bold text-green-600">₹1,847</div>
                  <div className="text-xs text-gray-500">Avg Profit</div>
                </div>
                <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <div className="text-sm font-bold text-red-600">₹425</div>
                  <div className="text-xs text-gray-500">Avg Loss</div>
                </div>
              </div>
            </div>
          </CoolCard>
        </div>
      </div>
    </div>
  );
}
