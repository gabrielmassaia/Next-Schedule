"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import * as React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  createSpecialty,
  deleteSpecialty,
  getClinicSpecialties,
  updateSpecialty,
} from "@/actions/specialties";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Specialty {
  id: string;
  name: string;
  isDefault: boolean;
  clinicId: string | null;
}

interface SpecialtiesContentProps {
  clinicId: string;
}

export function SpecialtiesContent({ clinicId }: SpecialtiesContentProps) {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSpecialtyName, setNewSpecialtyName] = useState("");
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(
    null,
  );
  const [editName, setEditName] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const loadSpecialties = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await getClinicSpecialties(clinicId);
      setSpecialties(data);
    } catch {
      toast.error("Erro ao carregar especialidades");
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    loadSpecialties();
  }, [loadSpecialties]);

  const handleCreate = async () => {
    if (!newSpecialtyName.trim()) {
      toast.error("Digite o nome da especialidade");
      return;
    }

    try {
      await createSpecialty(clinicId, newSpecialtyName.trim());
      toast.success("Especialidade criada com sucesso");
      setNewSpecialtyName("");
      setIsAddDialogOpen(false);
      loadSpecialties();
    } catch {
      toast.error("Erro ao criar especialidade");
    }
  };

  const handleUpdate = async () => {
    if (!editingSpecialty || !editName.trim()) {
      toast.error("Digite o nome da especialidade");
      return;
    }

    try {
      await updateSpecialty(editingSpecialty.id, editName.trim());
      toast.success("Especialidade atualizada com sucesso");
      setEditingSpecialty(null);
      setEditName("");
      setIsEditDialogOpen(false);
      loadSpecialties();
    } catch {
      toast.error("Erro ao atualizar especialidade");
    }
  };

  const handleDelete = async (specialty: Specialty) => {
    if (specialty.isDefault) {
      toast.error("Não é possível excluir especialidades padrão");
      return;
    }

    if (
      !confirm(`Deseja realmente excluir a especialidade "${specialty.name}"?`)
    ) {
      return;
    }

    try {
      await deleteSpecialty(specialty.id);
      toast.success("Especialidade excluída com sucesso");
      loadSpecialties();
    } catch {
      toast.error("Erro ao excluir especialidade");
    }
  };

  const defaultSpecialties = specialties.filter((s) => s.isDefault);
  const customSpecialties = specialties.filter((s) => !s.isDefault);

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Custom Specialties */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Especialidades Customizadas</CardTitle>
            <p className="text-muted-foreground text-sm">
              Especialidades específicas da sua clínica
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Especialidade
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Especialidade</DialogTitle>
                <DialogDescription>
                  Adicione uma nova especialidade customizada para sua clínica
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome da Especialidade</Label>
                  <Input
                    id="name"
                    value={newSpecialtyName}
                    onChange={(e) => setNewSpecialtyName(e.target.value)}
                    placeholder="Ex: Acupuntura"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleCreate();
                      }
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreate}>Criar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {customSpecialties.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              Nenhuma especialidade customizada ainda. Clique em (Adicionar
              Especialidade) para criar uma.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customSpecialties.map((specialty) => (
                  <TableRow key={specialty.id}>
                    <TableCell>{specialty.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingSpecialty(specialty);
                            setEditName(specialty.name);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(specialty)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Default Specialties */}
      <Card>
        <CardHeader>
          <CardTitle>Especialidades Padrão</CardTitle>
          <p className="text-muted-foreground text-sm">
            Especialidades disponíveis para todas as clínicas (somente leitura)
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {defaultSpecialties.map((specialty) => (
                <TableRow key={specialty.id}>
                  <TableCell>{specialty.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Especialidade</DialogTitle>
            <DialogDescription>
              Atualize o nome da especialidade
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome da Especialidade</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUpdate();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdate}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
