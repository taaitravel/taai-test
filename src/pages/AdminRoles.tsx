import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useUserRoles } from "@/hooks/useUserRoles";

interface UserWithRoles {
  id: string;
  email: string;
  roles: string[];
}

const AdminRoles = () => {
  const { toast } = useToast();
  const { isAdmin, loading: rolesLoading } = useUserRoles();
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<"admin" | "support">("support");
  const [users, setUsers] = useState<UserWithRoles[]>([]);

  useEffect(() => {
    document.title = "Admin Roles | TAAI";
  }, []);

  // Remove the manual role fetching since useUserRoles handles it

  const refreshList = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-user-roles", {
        body: { action: "list" }
      });
      if (error) throw error;
      setUsers(data?.users || []);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message || "Failed to fetch users", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (isAdmin) refreshList();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const handleAction = async (action: "add" | "remove") => {
    try {
      if (!email && !userId) {
        toast({ title: "Provide user", description: "Enter email or user ID", variant: "destructive" });
        return;
      }
      const { error } = await supabase.functions.invoke("manage-user-roles", {
        body: { action, email: email || undefined, userId: userId || undefined, role }
      });
      if (error) throw error;
      toast({ title: "Success", description: `Role ${action === "add" ? "added" : "removed"} successfully` });
      setEmail("");
      setUserId("");
      refreshList();
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message || "Operation failed", variant: "destructive" });
    }
  };

  if (rolesLoading) {
    return (
      <main className="min-h-screen container mx-auto p-4">
        <div>Loading...</div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen container mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-2">Access denied</h1>
        <p>You need admin privileges to manage roles.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen container mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Admin - User Roles</h1>
        <p className="text-muted-foreground">Assign or remove roles from users</p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Assign/Remove Role</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email (preferred)</Label>
              <Input id="email" placeholder="user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="userId">Or User ID</Label>
              <Input id="userId" placeholder="UUID" value={userId} onChange={(e) => setUserId(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v: any) => setRole(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support">support</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleAction("add")}>Add Role</Button>
              <Button variant="destructive" onClick={() => handleAction("remove")}>Remove Role</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Users & Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-3">
              <Button variant="outline" onClick={refreshList}>Refresh</Button>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Roles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.email}</TableCell>
                      <TableCell className="text-xs">{u.id}</TableCell>
                      <TableCell>{u.roles.join(", ") || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default AdminRoles;
