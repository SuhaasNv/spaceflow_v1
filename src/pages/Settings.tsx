import { useState } from "react";
import { Settings as SettingsIcon, User, Bell, Moon, Sun, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTransition } from "@/components/animations";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Settings = () => {
  const { user } = useAuth();
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("sf-theme");
    return stored ? stored === "dark" : true;
  });
  const [notifications, setNotifications] = useState(true);
  const [checkInReminders, setCheckInReminders] = useState(true);
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("sf-theme", next ? "dark" : "light");
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
    toast.success("Profile updated");
  };

  const roleLabel: Record<string, string> = {
    ADMIN: "Administrator",
    FACILITIES_MANAGER: "Facilities Manager",
    EMPLOYEE: "Employee",
  };

  return (
    <PageTransition>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight flex items-center gap-2">
          <SettingsIcon className="h-7 w-7 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
      </div>

      <div className="space-y-6 max-w-xl">
        {/* Profile */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center gap-2">
              <User className="h-4 w-4" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">Full name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 max-w-sm" />
            </div>
            <div>
              <Label className="text-sm">Email</Label>
              <Input value={user?.email ?? ""} disabled className="mt-1 max-w-sm bg-muted" />
            </div>
            <div>
              <Label className="text-sm">Role</Label>
              <Input value={roleLabel[user?.role ?? ""] ?? user?.role ?? ""} disabled className="mt-1 max-w-sm bg-muted" />
            </div>
            <Button
              size="sm"
              className="gradient-primary text-primary-foreground"
              onClick={handleSaveProfile}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save profile"}
            </Button>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center gap-2">
              {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Dark mode</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {dark ? "Currently using dark theme" : "Currently using light theme"}
                </p>
              </div>
              <button
                onClick={toggleDark}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                  dark ? "bg-primary" : "bg-muted"
                }`}
                role="switch"
                aria-checked={dark}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
                    dark ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Bell className="h-4 w-4" /> Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "notifications", label: "Email notifications", description: "Booking confirmations and updates", value: notifications, onChange: setNotifications },
              { key: "checkInReminders", label: "Check-in reminders", description: "Get notified 15 minutes before your booking", value: checkInReminders, onChange: setCheckInReminders },
            ].map((pref) => (
              <div key={pref.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{pref.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{pref.description}</p>
                </div>
                <button
                  onClick={() => pref.onChange(!pref.value)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                    pref.value ? "bg-primary" : "bg-muted"
                  }`}
                  role="switch"
                  aria-checked={pref.value}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ${
                      pref.value ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default Settings;
