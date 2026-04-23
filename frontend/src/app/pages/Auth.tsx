import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  ShieldCheck,
  ArrowLeft,
  Mail,
  Lock,
  UserRound,
  CheckCircle2,
} from "lucide-react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useLocale } from "../lib/locale";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import { login, register } from "../lib/api/auth";
import { useAuth } from "../lib/auth-context";

type AuthTab = "signin" | "signup";

const COPY = {
  en: {
    badge: "Secure access",
    title: "Welcome to FAinance",
    subtitle: "Sign in to sync your data, budgets, and smart insights.",
    signin: "Sign in",
    signup: "Sign up",
    signinTitle: "Welcome back",
    signinHint: "Enter your credentials to access your workspace.",
    signupTitle: "Join FAinance",
    signupHint: "Create your personalized account in seconds.",
    fullName: "Full name",
    email: "Email address",
    password: "Password",
    confirmPassword: "Confirm password",
    forgotPassword: "Forgot password?",
    signinAction: "Sign in",
    signupAction: "Create account",
    signinSuccess: "Welcome back! Signed in successfully.",
    signupSuccess: "Account created successfully.",
    passwordMismatch: "Passwords do not match.",
    forgotPasswordComingSoon: "Password recovery is currently unavailable.",
    trust1: "Military-grade encryption",
    trust2: "Private financial workspace",
  },
  vi: {
    badge: "Tài khoản bảo mật",
    title: "Chào mừng đến với FAinance",
    subtitle: "Đăng nhập để đồng bộ danh mục, ngân sách và trợ lý thông minh.",
    signin: "Đăng nhập",
    signup: "Đăng ký",
    signinTitle: "Tiếp tục hành trình tài chính",
    signinHint: "Dùng email và mật khẩu để truy cập không gian của bạn.",
    signupTitle: "Tạo tài khoản mới",
    signupHint: "Khởi tạo dashboard cá nhân chỉ trong chưa đến một phút.",
    fullName: "Họ và tên",
    email: "Email",
    password: "Mật khẩu",
    confirmPassword: "Nhập lại mật khẩu",
    forgotPassword: "Quên mật khẩu?",
    signinAction: "Đăng nhập",
    signupAction: "Tạo tài khoản",
    signinSuccess: "Đăng nhập thành công.",
    signupSuccess: "Tạo tài khoản thành công.",
    passwordMismatch: "Mật khẩu xác nhận không khớp.",
    forgotPasswordComingSoon: "Chức năng quên mật khẩu chưa được kết nối.",
    trust1: "Phiên đăng nhập được mã hóa",
    trust2: "Dữ liệu tài chính luôn riêng tư",
  },
} as const;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Request failed.";
}

export function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { locale, t } = useLocale();
  const { setSession } = useAuth();

  const text = locale === "en" ? COPY.en : COPY.vi;
  const [activeTab, setActiveTab] = useState<AuthTab>("signin");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo =
    typeof location.state === "object" &&
    location.state !== null &&
    "from" in location.state &&
    typeof (location.state as { from?: unknown }).from === "string"
      ? (location.state as { from: string }).from
      : "/";

  const contentTransition = {
    duration: 0.22,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    setIsSubmitting(true);
    try {
      const session = await login({ email, password });
      setSession(session);
      toast.success(text.signinSuccess);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const form = new FormData(event.currentTarget);
    const displayName = String(form.get("display_name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirmPassword = String(form.get("confirm_password") ?? "");

    if (password !== confirmPassword) {
      toast.error(text.passwordMismatch);
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await register({
        display_name: displayName || null,
        email,
        password,
      });
      setSession(session);
      toast.success(text.signupSuccess);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 pb-8 pt-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-emerald-500/20 via-cyan-500/10 to-transparent" />
      <div className="pointer-events-none absolute -right-20 top-20 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-14 top-36 h-44 w-44 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-md flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="border-border/80 bg-card/95 p-5 shadow-[0_18px_48px_rgba(2,6,23,0.16)] backdrop-blur-md">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {text.badge}
                </p>
                <h1 className="mt-3 text-xl font-semibold text-foreground">{text.title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{text.subtitle}</p>
              </div>

              <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                <Link to="/" aria-label={t("page.dashboard")}>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AuthTab)} className="w-full">
              <TabsList className="h-10 w-full rounded-xl bg-muted/70 p-1">
                <TabsTrigger value="signin">{text.signin}</TabsTrigger>
                <TabsTrigger value="signup">{text.signup}</TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait" initial={false}>
                {activeTab === "signin" ? (
                  <motion.div
                    key="signin-panel"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={contentTransition}
                    className="pt-4"
                  >
                    <h2 className="text-base font-semibold text-foreground">{text.signinTitle}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{text.signinHint}</p>

                    <form className="mt-5 space-y-4" onSubmit={handleSignIn}>
                      <div className="space-y-1.5">
                        <Label htmlFor="signin-email">{text.email}</Label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="signin-email"
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            placeholder="name@email.com"
                            className="h-11 pl-9"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="signin-password">{text.password}</Label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="signin-password"
                            name="password"
                            type="password"
                            required
                            autoComplete="current-password"
                            placeholder="••••••••"
                            className="h-11 pl-9"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        className="text-xs font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-300"
                        onClick={() => toast.message(text.forgotPasswordComingSoon)}
                      >
                        {text.forgotPassword}
                      </button>

                      <Button type="submit" className="h-11 w-full text-sm font-semibold" disabled={isSubmitting}>
                        {isSubmitting ? "..." : text.signinAction}
                      </Button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="signup-panel"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={contentTransition}
                    className="pt-4"
                  >
                    <h2 className="text-base font-semibold text-foreground">{text.signupTitle}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{text.signupHint}</p>

                    <form className="mt-5 space-y-4" onSubmit={handleSignUp}>
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-name">{text.fullName}</Label>
                        <div className="relative">
                          <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="signup-name"
                            name="display_name"
                            type="text"
                            required
                            autoComplete="name"
                            placeholder="Nguyen Van A"
                            className="h-11 pl-9"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="signup-email">{text.email}</Label>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="signup-email"
                            name="email"
                            type="email"
                            required
                            autoComplete="email"
                            placeholder="name@email.com"
                            className="h-11 pl-9"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="signup-password">{text.password}</Label>
                          <div className="relative">
                            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              id="signup-password"
                              name="password"
                              type="password"
                              required
                              autoComplete="new-password"
                              placeholder="••••••••"
                              className="h-11 pl-9"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="signup-confirm">{text.confirmPassword}</Label>
                          <div className="relative">
                            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              id="signup-confirm"
                              name="confirm_password"
                              type="password"
                              required
                              autoComplete="new-password"
                              placeholder="••••••••"
                              className="h-11 pl-9"
                            />
                          </div>
                        </div>
                      </div>

                      <Button type="submit" className="h-11 w-full text-sm font-semibold" disabled={isSubmitting}>
                        {isSubmitting ? "..." : text.signupAction}
                      </Button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </Tabs>

            <div className="mt-6 space-y-2 border-t border-border/70 pt-4 text-xs text-muted-foreground">
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                {text.trust1}
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                {text.trust2}
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}