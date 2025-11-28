"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Loader2 } from "lucide-react";
import Link from "next/link";
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

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "Email é obrigatório" })
    .email({ message: "Email inválido" }),
});

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    try {
      await axios.post("/api/auth/reset-password/request", values);
      setIsSubmitted(true);
      toast.success("Email enviado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar email. Tente novamente.");
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Recuperar senha</CardTitle>
          <CardDescription>
            Digite seu email para receber um link de redefinição de senha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Se um conta existir com o email{" "}
                <strong>{form.getValues("email")}</strong>, você receberá um
                link para redefinir sua senha em instantes.
              </p>
              <Button asChild className="w-full" variant="outline">
                <Link href="/authentication">Voltar para o login</Link>
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
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
                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Enviar link"
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        {!isSubmitted && (
          <CardFooter className="flex justify-center">
            <Link
              href="/authentication"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Voltar para o login
            </Link>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
