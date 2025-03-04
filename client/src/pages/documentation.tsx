import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSectionSchema, insertArticleSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Documentation() {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<number | null>(null);

  // Queries
  const { data: sections = [], isLoading: loadingSections } = useQuery({
    queryKey: ["/api/docs/sections"],
  });

  const { data: articles = [], isLoading: loadingArticles } = useQuery({
    queryKey: ["/api/docs/sections", activeSection, "articles"],
    enabled: activeSection !== null,
  });

  // Section form
  const sectionForm = useForm({
    resolver: zodResolver(insertSectionSchema),
    defaultValues: {
      title: "",
      order: 0,
    },
  });

  // Article form
  const articleForm = useForm({
    resolver: zodResolver(insertArticleSchema),
    defaultValues: {
      title: "",
      content: "",
      sectionId: activeSection || 0,
      order: 0,
    },
  });

  // Mutations
  const createSection = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/docs/sections", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/docs/sections"] });
      sectionForm.reset();
      toast({
        title: "Success",
        description: "Section created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createArticle = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/docs/articles", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/docs/sections", activeSection, "articles"],
      });
      articleForm.reset();
      toast({
        title: "Success",
        description: "Article created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="sections">
        <TabsList>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="articles">Articles</TabsTrigger>
        </TabsList>

        <TabsContent value="sections">
          <Card>
            <CardHeader>
              <CardTitle>Create Section</CardTitle>
              <CardDescription>Add a new documentation section</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...sectionForm}>
                <form
                  onSubmit={sectionForm.handleSubmit((data) =>
                    createSection.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <FormField
                    control={sectionForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={sectionForm.control}
                    name="order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={createSection.isPending}
                  >
                    Create Section
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div className="mt-6 grid gap-4">
            {sections.map((section: any) => (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle>{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="secondary"
                    onClick={() => setActiveSection(section.id)}
                  >
                    View Articles
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="articles">
          <Card>
            <CardHeader>
              <CardTitle>Create Article</CardTitle>
              <CardDescription>Add a new documentation article</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...articleForm}>
                <form
                  onSubmit={articleForm.handleSubmit((data) =>
                    createArticle.mutate(data)
                  )}
                  className="space-y-4"
                >
                  <FormField
                    control={articleForm.control}
                    name="sectionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section</FormLabel>
                        <FormControl>
                          <select
                            className="w-full rounded-md border border-input bg-background px-3 py-2"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          >
                            <option value="">Select a section</option>
                            {sections.map((section: any) => (
                              <option key={section.id} value={section.id}>
                                {section.title}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={articleForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={articleForm.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={articleForm.control}
                    name="order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={createArticle.isPending}
                  >
                    Create Article
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {activeSection && (
            <div className="mt-6 grid gap-4">
              {articles.map((article: any) => (
                <Card key={article.id}>
                  <CardHeader>
                    <CardTitle>{article.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{article.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
