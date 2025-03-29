export default function SettingsPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="block space-y-2 rounded-lg border p-4">
          <h2 className="font-semibold">General Settings</h2>
          <p className="text-sm text-muted-foreground">
            Configure your application settings
          </p>
        </div>
      </div>
    </>
  );
}
