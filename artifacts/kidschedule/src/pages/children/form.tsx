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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

const childSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.coerce.number().min(1, "Age must be at least 1").max(18, "Age must be 18 or under"),
  wakeUpTime: z.string().regex(timeRegex, "Must be in HH:MM format"),
  sleepTime: z.string().regex(timeRegex, "Must be in HH:MM format"),
  schoolStartTime: z.string().regex(timeRegex, "Must be in HH:MM format"),
  schoolEndTime: z.string().regex(timeRegex, "Must be in HH:MM format"),
  travelMode: z.enum(["van", "car", "walk", "other"]),
  travelModeOther: z.string().optional(),
  goals: z.string().min(1, "Goals are required to generate good routines"),
});

type ChildFormValues = z.infer<typeof childSchema>;

const inputClass = "rounded-xl h-12 bg-muted/50 border-transparent focus-visible:bg-background";

export default function ChildForm() {
  const [_, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isEditing = !!params.id && params.id !== "new";
  const childId = isEditing ? parseInt(params.id as string) : 0;

  const { data: child, isLoading: isLoadingChild } = useGetChild(childId, {
    query: { enabled: isEditing, queryKey: getGetChildQueryKey(childId) }
  });

  const createMutation = useCreateChild();
  const updateMutation = useUpdateChild();
  const deleteMutation = useDeleteChild();

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const form = useForm<ChildFormValues>({
    resolver: zodResolver(childSchema),
    defaultValues: {
      name: "",
      age: 7,
      wakeUpTime: "07:00",
      sleepTime: "21:00",
      schoolStartTime: "08:00",
      schoolEndTime: "15:00",
      travelMode: "car",
      travelModeOther: "",
      goals: "",
    },
  });

  const travelMode = form.watch("travelMode");

  useEffect(() => {
    if (child && isEditing) {
      form.reset({
        name: child.name,
        age: child.age,
        wakeUpTime: child.wakeUpTime ?? "07:00",
        sleepTime: child.sleepTime ?? "21:00",
        schoolStartTime: child.schoolStartTime,
        schoolEndTime: child.schoolEndTime,
        travelMode: (child.travelMode as "van" | "car" | "walk" | "other") ?? "car",
        travelModeOther: child.travelModeOther ?? "",
        goals: child.goals,
      });
    }
  }, [child, form, isEditing]);

  const onSubmit = (data: ChildFormValues) => {
    const payload = {
      ...data,
      travelModeOther: data.travelMode === "other" ? data.travelModeOther : undefined,
    };

    if (isEditing) {
      updateMutation.mutate(
        { id: childId, data: payload },
        {
          onSuccess: () => {
            toast({ title: "Profile updated successfully" });
            queryClient.invalidateQueries({ queryKey: getGetChildQueryKey(childId) });
            queryClient.invalidateQueries({ queryKey: getListChildrenQueryKey() });
            setLocation("/children");
          },
          onError: () => toast({ title: "Failed to update profile", variant: "destructive" }),
        }
      );
    } else {
      createMutation.mutate(
        { data: payload },
        {
          onSuccess: () => {
            toast({ title: "Child added successfully" });
            queryClient.invalidateQueries({ queryKey: getListChildrenQueryKey() });
            setLocation("/children");
          },
          onError: () => toast({ title: "Failed to add child", variant: "destructive" }),
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
        onError: () => toast({ title: "Failed to delete profile", variant: "destructive" }),
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
          <Link href="/children"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div>
          <h1 className="font-quicksand text-3xl font-bold text-foreground">
            {isEditing ? "Edit Profile" : "Add Child"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditing ? "Update your child's details" : "Tell us about your child to get personalized routines"}
          </p>
        </div>
      </header>

      <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-card">
        <CardContent className="p-6 sm:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* Name + Age */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Child's Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Leo" className={inputClass} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="age" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold">Age</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={18} className={inputClass} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Wake-up + Sleep */}
              <div>
                <p className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wide">Daily Schedule</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="wakeUpTime" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">⏰ Wake-up Time</FormLabel>
                      <FormControl>
                        <Input type="time" className={inputClass} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="sleepTime" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">🌙 Bedtime</FormLabel>
                      <FormControl>
                        <Input type="time" className={inputClass} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* School times */}
              <div>
                <p className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wide">School Hours</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="schoolStartTime" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">🎒 School Starts</FormLabel>
                      <FormControl>
                        <Input type="time" className={inputClass} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="schoolEndTime" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">🏠 School Ends</FormLabel>
                      <FormControl>
                        <Input type="time" className={inputClass} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              {/* Travel Mode */}
              <div>
                <p className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wide">School Travel</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="travelMode" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">🚌 Travel Mode</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={inputClass}>
                            <SelectValue placeholder="Select travel mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="van">🚐 School Van / Bus</SelectItem>
                          <SelectItem value="car">🚗 Car (Parent Drop-off)</SelectItem>
                          <SelectItem value="walk">🚶 Walking</SelectItem>
                          <SelectItem value="other">✏️ Other (specify)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {travelMode === "other" && (
                    <FormField control={form.control} name="travelModeOther" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold">Specify Travel Mode</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Bicycle, Rickshaw..." className={inputClass} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}
                </div>
              </div>

              {/* Goals */}
              <FormField control={form.control} name="goals" render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">🎯 Daily Goals & Focus</FormLabel>
                  <FormDescription>
                    What are you working on? (e.g., "Study math, join swimming, reduce screen time")
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder="Leo is working on math and reading every day. He also does swimming on Tuesdays and Thursdays."
                      className="min-h-[100px] rounded-xl bg-muted/50 border-transparent focus-visible:bg-background resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex items-center justify-between pt-4 mt-6 border-t border-border/50">
                {isEditing ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="destructive" className="rounded-full bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground">
                        <Trash2 className="h-4 w-4 mr-2" />Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this profile?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete {child?.name}'s profile and all their routines. This cannot be undone.
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
                ) : <div />}

                <Button type="submit" disabled={isSaving} className="rounded-full shadow-sm ml-auto min-w-[120px]">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
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
