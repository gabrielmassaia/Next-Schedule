"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { PatternFormat } from "react-number-format";
import { toast } from "sonner";
import z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";

import { TermsModal } from "./terms-modal";

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
  const [termsOpen, setTermsOpen] = useState(false);

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
      cpf: z
        .string()
        .trim()
        .min(1, { message: "CPF é obrigatório" })
        .refine((val) => val.replace(/\D/g, "").length === 11, {
          message: "CPF inválido",
        }),
      phone: z
        .string()
        .trim()
        .min(1, { message: "Telefone é obrigatório" })
        .refine((val) => val.replace(/\D/g, "").length >= 10, {
          message: "Telefone inválido",
        }),
      birthDate: z
        .string()
        .min(1, { message: "Data de nascimento é obrigatória" }),
      sex: z.enum(["male", "female"], {
        required_error: "Sexo é obrigatório",
      }),
      password: z
        .string()
        .trim()
        .min(8, { message: "Senha deve conter pelo menos 8 caracteres" }),
      confirmPassword: z.string().trim().min(1, {
        message: "Confirmação de senha é obrigatória",
      }),
      terms: z.boolean().refine((val) => val === true, {
        message: "Você deve aceitar os termos de uso",
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
      cpf: "",
      phone: "",
      birthDate: "",
      sex: undefined,
      password: "",
      confirmPassword: "",
      terms: false,
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
        cpf: values.cpf.replace(/\D/g, ""), // Save raw CPF
        phone: values.phone.replace(/\D/g, ""), // Save raw Phone
        birthDate: values.birthDate,
        sex: values.sex,
      } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
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
      <TermsModal open={termsOpen} onOpenChange={setTermsOpen} />
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <CardHeader>
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
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
                      <FormControl>
                        <PatternFormat
                          format="###.###.###-##"
                          customInput={Input}
                          placeholder="000.000.000-00"
                          onValueChange={(values) => {
                            field.onChange(values.value);
                          }}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <PatternFormat
                          format="(##) #####-####"
                          customInput={Input}
                          placeholder="(00) 00000-0000"
                          onValueChange={(values) => {
                            field.onChange(values.value);
                          }}
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Nascimento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sexo</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Masculino</SelectItem>
                          <SelectItem value="female">Feminino</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Aceito os{" "}
                        <button
                          type="button"
                          className="text-primary hover:underline"
                          onClick={() => setTermsOpen(true)}
                        >
                          termos de uso
                        </button>
                        , políticas de privacidade e cookies.
                      </FormLabel>
                      <FormMessage />
                    </div>
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
