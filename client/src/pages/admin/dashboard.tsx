import React, { useState } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  ResponsiveContainer, 
  Bar, 
  Cell, 
  Line, 
  Pie, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { 
  BadgeCheck, 
  BadgeX, 
  Ban, 
  CircleDollarSign, 
  Home,
  Laptop, 
  Server, 
  Settings, 
  ShieldCheck, 
  Ticket, 
  Trash2, 
  User, 
  Users 
} from 'lucide-react';

interface AdminUser {
  id: number;
  username: string;
  balance: number;
  isAdmin: boolean;
  apiKey: string | null;
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

interface Transaction {
  id: number;
  userId: number;
  amount: number;
  type: string;
  description: string;
  status: string;
  createdAt: string;
}

interface IPBan {
  id: number;
  ipAddress: string;
  reason: string;
  createdAt: string;
  expiresAt: string | null;
}

interface AdminStats {
  users: {
    total: number;
    active: number;
    admins: number;
  };
  servers: {
    total: number;
    active: number;
    byRegion: Record<string, number>;
    bySize: Record<string, number>;
  };
  tickets: {
    total: number;
    open: number;
    closed: number;
    critical: number;
  };
  billing: {
    totalDeposits: number;
    totalSpending: number;
  };
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editUserBalance, setEditUserBalance] = useState<string>('');
  const [ipBanData, setIpBanData] = useState({ ipAddress: '', reason: '', expiresAt: '' });
  const [ipBanDialogOpen, setIpBanDialogOpen] = useState(false);
  
