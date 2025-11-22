import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/lib/auth";

import LoginCarousel from "./_components/login-carousel";
import LoginForm from "./_components/login-form";
import SignUpForm from "./_components/sign-up-form";

export default async function AuthenticationPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      {/* Left Side - Login Form */}
      <div className="bg-background flex w-full flex-1 items-center justify-center p-8 lg:w-1/2 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo/Branding */}
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">NextSchedule</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Gerencie seus agendamentos com facilidade
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Criar conta</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
            <TabsContent value="register">
              <SignUpForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Side - Carousel (Hidden on mobile) */}
      <div className="hidden lg:block lg:w-1/2">
        <LoginCarousel />
      </div>
    </div>
  );
}
