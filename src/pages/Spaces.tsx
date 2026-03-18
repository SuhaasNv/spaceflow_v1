import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Plus, Edit2, Trash2, Loader2, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/animations";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Space {
  id: string;
  name: string;
  type: string;
  floor: string | null;
  building: string | null;
  capacity: number;
  isActive: boolean;
}

const spaceTypes = [
  { value: "MEETING_ROOM", label: "Meeting Room" },
  { value: "DESK", label: "Hot Desk" },
  { value: "PHONE_BOOTH", label: "Phone Booth" },
  { value: "COLLABORATION_AREA", label: "Collaboration Area" },
  { value: "OFFICE", label: "Office" },
];

const typeLabel: Record<string, string> = Object.fromEntries(spaceTypes.map((t) => [t.value, t.label]));

const defaultBuildings = ["Main", "East Wing", "West Wing", "Annex"];
const defaultFloors = ["Ground", "1st", "2nd", "3rd", "Basement"];

const emptyForm = { name: "", type: "MEETING_ROOM", floor: "", building: "", capacity: "1" };

const Spaces = () => {
  const queryClient = useQueryClient();
  const [editSpace, setEditSpace] = useState<Space | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ["spaces"],
    queryFn: () => api.get<{ spaces: Space[] }>("/api/spaces?active=true"),
  });

  const spaces = data?.spaces ?? [];

  const createMutation = useMutation({
    mutationFn: (d: typeof form) =>
      api.post("/api/spaces", {
        ...d,
        capacity: parseInt(d.capacity),
        floor: d.floor || undefined,
        building: d.building || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
      setShowCreate(false);
      setForm(emptyForm);
      toast.success("Space created");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Space> }) =>
      api.patch(`/api/spaces/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
      setEditSpace(null);
      toast.success("Space updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/spaces/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spaces"] });
      toast.success("Space deactivated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const buildings = [...new Set([...defaultBuildings, ...spaces.map((s) => s.building).filter(Boolean)])].sort();
  const floors = [...new Set([...defaultFloors, ...spaces.map((s) => s.floor).filter(Boolean)])].sort();

  const SpaceModal = ({
    title,
    initialData,
    onSubmit,
    isPending,
    onClose,
  }: {
    title: string;
    initialData: typeof emptyForm;
    onSubmit: (d: typeof emptyForm) => void;
    isPending: boolean;
    onClose: () => void;
  }) => {
    const [local, setLocal] = useState(initialData);
    const buildingOptions = [...new Set([...buildings, local.building].filter(Boolean))].sort();
    const floorOptions = [...new Set([...floors, local.floor].filter(Boolean))].sort();
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-card rounded-xl p-8 shadow-xl border border-border w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-lg font-bold font-display mb-6">{title}</h2>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Name</Label>
              <Input value={local.name} onChange={(e) => setLocal({ ...local, name: e.target.value })} className="mt-1" placeholder="Meeting Room A" />
            </div>
            <div>
              <Label className="text-sm">Type</Label>
              <Select value={local.type} onValueChange={(v) => setLocal({ ...local, type: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {spaceTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Floor (optional)</Label>
                <Select value={local.floor || "_none"} onValueChange={(v) => setLocal({ ...local, floor: v === "_none" ? "" : v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select floor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {floorOptions.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Building (optional)</Label>
                <Select value={local.building || "_none"} onValueChange={(v) => setLocal({ ...local, building: v === "_none" ? "" : v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select building" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {buildingOptions.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-sm">Capacity</Label>
              <Input type="number" min="1" value={local.capacity} onChange={(e) => setLocal({ ...local, capacity: e.target.value })} className="mt-1" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button
                className="flex-1 gradient-primary text-primary-foreground"
                disabled={isPending || !local.name}
                onClick={() => onSubmit(local)}
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <PageTransition>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary" />
            Spaces
          </h1>
          <p className="text-muted-foreground mt-1">Manage all workspace areas.</p>
        </div>
        <Button className="gradient-primary text-primary-foreground" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add space
        </Button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <SpaceModal
            title="Add New Space"
            initialData={emptyForm}
            onSubmit={(d) => createMutation.mutate(d)}
            isPending={createMutation.isPending}
            onClose={() => setShowCreate(false)}
          />
        )}
        {editSpace && (
          <SpaceModal
            title={`Edit — ${editSpace.name}`}
            initialData={{
              name: editSpace.name,
              type: editSpace.type,
              floor: editSpace.floor ?? "",
              building: editSpace.building ?? "",
              capacity: String(editSpace.capacity),
            }}
            onSubmit={(d) =>
              updateMutation.mutate({
                id: editSpace.id,
                data: { ...d, capacity: parseInt(d.capacity), floor: d.floor || undefined, building: d.building || undefined },
              })
            }
            isPending={updateMutation.isPending}
            onClose={() => setEditSpace(null)}
          />
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : spaces.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No spaces yet. Add your first space.</p>
        </div>
      ) : (
        <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {spaces.map((space) => (
            <StaggerItem key={space.id}>
              <Card className="border-border hover-lift group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-display font-bold">{space.name}</h3>
                      <span className="text-xs text-muted-foreground">{typeLabel[space.type] ?? space.type}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditSpace(space)} className="p-1 text-muted-foreground hover:text-foreground transition-colors" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => deleteMutation.mutate(space.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors" title="Deactivate">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {space.floor && <span className="flex items-center gap-1"><MapPin size={11} />{space.floor}</span>}
                    {space.building && <span>{space.building}</span>}
                    <span className="flex items-center gap-1"><Users size={11} />{space.capacity}</span>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </PageTransition>
  );
};

export default Spaces;
