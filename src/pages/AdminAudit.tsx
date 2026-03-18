import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageTransition } from "@/components/animations";
import { api } from "@/lib/api";

interface AuditLog {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  ip: string | null;
  durationMs: number | null;
  timestamp: string;
  user: { name: string; email: string } | null;
}

interface AuditResponse {
  logs: AuditLog[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

const methodColors: Record<string, string> = {
  GET: "text-blue-600 dark:text-blue-400",
  POST: "text-green-600 dark:text-green-400",
  PATCH: "text-amber-600 dark:text-amber-400",
  DELETE: "text-destructive",
};

const AdminAudit = () => {
  const [page, setPage] = useState(1);
  const [pathFilter, setPathFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");

  const params = new URLSearchParams({
    page: String(page),
    limit: "50",
    ...(pathFilter ? { path: pathFilter } : {}),
    ...(methodFilter ? { method: methodFilter } : {}),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["audit", page, pathFilter, methodFilter],
    queryFn: () => api.get<AuditResponse>(`/api/admin/audit?${params}`),
  });

  const logs = data?.logs ?? [];
  const pagination = data?.pagination;

  function formatTime(dt: string) {
    return new Date(dt).toLocaleString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  }

  return (
    <PageTransition>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight flex items-center gap-2">
          <FileText className="h-7 w-7 text-primary" />
          Audit Log
        </h1>
        <p className="text-muted-foreground mt-1">All API calls — who did what, when.</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <Input
          placeholder="Filter by path…"
          value={pathFilter}
          onChange={(e) => { setPathFilter(e.target.value); setPage(1); }}
          className="w-56"
        />
        <Input
          placeholder="Filter by method (GET, POST…)"
          value={methodFilter}
          onChange={(e) => { setMethodFilter(e.target.value.toUpperCase()); setPage(1); }}
          className="w-48"
        />
      </div>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-display">API Calls</CardTitle>
            {pagination && (
              <span className="text-sm text-muted-foreground">
                {pagination.total} total
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2 pr-4 font-medium">Timestamp</th>
                      <th className="text-left py-2 pr-4 font-medium">User</th>
                      <th className="text-left py-2 pr-4 font-medium">Method</th>
                      <th className="text-left py-2 pr-4 font-medium">Path</th>
                      <th className="text-left py-2 pr-4 font-medium">Status</th>
                      <th className="text-left py-2 font-medium">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 pr-4 text-muted-foreground text-xs whitespace-nowrap">
                          {formatTime(log.timestamp)}
                        </td>
                        <td className="py-2.5 pr-4 text-xs">
                          {log.user ? (
                            <div>
                              <p className="font-medium">{log.user.name}</p>
                              <p className="text-muted-foreground">{log.user.email}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Anonymous</span>
                          )}
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className={`font-mono font-medium text-xs ${methodColors[log.method] ?? "text-foreground"}`}>
                            {log.method}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{log.path}</td>
                        <td className="py-2.5 pr-4">
                          <span className={`text-xs font-medium ${
                            log.statusCode < 300 ? "text-green-600 dark:text-green-400"
                            : log.statusCode < 400 ? "text-amber-600 dark:text-amber-400"
                            : "text-destructive"
                          }`}>
                            {log.statusCode}
                          </span>
                        </td>
                        <td className="py-2.5 text-xs text-muted-foreground">
                          {log.durationMs != null ? `${log.durationMs}ms` : "—"}
                        </td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">No audit logs found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                      disabled={pagination.page === pagination.pages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
};

export default AdminAudit;