  // Pagination states
  const [userPage, setUserPage] = useState(1);
  const [serverPage, setServerPage] = useState(1);
  const [ticketPage, setTicketPage] = useState(1);
  const [transactionPage, setTransactionPage] = useState(1);
  const [ipBanPage, setIpBanPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  // Search states
  const [userSearch, setUserSearch] = useState('');
  const [serverSearch, setServerSearch] = useState('');
  const [ticketSearch, setTicketSearch] = useState('');
  const [transactionSearch, setTransactionSearch] = useState('');
  const [ipBanSearch, setIpBanSearch] = useState('');

  // Redirect if not an admin
  if (user && !user.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <ShieldCheck className="h-16 w-16 mb-4 text-red-500" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-gray-500">You do not have permission to access the admin dashboard.</p>
      </div>
    );
  }

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/stats');
      const data = await response.json();
      return data as AdminStats;
    }
  });

  // Show toast on error
  React.useEffect(() => {
    if (statsError) {
      toast({
        title: 'Error',
        description: `Failed to load admin stats`,
        variant: 'destructive',
      });
    }
  }, [statsError, toast]);

  // Fetch users
  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/users');
      const data = await response.json();
      return data as AdminUser[];
    }
  });
  
  // Show toast on error
  React.useEffect(() => {
    if (usersError) {
      toast({
        title: 'Error',
        description: `Failed to load users`,
        variant: 'destructive',
      });
    }
  }, [usersError, toast]);

  // Fetch servers
  const { data: servers, isLoading: serversLoading } = useQuery({
    queryKey: ['/api/admin/servers'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/servers');
      const data = await response.json();
      return data as AdminServer[];
    }
  });

  // Fetch tickets
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['/api/admin/tickets'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/tickets');
      const data = await response.json();
      return data as AdminTicket[];
    }
  });

  // Fetch transactions
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/admin/transactions'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/transactions');
      const data = await response.json();
      return data as Transaction[];
    }
  });

  // Fetch IP bans
  const { data: ipBans, isLoading: ipBansLoading, refetch: refetchIpBans } = useQuery({
    queryKey: ['/api/admin/ip-bans'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/ip-bans');
      const data = await response.json();
      return data as IPBan[];
    }
  });

  // Update user balance mutation
  const updateUserBalanceMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: number, amount: number }) => {
      const response = await apiRequest('PATCH', `/api/admin/users/${userId}/balance`, { amount });
      const data = await response.json();
      return data as AdminUser;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'User balance updated successfully',
      });
      setEditingUser(null);
    }
  });

  // Create IP ban mutation
  const createIpBanMutation = useMutation({
    mutationFn: async (data: { ipAddress: string, reason: string, expiresAt: string | null }) => {
      const response = await apiRequest('POST', '/api/admin/ip-bans', data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'IP address banned successfully',
      });
      setIpBanDialogOpen(false);
      setIpBanData({ ipAddress: '', reason: '', expiresAt: '' });
      refetchIpBans();
    }
  });

  // Remove IP ban mutation
  const removeIpBanMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/admin/ip-bans/${id}`);
      return id;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'IP ban removed successfully',
      });
      refetchIpBans();
    }
  });
  
  // Delete server mutation
  const queryClient = useQueryClient();
  const deleteServerMutation = useMutation({
    mutationFn: async (serverId: number) => {
      await apiRequest('DELETE', `/api/servers/${serverId}`);
      return serverId;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Server deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/servers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete server: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Update ticket status mutation
  const updateTicketStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: number; status: string }) => {
      const response = await apiRequest('PATCH', `/api/tickets/${ticketId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Ticket status updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tickets'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update ticket status: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  const chartData = stats ? Object.entries(stats.servers.byRegion).map(([name, value]) => ({
    name,
    value,
  })) : [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const renderPieChart = (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );

  // Prepare data for server status chart
  const serverStatusData = stats ? [
    { name: 'Active', value: stats.servers.active },
    { name: 'Inactive', value: stats.servers.total - stats.servers.active },
  ] : [];

  const renderServerStatusChart = (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={serverStatusData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          <Cell fill="#4CAF50" />
          <Cell fill="#F44336" />
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <Settings className="h-8 w-8 mr-2" />
          Admin Dashboard
        </h1>
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview" className="flex items-center">
            <Laptop className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="servers" className="flex items-center">
            <Server className="h-4 w-4 mr-2" />
            Servers
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center">
            <CircleDollarSign className="h-4 w-4 mr-2" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center">
            <Ticket className="h-4 w-4 mr-2" />
            Support
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <Ban className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {statsLoading ? (
            <div className="text-center py-8">Loading statistics...</div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.users.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.users.admins} admins, {stats.users.total - stats.users.admins} regular users
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Server className="h-4 w-4 mr-2" />
                    Active Servers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.servers.active}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.servers.active} of {stats.servers.total} servers online
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Ticket className="h-4 w-4 mr-2" />
                    Open Tickets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.tickets.open}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.tickets.critical} critical issues
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <CircleDollarSign className="h-4 w-4 mr-2" />
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.billing.totalDeposits.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ${stats.billing.totalSpending.toFixed(2)} in spending
                  </p>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Servers by Region</CardTitle>
                  <CardDescription>Distribution of servers across regions</CardDescription>
                </CardHeader>
                <CardContent>
                  {renderPieChart}
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Server Status</CardTitle>
                  <CardDescription>Active vs Inactive servers</CardDescription>
                </CardHeader>
                <CardContent>
                  {renderServerStatusChart}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-red-500">Failed to load statistics</div>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage all user accounts on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search input for users */}
              <div className="mb-4">
                <Input 
                  placeholder="Search users by username..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1); // Reset to first page when searching
                  }}
                  className="max-w-md"
                />
              </div>
              
              {usersLoading ? (
                <div className="text-center py-8">Loading users...</div>
              ) : users ? (
                <div>
                <Table>
                  <TableCaption>List of all registered users on the platform</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>API Key</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users
                      .filter(user => user.username.toLowerCase().includes(userSearch.toLowerCase()))
                      .slice((userPage - 1) * ITEMS_PER_PAGE, userPage * ITEMS_PER_PAGE)
                      .map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>${(user.balance / 100).toFixed(2)}</TableCell>
                        <TableCell>
                          {user.isAdmin ? (
                            <BadgeCheck className="h-5 w-5 text-green-500" />
                          ) : (
                            <BadgeX className="h-5 w-5 text-gray-400" />
                          )}
                        </TableCell>
                        <TableCell>{user.apiKey ? 'Set' : 'Not Set'}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setEditingUser(user);
                              setEditUserBalance((user.balance / 100).toString());
                            }}
                          >
                            Edit Balance
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-red-500">Failed to load users</div>
              )}
            </CardContent>
          </Card>

          {/* Edit User Balance Dialog */}
          {editingUser && (
            <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit User Balance</DialogTitle>
                  <DialogDescription>
                    Update balance for user {editingUser.username}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="flex items-center gap-4">
                    <label htmlFor="balance" className="text-right">
                      Balance ($):
                    </label>
                    <Input
                      id="balance"
                      type="number"
                      step="0.01"
                      value={editUserBalance}
                      onChange={(e) => setEditUserBalance(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setEditingUser(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      const balanceInCents = Math.round(parseFloat(editUserBalance) * 100);
                      updateUserBalanceMutation.mutate({
                        userId: editingUser.id,
                        amount: balanceInCents
                      });
                    }}
                    disabled={updateUserBalanceMutation.isPending}
                  >
                    {updateUserBalanceMutation.isPending ? 'Updating...' : 'Update Balance'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </TabsContent>

        {/* Servers Tab */}
        <TabsContent value="servers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Server Management</CardTitle>
              <CardDescription>View and manage all servers on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {serversLoading ? (
                <div className="text-center py-8">Loading servers...</div>
              ) : servers ? (
                <Table>
                  <TableCaption>List of all servers on the platform</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {servers.map((server) => (
                      <TableRow key={server.id}>
                        <TableCell>{server.id}</TableCell>
                        <TableCell>{server.name}</TableCell>
                        <TableCell>{server.userId}</TableCell>
                        <TableCell>{server.region}</TableCell>
                        <TableCell>{server.size}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            server.status === 'active' ? 'bg-green-100 text-green-800' : 
                            server.status === 'new' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {server.status}
                          </span>
                        </TableCell>
                        <TableCell>{server.ipAddress || 'Not assigned'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this server? This action cannot be undone.')) {
                                  deleteServerMutation.mutate(server.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-red-500">Failed to load servers</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Transactions</CardTitle>
              <CardDescription>View all financial transactions on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="text-center py-8">Loading transactions...</div>
              ) : transactions ? (
                <Table>
                  <TableCaption>List of all financial transactions</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.id}</TableCell>
                        <TableCell>{transaction.userId}</TableCell>
                        <TableCell className={transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}>
                          {transaction.type === 'deposit' ? '+' : '-'}${(transaction.amount / 100).toFixed(2)}
                        </TableCell>
                        <TableCell>{transaction.type}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            transaction.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(transaction.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-red-500">Failed to load transactions</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Support Tickets Tab */}
        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
              <CardDescription>Manage customer support tickets</CardDescription>
            </CardHeader>
            <CardContent>
              {ticketsLoading ? (
                <div className="text-center py-8">Loading tickets...</div>
              ) : tickets ? (
                <Table>
                  <TableCaption>List of all support tickets</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell>{ticket.id}</TableCell>
                        <TableCell>{ticket.userId}</TableCell>
                        <TableCell>{ticket.subject}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            ticket.status === 'open' ? 'bg-green-100 text-green-800' : 
                            ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {ticket.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            ticket.priority === 'critical' ? 'bg-red-100 text-red-800' : 
                            ticket.priority === 'high' ? 'bg-amber-100 text-amber-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {ticket.priority}
                          </span>
                        </TableCell>
                        <TableCell>{new Date(ticket.createdAt).toLocaleString()}</TableCell>
                        <TableCell>{new Date(ticket.updatedAt).toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              asChild
                            >
                              <Link href={`/support/${ticket.id}`}>
                                View & Respond
                              </Link>
                            </Button>
                            <Select
                              onValueChange={(value) => {
                                updateTicketStatusMutation.mutate({
                                  ticketId: ticket.id,
                                  status: value
                                });
                              }}
                              defaultValue={ticket.status}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Change Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-red-500">Failed to load tickets</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Ban className="h-5 w-5 mr-2" />
                  IP Ban Management
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setIpBanDialogOpen(true)}
                >
                  Ban New IP
                </Button>
              </CardTitle>
              <CardDescription>Block malicious IP addresses from accessing the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {ipBansLoading ? (
                <div className="text-center py-8">Loading IP bans...</div>
              ) : ipBans && ipBans.length > 0 ? (
                <Table>
                  <TableCaption>List of all banned IP addresses</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Banned On</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ipBans.map((ban) => (
                      <TableRow key={ban.id}>
                        <TableCell>{ban.id}</TableCell>
                        <TableCell>{ban.ipAddress}</TableCell>
                        <TableCell>{ban.reason}</TableCell>
                        <TableCell>{new Date(ban.createdAt).toLocaleString()}</TableCell>
                        <TableCell>{ban.expiresAt ? new Date(ban.expiresAt).toLocaleString() : 'Never'}</TableCell>
                        <TableCell>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => removeIpBanMutation.mutate(ban.id)}
                            disabled={removeIpBanMutation.isPending}
                          >
                            {removeIpBanMutation.isPending ? 'Removing...' : 'Remove Ban'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">No IP bans found</div>
              )}
            </CardContent>
          </Card>

          {/* Ban IP Dialog */}
          <Dialog open={ipBanDialogOpen} onOpenChange={setIpBanDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ban IP Address</DialogTitle>
                <DialogDescription>
                  Block an IP address from accessing the platform
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="ipAddress" className="text-right">
                    IP Address:
                  </label>
                  <Input
                    id="ipAddress"
                    placeholder="e.g. 192.168.1.1"
                    value={ipBanData.ipAddress}
                    onChange={(e) => setIpBanData({ ...ipBanData, ipAddress: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="reason" className="text-right">
                    Reason:
                  </label>
                  <Input
                    id="reason"
                    placeholder="Why is this IP being banned?"
                    value={ipBanData.reason}
                    onChange={(e) => setIpBanData({ ...ipBanData, reason: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="expiresAt" className="text-right">
                    Expires:
                  </label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={ipBanData.expiresAt}
                    onChange={(e) => setIpBanData({ ...ipBanData, expiresAt: e.target.value })}
                    className="col-span-3"
                  />
                  <div className="col-start-2 col-span-3 text-xs text-gray-500">
                    Leave empty for permanent ban
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIpBanDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    createIpBanMutation.mutate({
                      ipAddress: ipBanData.ipAddress,
                      reason: ipBanData.reason,
                      expiresAt: ipBanData.expiresAt ? ipBanData.expiresAt : null
                    });
                  }}
                  disabled={createIpBanMutation.isPending || !ipBanData.ipAddress || !ipBanData.reason}
                >
                  {createIpBanMutation.isPending ? 'Banning...' : 'Ban IP'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}