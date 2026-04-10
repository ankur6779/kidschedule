import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateChild, useUpdateChild, useGetChild, getGetChildQueryKey, useDeleteChild, getListChildrenQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Save, Trash2, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const childSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.coerce.number().min(1, "Age must be at least 1").max(18, "Age must be 18 or under"),
  schoolStartTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Must be in HH:MM format"),
  schoolEndTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Must be in HH:MM format"),
  goals: z.string().min(1, "Goals are required to generate good routines"),
});

type ChildFormValues = z.infer<typeof childSchema>;

export default function ChildForm() {
  const [_, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isEditing = !!params.id && params.id !== "new";
  const childId = isEditing ? parseInt(params.id as string) : 0;

  const { data: child, isLoading: isLoadingChild } = useGetChild(childId, {
    query: {
      enabled: isEditing,
      queryKey: getGetChildQueryKey(childId),
    }
  });

  const createMutation = useCreateChild();
  const updateMutation = useUpdateChild();
  const deleteMutation = useDeleteChild();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const form = useForm<ChildFormValues>({
    resolver: zodResolver(childSchema),
    defaultValues: {
      name: "",
      age: 5,
      schoolStartTime: "08:00",
      schoolEndTime: "15:00",
      goals: "",
    },
  });

  useEffect(() => {
    if (child && isEditing) {
      form.reset({
        name: child.name,
        age: child.age,
        schoolStartTime: child.schoolStartTime,
        schoolEndTime: child.schoolEndTime,
        goals: child.goals,
      });
    }
  }, [child, form, isEditing]);

  const onSubmit = (data: ChildFormValues) => {
    if (isEditing) {
      updateMutation.mutate(
        { id: childId, data },
        {
          onSuccess: () => {
            toast({ title: "Profile updated successfully" });
            queryClient.invalidateQueries({ queryKey: getGetChildQueryKey(childId) });
            queryClient.invalidateQueries({ queryKey: getListChildrenQueryKey() });
            setLocation("/children");
          },
          onError: () => {
            toast({ title: "Failed to update profile", variant: "destructive" });
          },
        }
      );
    } else {
      createMutation.mutate(
        { data },
        {
          onSuccess: () => {
            toast({ title: "Child added successfully" });
            queryClient.invalidateQueries({ queryKey: getListChildrenQueryKey() });
            setLocation("/children");
          },
          onError: () => {
            toast({ title: "Failed to add child", variant: "destructive" });
          },
        }
      );
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate(
      { id: childId },
      {
        onSuccess: () => {
          toast({ title: "Profile deleted" });
          queryClient.invalidateQueries({ queryKey: getListChildrenQueryKey() });
          setLocation("/children");
        },
        onError: () => {
          toast({ title: "Failed to delete profile", variant: "destructive" });
        }
      }
    );
  };

  if (isEditing && isLoadingChild) {
    return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/children">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="font-quicksand text-3xl font-bold text-foreground">
            {isEditing ? "Edit Profile" : "Add Child"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditing ? "Update your child's details" : "Tell us about your child to get started"}
          </p>
        </div>
      </header>

      <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-card">
        <CardContent className="p-6 sm:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Leo" className="rounded-xl h-12 bg-muted/50 border-transparent focus-visible:bg-background" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">Age</FormLabel>
                      <FormControl>
                        <Input type="number" className="rounded-xl h-12 bg-muted/50 border-transparent focus-visible:bg-background" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="schoolStartTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">School Starts</FormLabel>
                      <FormControl>
                        <Input type="time" className="rounded-xl h-12 bg-muted/50 border-transparent focus-visible:bg-background" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="schoolEndTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">School Ends</FormLabel>
                      <FormControl>
                        <Input type="time" className="rounded-xl h-12 bg-muted/50 border-transparent focus-visible:bg-background" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="goals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Current Focus & Goals</FormLabel>
                    <FormDescription>
                      What are you working on right now? (e.g., "Potty training", "More independent play", "Gentler hands with sibling")
                    </FormDescription>
                    <FormControl>
                      <Textarea 
                        placeholder="Leo is working on brushing his teeth independently and trying new foods at dinner." 
                        className="min-h-[120px] rounded-xl bg-muted/50 border-transparent focus-visible:bg-background resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between pt-4 mt-6 border-t border-border/50">
                {isEditing ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="destructive" className="rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this profile?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete {child?.name}'s profile and all their routines. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                          Delete Profile
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <div />
                )}
                
                <Button type="submit" disabled={isSaving} className="rounded-full shadow-sm hover-elevate ml-auto min-w-[120px]">
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isEditing ? "Save Changes" : "Add Child"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
