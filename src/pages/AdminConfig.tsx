import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sliders, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTransition } from "@/components/animations";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Config {
  [key: string]: unknown;
}

const CONFIG_KEYS: { key: string; label: string; description: string; type: "number" | "text" }[] = [
  { key: "booking.maxDurationHours", label: "Max booking duration (hours)", description: "Maximum hours a booking can last", type: "number" },
  { key: "booking.advanceBookingDays", label: "Advance booking limit (days)", description: "How many days ahead users can book", type: "number" },
  { key: "booking.autoReleaseMinutes", label: "Auto-release timeout (minutes)", description: "Cancel booking if no check-in after X minutes", type: "number" },
  { key: "workday.startHour", label: "Workday start (hour, 0-23)", description: "Start of the bookable workday", type: "number" },
  { key: "workday.endHour", label: "Workday end (hour, 0-23)", description: "End of the bookable workday", type: "number" },
  { key: "workday.timezone", label: "Timezone", description: "e.g. UTC, America/New_York, Europe/London", type: "text" },
];

const AdminConfig = () => {
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-config"],
    queryFn: () => api.get<{ config: Config }>("/api/admin/config"),
  });

  useEffect(() => {
    if (data?.config) {
      const vals: Record<string, string> = {};
      for (const [k, v] of Object.entries(data.config)) {
        vals[k] = String(v);
      }
      setFormValues(vals);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) => api.patch("/api/admin/config", values),
    onSuccess: () => {
      setDirty(false);
      toast.success("Configuration saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSave = () => {
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(formValues)) {
      const meta = CONFIG_KEYS.find((c) => c.key === k);
      payload[k] = meta?.type === "number" ? parseFloat(v) : v;
    }
    saveMutation.mutate(payload);
  };

  const handleChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  return (
    <PageTransition>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight flex items-center gap-2">
            <Sliders className="h-7 w-7 text-primary" />
            Platform Config
          </h1>
          <p className="text-muted-foreground mt-1">Adjust workspace booking rules and settings.</p>
        </div>
        <Button
          className="gradient-primary text-primary-foreground"
          disabled={!dirty || saveMutation.isPending}
          onClick={handleSave}
        >
          {saveMutation.isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</>
          ) : (
            <><Save className="h-4 w-4 mr-2" />Save changes</>
          )}
        </Button>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-display">Booking Rules</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6 max-w-lg">
              {CONFIG_KEYS.map((cfg) => (
                <div key={cfg.key}>
                  <Label className="text-sm font-medium">{cfg.label}</Label>
                  <p className="text-xs text-muted-foreground mb-1.5">{cfg.description}</p>
                  <Input
                    type={cfg.type}
                    value={formValues[cfg.key] ?? ""}
                    onChange={(e) => handleChange(cfg.key, e.target.value)}
                    className="max-w-xs"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
};

export default AdminConfig;
