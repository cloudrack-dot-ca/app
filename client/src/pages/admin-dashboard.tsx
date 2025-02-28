import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Redirect } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, RefreshCcw, User as UserIcon, Server as ServerIcon, MessageCircle } from "lucide-react";

// Define interfaces for our data
interface AdminUser {
  id: number;
  username: string;
  balance: number;
  isAdmin: boolean;
  apiKey: string | null;
}

interface AdminTicket {
  id: number;
  userId: number;
  serverId: number | null;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  originalDropletId: string | null;
}

interface AdminServer {
  id: number;
  userId: number;
  name: string;
  dropletId: string;
  region: string;
  size: string;
  status: string;
  ipAddress: string | null;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [ticketSearchTerm, setTicketSearchTerm] = useState("");
  const [serverSearchTerm, setServerSearchTerm] = useState("");

  // Redirect if not admin
  if (!user?.isAdmin) {
    return <Redirect to="/dashboard" />;
  }

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await apiRequest<AdminUser[]>("/api/admin/users");
      return response || [];
    }
  });

  // Fetch all tickets
  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: ["/api/admin/tickets"],
    queryFn: async () => {
      const response = await apiRequest<AdminTicket[]>("/api/admin/tickets");
      return response || [];
    }
  });

  // Fetch all servers
  const { data: servers = [], isLoading: serversLoading } = useQuery({
    queryKey: ["/api/admin/servers"],
    queryFn: async () => {
      const response = await apiRequest<AdminServer[]>("/api/admin/servers");
      return response || [];
    }
  });

  // Update ticket status mutation
  const updateTicketMutation = useMutation({
    mutationFn: async ({ id, status, priority }: { id: number; status?: string; priority?: string }) => {
      return await apiRequest(`/api/admin/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, priority }),
      } as RequestInit);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tickets"] });
      toast({
        title: "Ticket updated",
        description: "The ticket has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter users by search term
  const filteredUsers = users.filter((user: AdminUser) => 
    user.username.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  // Filter tickets by search term
  const filteredTickets = tickets.filter((ticket: AdminTicket) => 
    ticket.subject.toLowerCase().includes(ticketSearchTerm.toLowerCase())
  );

  // Filter servers by search term
  const filteredServers = servers.filter((server: AdminServer) => 
    server.name.toLowerCase().includes(serverSearchTerm.toLowerCase())
  );

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="users">
            <UserIcon className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="tickets">
            <MessageCircle className="h-4 w-4 mr-2" />
            Support Tickets
          </TabsTrigger>
          <TabsTrigger value="servers">
            <ServerIcon className="h-4 w-4 mr-2" />
            Servers
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage all users in the system</CardDescription>
              <div className="flex items-center mt-2">
                <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search users..." 
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="ml-2"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] })}
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="text-center py-4">Loading users...</div>
              ) : (
                <Table>
                  <TableCaption>List of all registered users</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">No users found</TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user: AdminUser) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.id}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>${(user.balance / 100).toFixed(2)}</TableCell>
                          <TableCell>
                            {user.isAdmin ? (
                              <Badge variant="default">Admin</Badge>
                            ) : (
                              <Badge variant="outline">User</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Tickets Tab */}
        <TabsContent value="tickets">
          <Card>
            <CardHeader>
              <CardTitle>Support Ticket Management</CardTitle>
              <CardDescription>Handle customer support requests</CardDescription>
              <div className="flex items-center mt-2">
                <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search tickets..." 
                  value={ticketSearchTerm}
                  onChange={(e) => setTicketSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="ml-2"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/tickets"] })}
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {ticketsLoading ? (
                <div className="text-center py-4">Loading tickets...</div>
              ) : (
                <Table>
                  <TableCaption>List of all support tickets</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">No tickets found</TableCell>
                      </TableRow>
                    ) : (
                      filteredTickets.map((ticket: AdminTicket) => (
                        <TableRow key={ticket.id}>
                          <TableCell>{ticket.id}</TableCell>
                          <TableCell>{ticket.subject}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                ticket.status === "open"
                                  ? "default"
                                  : ticket.status === "pending"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {ticket.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                ticket.priority === "high"
                                  ? "destructive"
                                  : ticket.priority === "normal"
                                  ? "default"
                                  : "outline"
                              }
                            >
                              {ticket.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>{ticket.userId}</TableCell>
                          <TableCell className="space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                const newStatus = ticket.status === "open" ? "closed" : "open";
                                updateTicketMutation.mutate({ id: ticket.id, status: newStatus });
                              }}
                            >
                              {ticket.status === "open" ? "Close" : "Reopen"}
                            </Button>
                            <Button size="sm" variant="default">
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Servers Tab */}
        <TabsContent value="servers">
          <Card>
            <CardHeader>
              <CardTitle>Server Management</CardTitle>
              <CardDescription>Monitor all provisioned servers</CardDescription>
              <div className="flex items-center mt-2">
                <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search servers..." 
                  value={serverSearchTerm}
                  onChange={(e) => setServerSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="ml-2"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/servers"] })}
                >
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {serversLoading ? (
                <div className="text-center py-4">Loading servers...</div>
              ) : (
                <Table>
                  <TableCaption>List of all provisioned servers</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">No servers found</TableCell>
                      </TableRow>
                    ) : (
                      filteredServers.map((server: AdminServer) => (
                        <TableRow key={server.id}>
                          <TableCell>{server.id}</TableCell>
                          <TableCell>{server.name}</TableCell>
                          <TableCell>{server.region}</TableCell>
                          <TableCell>{server.size}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                server.status === "active"
                                  ? "default"
                                  : server.status === "new"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {server.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{server.userId}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}