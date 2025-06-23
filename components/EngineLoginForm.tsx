"use client";

import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import {
  useEngineUserStore,
  useEngineOperations,
} from "@/stores/EngineStoreProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ENGINE_CONFIG, getDefaultCredentials } from "@/engine.config";

interface EngineLoginFormProps {
  onSuccess?: () => void;
  className?: string;
}

const EngineLoginForm = observer(
  ({ onSuccess, className }: EngineLoginFormProps) => {
    const userStore = useEngineUserStore();
    const { loginToEngine, isLoading, hasError, errors } =
      useEngineOperations();

    const [credentials, setCredentials] = useState(() => {
      // Use default credentials in development mode
      const defaultCreds = getDefaultCredentials();
      return {
        userId: defaultCreds?.userId || "",
        apiKey: defaultCreds?.apiKey || "",
      };
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!credentials.userId || !credentials.apiKey) {
        return;
      }

      try {
        await loginToEngine(credentials.userId, credentials.apiKey);
        onSuccess?.();
      } catch (error) {
        console.error("Login failed:", error);
      }
    };

    const handleInputChange =
      (field: "userId" | "apiKey") =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials((prev) => ({
          ...prev,
          [field]: e.target.value,
        }));
      };

    if (userStore.isAuthenticated) {
      return (
        <Card className={className}>
          <CardHeader>
            <CardTitle className="text-green-600">
              Connected to Trading Engine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>User ID</Label>
                <p className="text-sm text-gray-600">
                  {userStore.currentUser?.username}
                </p>
              </div>
              <div>
                <Label>Status</Label>
                <p className="text-sm text-green-600">Authenticated</p>
              </div>
              <Button
                onClick={() => userStore.logout()}
                variant="outline"
                className="w-full"
              >
                Disconnect
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Connect to Trading Engine</CardTitle>
          <p className="text-sm text-gray-600">
            Enter your engine credentials to connect to the trading backend
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {hasError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {errors.length > 0
                    ? errors.join(", ")
                    : "Authentication failed"}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                type="text"
                value={credentials.userId}
                onChange={handleInputChange("userId")}
                placeholder="Enter your user ID"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={credentials.apiKey}
                onChange={handleInputChange("apiKey")}
                placeholder="Enter your API key"
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !credentials.userId || !credentials.apiKey}
            >
              {isLoading ? "Connecting..." : "Connect to Engine"}
            </Button>

            {ENGINE_CONFIG.FEATURES.DEBUG_MODE && (
              <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
                <p className="font-medium">Debug Info:</p>
                <p>Engine URL: {ENGINE_CONFIG.BASE_URL}</p>
                <p>
                  Auto-login:{" "}
                  {ENGINE_CONFIG.FEATURES.AUTO_LOGIN ? "Enabled" : "Disabled"}
                </p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    );
  }
);

EngineLoginForm.displayName = "EngineLoginForm";

export default EngineLoginForm;
