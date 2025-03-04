import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSectionSchema, insertArticleSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Documentation() {
  const { toast } = useToast();
  const [selectedSection, setSelectedSection] = useState<number | null>(null);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [articleDialogOpen, setArticleDialogOpen] = useState(false);

  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: ['/api/sections'],
  });

  const { data: articles, isLoading: articlesLoading } = useQuery({
    queryKey: ['/api/sections', selectedSection, 'articles'],
    enabled: !!selectedSection,
  });

  const sectionForm = useForm({
    resolver: zodResolver(insertSectionSchema),
    defaultValues: {
      title: "",
    },
  });

  const articleForm = useForm({
    resolver: zodResolver(insertArticleSchema),
    defaultValues: {
      title: "",
      content: "",
      sectionId: null,
    },
  });

  const createSection = useMutation({
    mutationFn: async (data: { title: string }) => {
      await apiRequest('POST', '/api/sections', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sections'] });
      setSectionDialogOpen(false);
      sectionForm.reset();
      toast({
        title: "Success",
        description: "Section created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create section",
        variant: "destructive",
      });
    },
  });

  const createArticle = useMutation({
    mutationFn: async (data: { title: string; content: string; sectionId: number }) => {
      await apiRequest('POST', '/api/articles', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sections', selectedSection, 'articles'] });
      setArticleDialogOpen(false);
      articleForm.reset();
      toast({
        title: "Success",
        description: "Article created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create article",
        variant: "destructive",
      });
    },
  });

  const deleteSection = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/sections/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sections'] });
      setSelectedSection(null);
      toast({
        title: "Success",
        description: "Section deleted successfully",
      });
    },
  });

  const deleteArticle = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/articles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sections', selectedSection, 'articles'] });
      toast({
        title: "Success",
        description: "Article deleted successfully",
      });
    },
  });

  if (sectionsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Documentation</h1>
        <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Section
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Section</DialogTitle>
            </DialogHeader>
            <Form {...sectionForm}>
              <form onSubmit={sectionForm.handleSubmit((data) => createSection.mutate(data))}>
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
                <Button type="submit" className="mt-4" disabled={createSection.isPending}>
                  Create Section
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1">
          <div className="space-y-4">
            {sections?.map((section) => (
              <Card
                key={section.id}
                className={`cursor-pointer ${
                  selectedSection === section.id ? "border-primary" : ""
                }`}
                onClick={() => setSelectedSection(section.id)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{section.title}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSection.mutate(section.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        <div className="col-span-2">
          {selectedSection && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Articles</h2>
                <Dialog open={articleDialogOpen} onOpenChange={setArticleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Article
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Article</DialogTitle>
                    </DialogHeader>
                    <Form {...articleForm}>
                      <form
                        onSubmit={articleForm.handleSubmit((data) =>
                          createArticle.mutate({ ...data, sectionId: selectedSection })
                        )}
                      >
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
                        <Button type="submit" className="mt-4" disabled={createArticle.isPending}>
                          Create Article
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              {articlesLoading ? (
                <div>Loading articles...</div>
              ) : (
                <div className="space-y-4">
                  {articles?.map((article) => (
                    <Card key={article.id}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                          <FileText className="h-4 w-4 inline mr-2" />
                          {article.title}
                        </CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteArticle.mutate(article.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{article.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
