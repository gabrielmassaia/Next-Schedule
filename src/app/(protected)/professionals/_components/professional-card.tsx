"use client";

import { CalendarIcon, ClockIcon, DollarSignIcon } from "lucide-react";
import { useState } from "react";

import { formatCurrencyInCents } from "@/_helpers/currency";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { professionalsTable } from "@/db/schema";

import { getAvailability } from "../_helpers/availability";
import UpsertProfessionalForm from "./upsert-professional-form";

interface ProfessionalCardProps {
  professional: typeof professionalsTable.$inferSelect;
}

export default function ProfessionalCard({
  professional,
}: ProfessionalCardProps) {
  const [isUpsertProfessionalDialogOpen, setIsUpsertProfessionalDialogOpen] =
    useState(false);
  const professionalInitial = professional.name
    .split(" ")
    .map((name) => name[0])
    .join("");
  const availability = getAvailability(professional);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{professionalInitial}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-sm font-medium">{professional.name}</h3>
            <p className="text-muted-foreground text-sm">
              {professional.specialty}
            </p>
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="flex flex-col gap-2">
        <Badge variant="outline">
          <CalendarIcon className="mr-1" />
          {availability.from.format("dddd")} a {availability.to.format("dddd")}
        </Badge>
        <Badge variant="outline">
          <ClockIcon className="mr-1" />
          {availability.from.format("HH:mm")} as{" "}
          {availability.to.format("HH:mm")}
        </Badge>
        <Badge variant="outline">
          <DollarSignIcon className="mr-1" />
          {formatCurrencyInCents(professional.appointmentPriceInCents)}
        </Badge>
      </CardContent>
      <Separator />
      <CardFooter>
        <Dialog
          open={isUpsertProfessionalDialogOpen}
          onOpenChange={setIsUpsertProfessionalDialogOpen}
        >
          <DialogTrigger asChild>
            <Button className="w-full">Editar Cadastro</Button>
          </DialogTrigger>
          <UpsertProfessionalForm
            professional={{
              ...professional,
              availableFromTime: availability.from.format("HH:mm:ss"),
              availableToTime: availability.to.format("HH:mm:ss"),
            }}
            onSuccess={() => setIsUpsertProfessionalDialogOpen(false)}
          />
        </Dialog>
      </CardFooter>
    </Card>
  );
}
