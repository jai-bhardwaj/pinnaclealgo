"use client";

import { useState } from 'react';
import { useUser } from '@/contexts/user-context';

export default function SettingsPage() {
    const { user } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const [brokerConfig, setBrokerConfig] = useState({
        apiKey: '',
        clientId: '',
        password: '',
        totpSecret: ''
    });

    const [preferences, setPreferences] = useState({
        notifications: true,
        emailAlerts: false,
        riskLevel: 'medium',
        defaultQuantity: 1
    });

    const handleBrokerConfigSave = async () => {
        setIsLoading(true);
        try {
            // Mock save - replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            setMessage('Broker configuration saved successfully');
        } catch (error) {
            setMessage('Failed to save broker configuration');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePreferencesSave = async () => {
        setIsLoading(true);
        try {
            // Mock save - replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            setMessage('Preferences saved successfully');
        } catch (error) {
            setMessage('Failed to save preferences');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            </div>

            {message && (
                <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
                    {message}
                </div>
            )}

            {/* User Profile */}
            <div className="bg-white rounded-lg shadow border">
                <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold">User Profile</h3>
                </div>
                <div className="p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                value={user?.username || ''}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Broker Configuration */}
            <div className="bg-white rounded-lg shadow border">
                <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold">Broker Configuration</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Configure your broker API credentials for live trading
                    </p>
                </div>
                <div className="p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                API Key
                            </label>
                            <input
                                type="password"
                                value={brokerConfig.apiKey}
                                onChange={(e) => setBrokerConfig({ ...brokerConfig, apiKey: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your API key"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Client ID
                            </label>
                            <input
                                type="text"
                                value={brokerConfig.clientId}
                                onChange={(e) => setBrokerConfig({ ...brokerConfig, clientId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your client ID"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={brokerConfig.password}
                                onChange={(e) => setBrokerConfig({ ...brokerConfig, password: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your password"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                TOTP Secret
                            </label>
                            <input
                                type="password"
                                value={brokerConfig.totpSecret}
                                onChange={(e) => setBrokerConfig({ ...brokerConfig, totpSecret: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter your TOTP secret"
                            />
                        </div>
                    </div>
                    <div className="mt-6">
                        <button
                            onClick={handleBrokerConfigSave}
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                        >
                            {isLoading ? 'Saving...' : 'Save Broker Configuration'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Trading Preferences */}
            <div className="bg-white rounded-lg shadow border">
                <div className="p-6 border-b">
                    <h3 className="text-lg font-semibold">Trading Preferences</h3>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Enable Notifications
                                </label>
                                <p className="text-sm text-gray-500">
                                    Receive notifications for order updates and alerts
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={preferences.notifications}
                                onChange={(e) => setPreferences({ ...preferences, notifications: e.target.checked })}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Email Alerts
                                </label>
                                <p className="text-sm text-gray-500">
                                    Send important alerts to your email
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={preferences.emailAlerts}
                                onChange={(e) => setPreferences({ ...preferences, emailAlerts: e.target.checked })}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Risk Level
                            </label>
                            <select
                                value={preferences.riskLevel}
                                onChange={(e) => setPreferences({ ...preferences, riskLevel: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="low">Low Risk</option>
                                <option value="medium">Medium Risk</option>
                                <option value="high">High Risk</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Default Quantity
                            </label>
                            <input
                                type="number"
                                value={preferences.defaultQuantity}
                                onChange={(e) => setPreferences({ ...preferences, defaultQuantity: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                min="1"
                            />
                        </div>
                    </div>

                    <div className="mt-6">
                        <button
                            onClick={handlePreferencesSave}
                            disabled={isLoading}
                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                        >
                            {isLoading ? 'Saving...' : 'Save Preferences'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-lg shadow border border-red-200">
                <div className="p-6 border-b border-red-200">
                    <h3 className="text-lg font-semibold text-red-600">Danger Zone</h3>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-sm font-medium text-gray-700">Reset All Settings</h4>
                            <p className="text-sm text-gray-500 mb-2">
                                This will reset all your settings to default values
                            </p>
                            <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                                Reset Settings
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 