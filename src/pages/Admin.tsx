import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MoreHorizontal, Shield, Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/animations";
import { Badge } from "@/components/ui/badge";

const users = [
  { id: 1, name: "Sarah Chen", email: "sarah@acme.co", role: "Admin", status: "Active", bookings: 23 },
  { id: 2, name: "Marcus Rivera", email: "marcus@acme.co", role: "Member", status: "Active", bookings: 18 },
  { id: 3, name: "Priya Patel", email: "priya@acme.co", role: "Member", status: "Active", bookings: 31 },
  { id: 4, name: "Alex Kim", email: "alex@acme.co", role: "Member", status: "Inactive", bookings: 5 },
  { id: 5, name: "Jordan Lee", email: "jordan@acme.co", role: "Manager", status: "Active", bookings: 14 },
  { id: 6, name: "Taylor Morgan", email: "taylor@acme.co", role: "Member", status: "Active", bookings: 27 },
];

const Admin = () => {
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState<typeof users[0] | null>(null);

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageTransition>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">Admin</h1>
        <p className="text-muted-foreground mt-1">Manage users and permissions.</p>
      </div>

      {/* Edit modal */}
      <AnimatePresence>
        {editUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm"
            onClick={() => setEditUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-xl p-8 shadow-xl border border-border max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold font-display">Edit User</h2>
                <button onClick={() => setEditUser(null)} className="text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input defaultValue={editUser.name} className="mt-1.5" />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input defaultValue={editUser.email} className="mt-1.5" />
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <Input defaultValue={editUser.role} className="mt-1.5" />
                </div>
                <Button className="w-full gradient-primary text-primary-foreground font-semibold" onClick={() => setEditUser(null)}>
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="border-border">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="font-display text-lg">Users</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 text-muted-foreground font-medium">Name</th>
                  <th className="text-left py-3 text-muted-foreground font-medium">Email</th>
                  <th className="text-left py-3 text-muted-foreground font-medium">Role</th>
                  <th className="text-left py-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-left py-3 text-muted-foreground font-medium">Bookings</th>
                  <th className="py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors duration-150">
                    <td className="py-3 font-medium">{user.name}</td>
                    <td className="py-3 text-muted-foreground">{user.email}</td>
                    <td className="py-3">
                      <Badge variant={user.role === "Admin" ? "default" : "secondary"} className={user.role === "Admin" ? "gradient-primary text-primary-foreground" : ""}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        user.status === "Active" ? "text-primary" : "text-muted-foreground"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${user.status === "Active" ? "bg-primary" : "bg-muted-foreground"}`} />
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground">{user.bookings}</td>
                    <td className="py-3">
                      <Button variant="ghost" size="sm" onClick={() => setEditUser(user)}>
                        <MoreHorizontal size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  );
};

export default Admin;
