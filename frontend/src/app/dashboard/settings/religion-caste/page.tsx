"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

import { useReligions } from "@/hooks/settings/useReligions";
import { useCreateReligion } from "@/hooks/settings/useCreateReligion";
import { useUpdateReligion } from "@/hooks/settings/useUpdateReligion";
import { useDeleteReligion } from "@/hooks/settings/useDeleteReligion";
import { useCreateCaste } from "@/hooks/settings/useCreateCaste";
import { useUpdateCaste } from "@/hooks/settings/useUpdateCaste";
import { useDeleteCaste } from "@/hooks/settings/useDeleteCaste";

type Caste = {
  id: string;
  name: string;
  caste_reservation?: string;
};

type Religion = {
  id: string;
  name: string;
  castes?: Caste[];
};

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );
}

export default function ReligionCastePage() {
  const { toast } = useToast();
  const { data, isLoading, refetch } = useReligions();
  const createReligion = useCreateReligion();
  const updateReligion = useUpdateReligion();
  const deleteReligion = useDeleteReligion();
  const createCaste = useCreateCaste();
  const updateCaste = useUpdateCaste();
  const deleteCaste = useDeleteCaste();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [religionDialogOpen, setReligionDialogOpen] = useState(false);
  const [editingReligion, setEditingReligion] = useState<Religion | null>(null);
  const [religionName, setReligionName] = useState("");

  const [casteDialogOpen, setCasteDialogOpen] = useState(false);
  const [selectedReligionForCaste, setSelectedReligionForCaste] = useState<Religion | null>(null);
  const [editingCaste, setEditingCaste] = useState<Caste | null>(null);
  const [casteName, setCasteName] = useState("");
  const [casteReservation, setCasteReservation] = useState("");

  if (isLoading) return <LoadingSpinner />;

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);

  // Religion handlers
  const openAddReligion = () => {
    setEditingReligion(null);
    setReligionName("");
    setReligionDialogOpen(true);
  };

  const openEditReligion = (religion: Religion) => {
    setEditingReligion(religion);
    setReligionName(religion.name);
    setReligionDialogOpen(true);
  };

  const handleReligionSubmit = async () => {
    if (!religionName.trim()) {
      toast({ title: "Error", description: "Religion name required", variant: "destructive" });
      return;
    }
    try {
      if (editingReligion) {
        await updateReligion.mutate({ id: editingReligion.id, name: religionName });
      } else {
        await createReligion.mutate(religionName);
      }
      toast({ title: "Success", description: "Saved successfully" });
      await refetch();
      setReligionDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteReligion = async (id: string) => {
    if (!confirm("Delete this religion? All castes will also be deleted.")) return;
    try {
      await deleteReligion.mutate(id);
      toast({ title: "Deleted successfully" });
      await refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // Caste handlers
  const openAddCaste = (religion: Religion) => {
    setSelectedReligionForCaste(religion);
    setEditingCaste(null);
    setCasteName("");
    setCasteReservation("");
    setCasteDialogOpen(true);
  };

  const openEditCaste = (caste: Caste, religion: Religion) => {
    setSelectedReligionForCaste(religion);
    setEditingCaste(caste);
    setCasteName(caste.name);
    setCasteReservation(caste.caste_reservation || "");
    setCasteDialogOpen(true);
  };

  const handleCasteSubmit = async () => {
    if (!selectedReligionForCaste) {
      toast({ title: "Error", description: "Select religion", variant: "destructive" });
      return;
    }
    if (!casteName.trim()) {
      toast({ title: "Error", description: "Caste name required", variant: "destructive" });
      return;
    }
    try {
      if (editingCaste) {
        await updateCaste.mutate({
          caste_id: editingCaste.id,
          name: casteName,
          caste_reservation: casteReservation,
        });
      } else {
        await createCaste.mutate({
          religion_id: selectedReligionForCaste.id,
          name: casteName,
          caste_reservation: casteReservation,
        });
      }
      toast({ title: "Success", description: "Saved successfully" });
      await refetch();
      setCasteDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteCaste = async (id: string) => {
    if (!confirm("Delete this caste?")) return;
    try {
      await deleteCaste.mutate(id);
      toast({ title: "Deleted successfully" });
      await refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Religion & Caste Manager</h1>
        <Button onClick={openAddReligion} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="mr-2 h-4 w-4" /> Add Religion
        </Button>
      </div>

      {data?.data?.length === 0 && (
        <div className="text-center py-12 text-gray-500">No religions found. Click "Add Religion" to get started.</div>
      )}

      {data?.data?.map((religion: Religion) => (
        <Card key={religion.id}>
          <CardHeader className="flex flex-row justify-between items-center flex-wrap gap-2">
            <CardTitle>{religion.name}</CardTitle>
            <div className="flex gap-2">
              <Button aria-label={`Add caste to ${religion.name}`} onClick={() => openAddCaste(religion)} className="bg-green-600 hover:bg-green-700 text-white"><Plus className="h-4 w-4" /></Button>
              <Button aria-label={`Edit ${religion.name}`} onClick={() => openEditReligion(religion)} className="bg-blue-600 hover:bg-blue-700 text-white"><Pencil className="h-4 w-4" /></Button>
              <Button aria-label={`Delete ${religion.name}`} onClick={() => handleDeleteReligion(religion.id)} className="bg-red-600 hover:bg-red-700 text-white"><Trash2 className="h-4 w-4" /></Button>
              <Button onClick={() => toggle(religion.id)} variant="outline" className="border-gray-300 text-gray-700">
                {expanded === religion.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          {expanded === religion.id && (
            <CardContent>
              {religion.castes?.length ? (
                religion.castes.map((caste) => (
                  <div key={caste.id} className="flex justify-between items-center border p-2 rounded mb-2">
                    <div>
                      <span className="font-medium">{caste.name}</span>
                      {caste.caste_reservation && <span className="ml-2 text-xs text-gray-500">({caste.caste_reservation})</span>}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => openEditCaste(caste, religion)} className="bg-blue-600 hover:bg-blue-700 text-white" size="sm"><Pencil className="h-4 w-4" /></Button>
                      <Button onClick={() => handleDeleteCaste(caste.id)} className="bg-red-600 hover:bg-red-700 text-white" size="sm"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No castes added yet.</p>
              )}
            </CardContent>
          )}
        </Card>
      ))}

      {/* Religion Dialog */}
      <Dialog open={religionDialogOpen} onOpenChange={setReligionDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingReligion ? "Edit Religion" : "Add Religion"}</DialogTitle></DialogHeader>
          <Input value={religionName} onChange={(e) => setReligionName(e.target.value)} placeholder="Religion name" autoFocus />
          <DialogFooter><Button onClick={handleReligionSubmit} className="bg-blue-600 hover:bg-blue-700 text-white">{editingReligion ? "Update" : "Add"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Caste Dialog */}
      <Dialog open={casteDialogOpen} onOpenChange={setCasteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCaste ? "Edit Caste" : "Add Caste"}{selectedReligionForCaste && <span className="text-sm font-normal text-gray-500 ml-2">for {selectedReligionForCaste.name}</span>}</DialogTitle>
          </DialogHeader>
          <Input placeholder="Caste name" value={casteName} onChange={(e) => setCasteName(e.target.value)} autoFocus />
          <Input placeholder="Reservation (optional)" value={casteReservation} onChange={(e) => setCasteReservation(e.target.value)} />
          <DialogFooter><Button onClick={handleCasteSubmit} className="bg-blue-600 hover:bg-blue-700 text-white">{editingCaste ? "Update" : "Add"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}