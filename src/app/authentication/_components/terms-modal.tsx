"use client";

import { useEffect, useState } from "react";

import { getTerms, type LegalDocument } from "@/actions/get-terms";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TermsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TermsModal({ open, onOpenChange }: TermsModalProps) {
  const [terms, setTerms] = useState<LegalDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && terms.length === 0) {
      getTerms()
        .then((data) => {
          setTerms(data);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, terms.length]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Termos e Políticas</DialogTitle>
          <DialogDescription>
            Leia atentamente nossos termos e políticas.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          <Tabs defaultValue="terms_of_use" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="terms_of_use">Termos de Uso</TabsTrigger>
              <TabsTrigger value="privacy_policy">Privacidade</TabsTrigger>
              <TabsTrigger value="cookie_policy">Cookies</TabsTrigger>
            </TabsList>
            {terms.map((term) => (
              <TabsContent key={term.type} value={term.type}>
                <div className="h-[400px] w-full overflow-y-auto rounded-md border p-4">
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: term.content }}
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
