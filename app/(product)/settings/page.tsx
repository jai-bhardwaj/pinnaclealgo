import { StrategyTable } from "@/app/components/StrategyTable";

export default function SettingsPage() {
  return (
    <>
      <div className="grid gap-6">
        <div className="block space-y-2">
          <h2 className="text-xl font-semibold">Strategy Management</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Manage your trading strategies, margins, and status
          </p>
          <StrategyTable />
        </div>
      </div>
    </>
  );
}
