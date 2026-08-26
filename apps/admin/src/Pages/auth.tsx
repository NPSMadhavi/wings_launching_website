import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Loader2, Mail, Lock, ArrowRight, Phone, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/Layout/Navbar";
import { Footer } from "@/components/Layout/Footer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useCandidateAuth, candidateLogin, candidateRegister } from "@/context/CandidateAuthContext";
import SEO from "@/components/SEO";

export default function Auth() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { login } = useCandidateAuth();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const loginMutation = useMutation({
    mutationFn: async () => candidateLogin(loginEmail, loginPassword),
    onSuccess: (data) => {
      login(data.token, {
        ...data.candidate,
        phoneVerified: data.candidate?.phoneVerified ?? false,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/candidate/me"] });
      toast({ title: "Welcome back!", description: "You have been logged in successfully." });
      const returnTo = sessionStorage.getItem("returnTo") || "/";
      sessionStorage.removeItem("returnTo");
      navigate(returnTo);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Login failed", variant: "destructive" });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async () =>
      candidateRegister({
        email: registerEmail,
        password: registerPassword,
        firstName: registerFirstName,
        lastName: registerLastName,
        phone: registerPhone,
      }),
    onSuccess: (data) => {
      login(data.token, {
        ...data.candidate,
        phoneVerified: data.candidate?.phoneVerified ?? false,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/candidate/me"] });
      toast({ title: "Account Created!", description: "Welcome to WINGS!" });
      const returnTo = sessionStorage.getItem("returnTo") || "/";
      sessionStorage.removeItem("returnTo");
      navigate(returnTo);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Registration failed", variant: "destructive" });
    },
  });

  if (isAuthenticated) {
    const returnTo = sessionStorage.getItem("returnTo") || "/";
    sessionStorage.removeItem("returnTo");
    navigate(returnTo);
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FAFAF5] overflow-x-hidden font-sans">
      <SEO
        title="Authentication | WINGS Counselling Centre"
        description="Sign in or create an account at WINGS Counselling Centre."
        path="/auth"
        noindex={true}
      />
      <Navbar />
      {authLoading && (
        <div className="fixed top-24 right-6 z-[60] rounded-full border border-[#0D4A7A2E] bg-white px-4 py-2 text-sm text-[#0D4A7A] shadow-md font-semibold font-['DM_Sans']">
          Checking status...
        </div>
      )}

      <section className="pt-32 sm:pt-40 pb-20 min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-black font-['Outfit'] mb-2">Welcome to WINGS</h1>
              <p className="text-gray-500 font-['DM_Sans']">Sign in or create a candidate account to apply for positions</p>
            </div>

            <div className="bg-white rounded-[20px] p-8 border border-gray-200 shadow-[0_4px_25px_rgba(0,0,0,0.04)] font-['DM_Sans']">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8 bg-[#FAFAF5] border border-gray-200 rounded-xl p-1">
                  <TabsTrigger 
                    value="login" 
                    className="data-[state=active]:bg-[#1B4585] data-[state=active]:text-white text-gray-500 font-bold rounded-lg transition-all"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register" 
                    className="data-[state=active]:bg-[#1B4585] data-[state=active]:text-white text-gray-500 font-bold rounded-lg transition-all"
                  >
                    Create Account
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      loginMutation.mutate();
                    }}
                    className="space-y-5"
                  >
                    <div>
                      <Label htmlFor="login-email" className="text-gray-700 font-bold">Email</Label>
                      <div className="relative mt-2">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="login-email"
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="pl-10 bg-white border-gray-300 text-black placeholder:text-gray-400 rounded-xl"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="login-password" className="text-gray-700 font-bold">Password</Label>
                      <div className="relative mt-2">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="login-password"
                          type={showLoginPassword ? "text" : "password"}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Your password"
                          className="pl-10 pr-10 bg-white border-gray-300 text-black placeholder:text-gray-400 rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loginMutation.isPending}
                      className="w-full bg-[#1B4585] hover:bg-[#16386b] text-white rounded-full font-bold py-5 shadow-sm mt-2"
                    >
                      {loginMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      registerMutation.mutate();
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-gray-700 font-bold">First Name</Label>
                        <Input
                          value={registerFirstName}
                          onChange={(e) => setRegisterFirstName(e.target.value)}
                          className="mt-2 bg-white border-gray-300 text-black rounded-xl"
                          placeholder="First name"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-700 font-bold">Last Name</Label>
                        <Input
                          value={registerLastName}
                          onChange={(e) => setRegisterLastName(e.target.value)}
                          className="mt-2 bg-white border-gray-300 text-black rounded-xl"
                          placeholder="Last name"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-700 font-bold">Email</Label>
                      <Input
                        type="email"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        className="mt-2 bg-white border-gray-300 text-black rounded-xl"
                        placeholder="you@example.com"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-700 font-bold">Mobile Number</Label>
                      <div className="relative mt-2">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          value={registerPhone}
                          onChange={(e) => setRegisterPhone(e.target.value)}
                          className="pl-10 bg-white border-gray-300 text-black rounded-xl"
                          placeholder="+65 9123 4567"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-gray-700 font-bold">Password</Label>
                        <div className="relative mt-2">
                          <Input
                            type={showRegisterPassword ? "text" : "password"}
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                            className="pr-10 bg-white border-gray-300 text-black rounded-xl"
                            placeholder="Password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-gray-700 font-bold">Confirm</Label>
                        <div className="relative mt-2">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            value={registerConfirmPassword}
                            onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                            className="pr-10 bg-white border-gray-300 text-black rounded-xl"
                            placeholder="Confirm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={registerMutation.isPending}
                      className="w-full bg-[#1B4585] hover:bg-[#16386b] text-white rounded-full font-bold py-5 shadow-sm mt-4"
                    >
                      {registerMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <>
                          Create Account
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
