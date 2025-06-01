"use client";

import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import StrategyTable from "@/app/components/StrategyTable";
import { useStrategyStore } from '@/stores';
import { useUser } from '@/contexts/user-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from "@/components/ui/card";
import { Plus, RefreshCw } from 'lucide-react';

const StrategiesPage = observer(() => {
    const { user } = useUser();
    const strategyStore = useStrategyStore();

    useEffect(() => {
        if (user?.id) {
            strategyStore.fetchStrategies(user.id);
        }
    }, [user?.id, strategyStore]);

    const handleRefresh = () => {
        if (user?.id) {
            strategyStore.fetchStrategies(user.id);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                <Card className="w-96">
                    <CardContent className="text-center p-8">
                        <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
                        <p className="text-gray-600">Please log in to view your trading strategies.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Trading Strategies
                        </h1>
                        <p className="text-gray-600">
                            Manage and monitor your automated trading strategies
                        </p>
                    </div>
                    
                    <div className="flex items-center space-x-3 mt-4 md:mt-0">
                        <Button
                            variant="outline"
                            onClick={handleRefresh}
                            disabled={strategyStore.isLoading}
                            className="flex items-center space-x-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${strategyStore.isLoading ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                        </Button>
                        
                        <Button className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                            <Plus className="h-4 w-4" />
                            <span>New Strategy</span>
                        </Button>
                    </div>
                </div>

                {/* Error State */}
                {strategyStore.error && (
                    <Card className="mb-6 border-red-200 bg-red-50">
                        <CardContent className="flex items-center space-x-3 p-4">
                            <div className="h-2 w-2 rounded-full bg-red-500"></div>
                            <p className="text-red-700">{strategyStore.error}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => strategyStore.clearError()}
                                className="ml-auto"
                            >
                                Dismiss
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Strategy Table */}
                <StrategyTable 
                    strategies={strategyStore.strategies}
                    isLoading={strategyStore.isLoading}
                    onRefresh={handleRefresh}
                />
            </div>
        </div>
    );
});

export default StrategiesPage; 