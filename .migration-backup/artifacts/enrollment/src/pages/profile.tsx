import { useState, useEffect } from "react";
import { useGetProfile, useUpdateProfile, useChangePassword, getGetProfileQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Camera, KeyRound } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: profile, isLoading } = useGetProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [form, setForm] = useState({ fullName: "", email: "", phone: "", address: "", birthDate: "", gender: "", profilePhoto: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (profile) {
      const p = profile as any;
      setForm({ fullName: p.fullName ?? "", email: p.email ?? "", phone: p.phone ?? "", address: p.address ?? "", birthDate: p.birthDate ?? "", gender: p.gender ?? "", profilePhoto: p.profilePhoto ?? "" });
    }
  }, [profile]);

  async function handleSaveProfile() {
    setSaving(true);
    try {
      await updateProfile.mutateAsync({ data: form });
      await qc.invalidateQueries({ queryKey: getGetProfileQueryKey() });
      toast({ title: "Profile updated" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.error ?? "Failed", variant: "destructive" });
    } finally { setSaving(false); }
  }

  async function handleChangePassword() {
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast({ title: "Password too short", description: "Minimum 6 characters", variant: "destructive" });
      return;
    }
    setSavingPw(true);
    try {
      await changePassword.mutateAsync({ data: { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword } });
      toast({ title: "Password changed successfully" });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.error ?? "Incorrect current password", variant: "destructive" });
    } finally { setSavingPw(false); }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm((f) => ({ ...f, profilePhoto: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  const p = profile as any;
  const initials = form.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <AppLayout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your account information and password</p>
        </div>

        {isLoading ? (
          <Card><CardContent className="p-6"><div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div></CardContent></Card>
        ) : (
          <>
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> Personal Information</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={form.profilePhoto} />
                    <AvatarFallback className="bg-green-100 text-green-800 text-lg font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Label htmlFor="photo-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 text-sm text-green-700 hover:text-green-900 font-medium">
                        <Camera className="h-4 w-4" /> Change photo
                      </div>
                    </Label>
                    <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} data-testid="input-photo-upload" />
                    <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG or GIF, max 2MB</p>
                  </div>
                  <div className="ml-auto">
                    <Badge variant="outline" className="capitalize text-sm">{p?.role}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[{ key: "fullName", label: "Full Name" }, { key: "email", label: "Email", type: "email" }, { key: "phone", label: "Phone" }, { key: "birthDate", label: "Birth Date", type: "date" }].map(({ key, label, type }) => (
                    <div key={key}>
                      <Label htmlFor={`profile-${key}`}>{label}</Label>
                      <Input id={`profile-${key}`} type={type ?? "text"} value={form[key as keyof typeof form]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} data-testid={`input-profile-${key}`} />
                    </div>
                  ))}
                  <div className="col-span-2">
                    <Label>Address</Label>
                    <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} data-testid="input-profile-address" />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Select value={form.gender} onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}>
                      <SelectTrigger data-testid="select-profile-gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={saving} className="bg-green-900 hover:bg-green-800" data-testid="button-save-profile">
                  {saving ? "Saving..." : "Save Profile"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><KeyRound className="h-4 w-4" /> Change Password</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[{ key: "currentPassword", label: "Current Password" }, { key: "newPassword", label: "New Password" }, { key: "confirmPassword", label: "Confirm New Password" }].map(({ key, label }) => (
                  <div key={key}>
                    <Label>{label}</Label>
                    <Input type="password" value={pwForm[key as keyof typeof pwForm]} onChange={(e) => setPwForm((f) => ({ ...f, [key]: e.target.value }))} data-testid={`input-${key}`} />
                  </div>
                ))}
                <Button onClick={handleChangePassword} disabled={savingPw} variant="outline" data-testid="button-change-password">
                  {savingPw ? "Changing..." : "Change Password"}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
