import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getPlanBySlug } from "@/data/subscription-plans";
import { auth } from "@/lib/auth";

import FormClinic from "./_components/form-clinic";

export default async function ClinicFormPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/authentication");
  }

  const clinics = session.user.clinics ?? [];
  const plan = await getPlanBySlug(session.user.plan);
  const clinicsLimit = plan.limits.clinics;

  if (typeof clinicsLimit === "number" && clinics.length >= clinicsLimit) {
    redirect("/subscription");
  }

  return (
    <div>
      <Dialog open>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar clínica</DialogTitle>
            <DialogDescription>
              Adicione uma clínica para continuar.
            </DialogDescription>
          </DialogHeader>
          <FormClinic />
        </DialogContent>
      </Dialog>
    </div>
  );
}
