import { getSystemSettings } from "./actions";
import { SettingsEditor } from "./SettingsEditor";

export default async function AdminSettingsPage() {
  const settings = await getSystemSettings();

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-3xl font-bold font-outfit tracking-tight">API & System Settings</h1>
        <p className="text-muted-foreground">Manage your supplier connections and payment gateways.</p>
      </div>

      <SettingsEditor initialSettings={settings} />
    </div>
  );
}
