import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, User, Mail, Phone, AlertCircle, Send, ClipboardList } from "lucide-react";
import { SiteCheckIcon } from "@/components/ui/SiteIcons";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Layout/Navbar";
import { Footer } from "@/components/Layout/Footer";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { CandidateApplication } from "@/lib/careers-types";
import SEO from "@/components/SEO";

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [otp, setOtp] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: applications, isLoading: appsLoading } = useQuery<CandidateApplication[]>({
    queryKey: ["/api/candidate/applications"],
    enabled: isAuthenticated,
  });

  const sendOtpMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/candidate/send-mobile-otp");
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "OTP Sent", description: data.message || "Verification code sent to your mobile number." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to send OTP", variant: "destructive" });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/candidate/verify-mobile-otp", { otp });
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Verified", description: data.message || "Mobile verified successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/candidate/me"] });
      setOtp("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to verify OTP", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF5] flex items-center justify-center font-sans">
        <div className="text-[#1B4585] font-semibold text-lg flex items-center gap-2">
          <Loader2 className="w-6 h-6 text-[#1B4585] animate-spin" />
          Loading profile...
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#FAFAF5] font-sans">
        <Navbar />
        <section className="pt-40 pb-20">
          <div className="container mx-auto px-6 md:px-12 lg:px-[150px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-lg mx-auto text-center bg-white rounded-[20px] p-8 border border-gray-200 shadow-sm"
            >
              <User className="w-16 h-16 text-[#0D4A7A] mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-black font-['Outfit'] mb-4">Sign In Required</h1>
              <p className="text-gray-600 font-['DM_Sans'] mb-8">
                Please sign in to view your candidate profile and job applications.
              </p>
              <a href="/auth">
                <Button className="bg-[#1B4585] hover:bg-[#16386b] text-white rounded-full font-bold px-8 py-3 w-full">
                  Go to Sign In
                </Button>
              </a>
            </motion.div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF5] overflow-x-hidden font-sans">
      <SEO
        title="Candidate Profile | WINGS Counselling Centre"
        description="Candidate Profile management"
        path="/profile"
        noindex={true}
      />
      <Navbar />

      {/* Profile Overview */}
      <section className="pt-32 sm:pt-40 pb-12 bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 md:px-12 lg:px-[150px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[20px] p-8 border border-gray-200 shadow-[0_4px_25px_rgba(0,0,0,0.04)] font-['DM_Sans']"
          >
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-[#0D4A7A2E] flex items-center justify-center">
                <User className="w-6 h-6 text-[#0D4A7A]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-black font-['Outfit']">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-gray-500 font-medium">{user.email}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-sm font-medium text-gray-700 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#0D4A7A]" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#0D4A7A]" />
                <span>{user.phone || "No mobile number registered"}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Profile Portal content */}
      <section className="py-16 bg-[#FAFAF5]">
        <div className="container mx-auto px-6 md:px-12 lg:px-[150px]">
          <div className="grid lg:grid-cols-[1.1fr,0.9fr] gap-8 items-start">
            
            {/* Mobile Verification */}
            <Card className="bg-white border border-gray-200 rounded-[20px] shadow-[0_4px_25px_rgba(0,0,0,0.04)] overflow-hidden font-['DM_Sans']">
              <CardHeader className="p-6 pb-4 border-b border-gray-100">
                <CardTitle className="text-black font-['Outfit'] text-xl flex items-center gap-2">
                  <Phone className="w-5 h-5 text-[#0D4A7A]" />
                  Mobile Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-[#FAFAF5]">
                  {user.phoneVerified ? (
                    <SiteCheckIcon size={24} color="#16a34a" className="shrink-0" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-yellow-500 shrink-0" />
                  )}
                  <div>
                    <p className="text-black font-bold">
                      {user.phoneVerified ? "Mobile number verified" : "Mobile number not verified"}
                    </p>
                    <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                      {user.phoneVerified
                        ? "Your account is fully verified. You can now apply for open positions."
                        : "Please request an OTP below to verify your phone number before applying."}
                    </p>
                  </div>
                </div>

                {!user.phoneVerified && (
                  <div className="space-y-4">
                    <Button
                      onClick={() => sendOtpMutation.mutate()}
                      disabled={sendOtpMutation.isPending}
                      className="bg-[#1B4585] hover:bg-[#16386b] text-white rounded-full font-bold px-6 py-2.5 transition-all shadow-sm"
                    >
                      {sendOtpMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2 text-white" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Send OTP via SMS
                    </Button>

                    <div className="grid gap-2 pt-2">
                      <Label className="text-gray-700 font-bold">Enter Verification Code</Label>
                      <Input
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="bg-white border-gray-300 text-black placeholder:text-gray-400 rounded-xl mt-1"
                        placeholder="6-digit code"
                      />
                    </div>

                    <Button
                      onClick={() => verifyOtpMutation.mutate()}
                      disabled={verifyOtpMutation.isPending || !otp.trim()}
                      className="bg-[#1B4585] hover:bg-[#16386b] text-white rounded-full font-bold px-6 py-2.5 transition-all shadow-sm w-full"
                    >
                      {verifyOtpMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2 text-white" />
                      ) : null}
                      Verify OTP
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Applications List */}
            <Card className="bg-white border border-gray-200 rounded-[20px] shadow-[0_4px_25px_rgba(0,0,0,0.04)] overflow-hidden font-['DM_Sans']">
              <CardHeader className="p-6 pb-4 border-b border-gray-100">
                <CardTitle className="text-black font-['Outfit'] text-xl flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-[#0D4A7A]" />
                  Your Applications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {appsLoading ? (
                  <div className="py-6 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#1B4585]" />
                  </div>
                ) : applications?.length ? (
                  applications.map((app) => (
                    <div key={app.id} className="rounded-xl border border-gray-200 bg-[#FAFAF5] p-4 font-['DM_Sans']">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-black font-bold text-base leading-tight">{app.jobTitle || `Application #${app.applicationNumber}`}</p>
                          <p className="text-gray-500 text-xs mt-1">Ref: {app.applicationNumber}</p>
                        </div>
                        <Badge className="bg-[#0D4A7A2E] text-[#0D4A7A] hover:bg-[#0D4A7A2E] border-0 font-semibold text-xs px-2.5 py-1 rounded-[10px]">
                          {app.status}
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-xs mt-4 font-medium">
                        Submitted on {new Date(app.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    You have not submitted any applications yet.
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
