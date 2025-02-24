import * as React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Plus, Send } from "lucide-react";
import { SupportTicket, SupportMessage, Server } from "@shared/schema";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTicketSchema } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface TicketDetails {
  ticket: SupportTicket;
  messages: SupportMessage[];
}

export default function SupportPage() {
  const { toast } = useToast();
  const [selectedTicket, setSelectedTicket] = React.useState<number | null>(null);

  const { data: tickets = [], isLoading: loadingTickets } = useQuery<SupportTicket[]>({
    queryKey: ["/api/tickets"],
  });

  const { data: selectedTicketData, isLoading: loadingTicketDetails } = useQuery<TicketDetails>({
    queryKey: ["/api/tickets", selectedTicket],
    enabled: selectedTicket !== null,
  });

  // Get user's servers for ticket creation
  const { data: servers = [] } = useQuery<Server[]>({
    queryKey: ["/api/servers"],
  });

  const createTicketForm = useForm({
    resolver: zodResolver(insertTicketSchema),
    defaultValues: {
      subject: "",
      message: "",
      priority: "low",
      serverId: undefined,
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("/api/tickets", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Success",
        description: "Support ticket created successfully",
      });
      createTicketForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createTicketMutation.mutate(data);
  };


  // Reply Form
  const replyForm = useForm({
    defaultValues: {
      message: "",
    },
  });

  const replyMutation = useMutation({
    mutationFn: async (data: { message: string }) => {
      if (!selectedTicket) return;
      const response = await apiRequest(
        "POST",
        `/api/tickets/${selectedTicket}/messages`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", selectedTicket] });
      replyForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (loadingTickets) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Support</h1>
        <div className="flex gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Support Ticket</DialogTitle>
              </DialogHeader>
              <Form {...createTicketForm}>
                <form
                  onSubmit={createTicketForm.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={createTicketForm.control}
                    name="serverId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Related Server (Optional)</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a server" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {servers.map((server) => (
                              <SelectItem key={server.id} value={server.id.toString()}>
                                {server.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createTicketForm.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createTicketForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createTicketForm.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={createTicketMutation.isPending}
                    className="w-full"
                  >
                    {createTicketMutation.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Create Ticket
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </nav>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Tickets</h2>
          <div className="space-y-4">
            {tickets.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No tickets yet
                </CardContent>
              </Card>
            ) : (
              tickets.map((ticket) => (
                <Card
                  key={ticket.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedTicket === ticket.id ? "border-primary" : ""
                  }`}
                  onClick={() => setSelectedTicket(ticket.id)}
                >
                  <CardContent className="py-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{ticket.subject}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(ticket.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge>{ticket.status}</Badge>
                        <Badge variant="outline">{ticket.priority}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Conversation</h2>
          {selectedTicket ? (
            loadingTicketDetails ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="space-y-4 max-h-[500px] overflow-y-auto p-4 border rounded-lg">
                  {selectedTicketData?.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex flex-col ${
                        message.userId === selectedTicketData.ticket.userId
                          ? "items-end"
                          : "items-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.userId === selectedTicketData.ticket.userId
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p>{message.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <form
                  onSubmit={replyForm.handleSubmit((data) =>
                    replyMutation.mutate(data)
                  )}
                  className="flex gap-2"
                >
                  <Input
                    {...replyForm.register("message")}
                    placeholder="Type your message..."
                  />
                  <Button
                    type="submit"
                    disabled={replyMutation.isPending}
                    size="icon"
                  >
                    {replyMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            )
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Select a ticket to view the conversation
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}