import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCircle, Save, Plus, Trash2, Clock, Utensils } from "lucide-react";

interface FreeSlot {
  start: string;
  end: string;
}

interface ParentProfile {
  role: string;
  gender: string;
  mobileNumber: string;
  workType: string;
  workStartTime: string;
  workEndTime: string;
  freeSlots: FreeSlot[];
  foodType: string;
  allergies: string;
}

export default function ParentProfilePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ParentProfile>({
    role: "mother",
    gender: "",
    mobileNumber: "",
    workType: "work_from_home",
    workStartTime: "",
    workEndTime: "",
    freeSlots: [],
    foodType: "non_veg",
    allergies: "",
  });

  useEffect(() => {
    fetch("/api/parent-profile")
      .then((r) => {
        if (r.ok) return r.json();
        return null;
      })
      .then((data) => {
        if (data) {
          setProfile({
            role: data.role ?? "mother",
            gender: data.gender ?? "",
            mobileNumber: data.mobileNumber ?? "",
            workType: data.workType ?? "work_from_home",
            workStartTime: data.workStartTime ?? "",
            workEndTime: data.workEndTime ?? "",
            freeSlots: data.freeSlots ?? [],
            foodType: data.foodType ?? "non_veg",
            allergies: data.allergies ?? "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const addFreeSlot = () => {
    setProfile((p) => ({ ...p, freeSlots: [...p.freeSlots, { start: "12:00", end: "13:00" }] }));
  };

  const removeFreeSlot = (i: number) => {
    setProfile((p) => ({ ...p, freeSlots: p.freeSlots.filter((_, idx) => idx !== i) }));
  };

  const updateFreeSlot = (i: number, field: "start" | "end", value: string) => {
    setProfile((p) => {
      const slots = [...p.freeSlots];
      slots[i] = { ...slots[i], [field]: value };
      return { ...p, freeSlots: slots };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: any = {
        role: profile.role,
        workType: profile.workType,
        foodType: profile.foodType,
      };
      if (profile.gender) body.gender = profile.gender;
      if (profile.mobileNumber) body.mobileNumber = profile.mobileNumber;
      if (profile.workStartTime) body.workStartTime = profile.workStartTime;
      if (profile.workEndTime) body.workEndTime = profile.workEndTime;
      if (profile.freeSlots.length > 0) body.freeSlots = profile.freeSlots;
      if (profile.allergies) body.allergies = profile.allergies;

      const res = await fetch("/api/parent-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast({ title: "Profile saved!", description: "Your schedule will now inform AI routine generation." });
    } catch {
      toast({ title: "Error", description: "Could not save profile.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-2xl">
      <header>
        <h1 className="font-quicksand text-3xl font-bold text-foreground flex items-center gap-2">
          <UserCircle className="h-8 w-8 text-primary" />
          My Parent Profile
        </h1>
        <p className="text-muted-foreground mt-1">
          Your schedule and availability help the AI build smarter routines for your child.
        </p>
      </header>

      <Card className="rounded-2xl shadow-sm border-border/50">
        <CardHeader>
          <CardTitle className="font-quicksand text-lg">Personal Info</CardTitle>
          <CardDescription>Basic details about your role in the family</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Role</Label>
            <Select value={profile.role} onValueChange={(v) => setProfile((p) => ({ ...p, role: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mother">Mother</SelectItem>
                <SelectItem value="father">Father</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Gender</Label>
            <Select value={profile.gender || "prefer_not"} onValueChange={(v) => setProfile((p) => ({ ...p, gender: v === "prefer_not" ? "" : v }))}>
              <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="prefer_not">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Mobile Number</Label>
            <Input
              placeholder="+92 300 1234567"
              value={profile.mobileNumber}
              onChange={(e) => setProfile((p) => ({ ...p, mobileNumber: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm border-border/50">
        <CardHeader>
          <CardTitle className="font-quicksand text-lg">Work Schedule</CardTitle>
          <CardDescription>The AI uses this to assign tasks when you're busy or available</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Work Type</Label>
            <Select value={profile.workType} onValueChange={(v) => setProfile((p) => ({ ...p, workType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="work_from_home">Work from Home</SelectItem>
                <SelectItem value="work_from_office">Work from Office</SelectItem>
                <SelectItem value="homemaker">Housewife / Homemaker</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {profile.workType !== "homemaker" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Work Start</Label>
                <Input
                  type="time"
                  value={profile.workStartTime}
                  onChange={(e) => setProfile((p) => ({ ...p, workStartTime: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Work End</Label>
                <Input
                  type="time"
                  value={profile.workEndTime}
                  onChange={(e) => setProfile((p) => ({ ...p, workEndTime: e.target.value }))}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-quicksand text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Free / Available Slots
            </CardTitle>
            <CardDescription>Times during the day you're free to spend with your child</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={addFreeSlot} className="shrink-0">
            <Plus className="h-4 w-4 mr-1" /> Add Slot
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {profile.freeSlots.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No free slots added. Click "Add Slot" to specify when you're available.
            </p>
          )}
          {profile.freeSlots.map((slot, i) => (
            <div key={i} className="flex items-center gap-3 bg-muted/40 rounded-xl p-3">
              <div className="flex items-center gap-2 flex-1">
                <Input
                  type="time"
                  value={slot.start}
                  onChange={(e) => updateFreeSlot(i, "start", e.target.value)}
                  className="h-8 text-sm"
                />
                <span className="text-muted-foreground text-sm">to</span>
                <Input
                  type="time"
                  value={slot.end}
                  onChange={(e) => updateFreeSlot(i, "end", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive shrink-0"
                onClick={() => removeFreeSlot(i)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm border-border/50">
        <CardHeader>
          <CardTitle className="font-quicksand text-lg flex items-center gap-2">
            <Utensils className="h-5 w-5 text-primary" />
            Food Preferences
          </CardTitle>
          <CardDescription>
            Used by the AI to suggest appropriate meals in routines
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Diet Type</Label>
            <Select
              value={profile.foodType}
              onValueChange={(v) => setProfile((p) => ({ ...p, foodType: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select diet type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="non_veg">Non-Vegetarian (includes meat, eggs, fish)</SelectItem>
                <SelectItem value="veg">Vegetarian (no meat or fish)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Allergies / Foods to Avoid</Label>
            <Textarea
              placeholder="e.g. peanuts, shellfish, dairy, gluten..."
              value={profile.allergies}
              onChange={(e) => setProfile((p) => ({ ...p, allergies: e.target.value }))}
              className="resize-none"
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              List any food allergies or ingredients to avoid in AI-generated meal suggestions.
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl h-11">
        <Save className="h-4 w-4 mr-2" />
        {saving ? "Saving..." : "Save Profile"}
      </Button>
    </div>
  );
}
