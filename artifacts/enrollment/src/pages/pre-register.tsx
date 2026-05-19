import { useState } from "react";
import { useCreateEnrollee, useListCourses } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookOpenCheck, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PreRegisterPage() {
  const { toast } = useToast();
  const createEnrollee = useCreateEnrollee();
  const { data: courses } = useListCourses();

  const [form, setForm] = useState({
    firstName: "", lastName: "", middleName: "", email: "", phone: "",
    guardianContact: "", fbName: "", address: "", birthDate: "", gender: "",
    courseId: 0, yearLevel: 1, enrollmentType: "new",
  });
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function setField(key: string, value: any) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.courseId) { setError("Please select a course"); return; }
    setError("");
    setSubmitting(true);
    try {
      await createEnrollee.mutateAsync({ data: { ...form, password } as any });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.data?.error ?? err?.message ?? "Failed to submit application");
    } finally { setSubmitting(false); }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #02310a 0%, #0a6901 100%)" }}>
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 px-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
            <p className="text-muted-foreground mb-6">Your pre-registration has been received. You will be notified once your application is reviewed.</p>
            <Button onClick={() => window.location.href = "/login"} className="bg-green-900 hover:bg-green-800" data-testid="button-go-login">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #02310a 0%, #0a6901 100%)" }}>
      <div className="py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                <BookOpenCheck className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-white font-bold text-sm">KURIOS</p>
                <p className="text-green-200/80 text-xs">ENROLLMENT SYSTEM</p>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Pre-Registration</h1>
            <p className="text-green-200/80">Fill out the form below to begin your enrollment application</p>
          </div>

          <Card>
            <CardContent className="pt-6 px-8 pb-8">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription data-testid="text-prereg-error">{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-1 border-b">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[{ key: "firstName", label: "First Name", required: true }, { key: "lastName", label: "Last Name", required: true }, { key: "middleName", label: "Middle Name" }].map(({ key, label, required }) => (
                      <div key={key}>
                        <Label>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
                        <Input value={form[key as keyof typeof form] as string} onChange={(e) => setField(key, e.target.value)} required={required} data-testid={`input-prereg-${key}`} />
                      </div>
                    ))}
                    <div>
                      <Label>Gender <span className="text-red-500">*</span></Label>
                      <Select onValueChange={(v) => setField("gender", v)} required>
                        <SelectTrigger data-testid="select-prereg-gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Birth Date</Label>
                      <Input type="date" value={form.birthDate} onChange={(e) => setField("birthDate", e.target.value)} data-testid="input-prereg-birthDate" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-1 border-b">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[{ key: "email", label: "Email Address", type: "email", required: true }, { key: "phone", label: "Phone Number" }, { key: "guardianContact", label: "Guardian Contact" }, { key: "fbName", label: "Facebook Name" }].map(({ key, label, type, required }) => (
                      <div key={key}>
                        <Label>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
                        <Input type={type ?? "text"} value={form[key as keyof typeof form] as string} onChange={(e) => setField(key, e.target.value)} required={required} data-testid={`input-prereg-${key}`} />
                      </div>
                    ))}
                    <div className="col-span-2">
                      <Label>Address</Label>
                      <Input value={form.address} onChange={(e) => setField("address", e.target.value)} data-testid="input-prereg-address" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-1 border-b">Enrollment Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Course / Program <span className="text-red-500">*</span></Label>
                      <Select onValueChange={(v) => setField("courseId", Number(v))} required>
                        <SelectTrigger data-testid="select-prereg-course"><SelectValue placeholder="Select your course" /></SelectTrigger>
                        <SelectContent>
                          {((courses as any[]) ?? []).filter((c: any) => c.isActive).map((c: any) => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.courseCode} — {c.courseName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Year Level <span className="text-red-500">*</span></Label>
                      <Select defaultValue="1" onValueChange={(v) => setField("yearLevel", Number(v))}>
                        <SelectTrigger data-testid="select-prereg-year"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4].map((y) => <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Enrollment Type</Label>
                      <Select defaultValue="new" onValueChange={(v) => setField("enrollmentType", v)}>
                        <SelectTrigger data-testid="select-prereg-type"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New Student</SelectItem>
                          <SelectItem value="returning">Returning Student</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 pb-1 border-b">Account Password</h3>
                  <div>
                    <Label>Create Password</Label>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" data-testid="input-prereg-password" />
                    <p className="text-xs text-muted-foreground mt-1">This will be used for your student portal login</p>
                  </div>
                </div>

                <Button type="submit" disabled={submitting} className="w-full bg-green-900 hover:bg-green-800 h-11" data-testid="button-submit-prereg">
                  {submitting ? "Submitting..." : "Submit Pre-Registration"}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Already have an account?{" "}
                <a href="/login" className="text-green-700 hover:text-green-900 font-medium">Sign in</a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
