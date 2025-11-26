"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

// Função para calcular a força da senha
function calculatePasswordStrength(password: string): {
  strength: "weak" | "medium" | "strong";
  percentage: number;
  color: string;
  label: string;
} {
  let score = 0;

  if (!password) {
    return { strength: "weak", percentage: 0, color: "bg-gray-300", label: "" };
  }

  // Comprimento
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 25;

  // Letras maiúsculas
  if (/[A-Z]/.test(password)) score += 15;

  // Letras minúsculas
  if (/[a-z]/.test(password)) score += 15;

  // Números
  if (/\d/.test(password)) score += 10;

  // Caracteres especiais
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 10;

  if (score < 50) {
    return {
      strength: "weak",
      percentage: score,
      color: "bg-red-500",
      label: "Fraca",
    };
  } else if (score < 80) {
    return {
      strength: "medium",
      percentage: score,
      color: "bg-orange-500",
      label: "Média",
    };
  } else {
    return {
      strength: "strong",
      percentage: score,
      color: "bg-green-500",
      label: "Forte",
    };
  }
}

export default function SignUpForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const registerSchema = z
    .object({
      name: z
        .string()
        .trim()
        .min(1, { message: "Nome é obrigatório" })
        .max(50, { message: "Nome deve conter no máximo 50 caracteres" }),
      email: z
        .string()
        .trim()
        .min(1, { message: "Email é obrigatório" })
        .email({ message: "Email inválido" }),
      password: z
        .string()
        .trim()
        .min(8, { message: "Senha deve conter pelo menos 8 caracteres" }),
      confirmPassword: z.string().trim().min(1, {
        message: "Confirmação de senha é obrigatória",
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "As senhas não correspondem",
      path: ["confirmPassword"],
    })
    .refine(
      (data) => {
        const strength = calculatePasswordStrength(data.password);
        return strength.strength !== "weak";
      },
      {
        message:
          "A senha deve ser pelo menos média (adicione números, letras maiúsculas e caracteres especiais)",
        path: ["password"],
      },
    );

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const password = form.watch("password");
  const passwordStrength = calculatePasswordStrength(password || "");

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    await authClient.signUp.email(
      {
        email: values.email,
        password: values.password,
        name: values.name,
      },
      {
        onSuccess: () => {
          toast.success("Conta criada com sucesso");
          // New users always need to select a plan
          router.push("/signature");
        },
        onError: (ctx) => {
          if (ctx.error.code === "USER_ALREADY_EXISTS") {
            toast.error("Email já cadastrado");
            return;
          }

          toast.error("Erro ao criar conta");
        },
      },
    );
  }

  return (
    <>
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <CardHeader>
              <CardTitle>Criar conta</CardTitle>
              <CardDescription>
                Faça seu registro para continuar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite seu nome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite seu email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Digite sua senha"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {password && (
                          <div className="space-y-1">
                            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                              <div
                                className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                                style={{
                                  width: `${passwordStrength.percentage}%`,
                                }}
                              />
                            </div>
                            <p className="text-muted-foreground text-xs">
                              Força da senha: {passwordStrength.label}
                            </p>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirme sua senha"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Criar conta"
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </>
  );
}
