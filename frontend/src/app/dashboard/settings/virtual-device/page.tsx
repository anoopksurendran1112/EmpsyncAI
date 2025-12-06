"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trash2, Edit, Plus, Smartphone, User, Mail, Phone, Fingerprint } from "lucide-react";

export default function VirtualDevicePage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    mobile: "",
    email: "",
    biometric_id: "",
  });
  const [editData, setEditData] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // ✅ Fetch devices from Next.js API
  const fetchDevices = async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/settings/virtual-device?page=${page}`);
      const data = await res.json();
      setDevices(data.devices || []);
    } catch (err) {
      console.error("Error fetching devices:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Create new device
  const handleCreate = async () => {
    try {
      const payload = {
        device_id: formData.biometric_id, // adapt as needed
        ...formData,
      };
      const res = await fetch(`/api/settings/virtual-device`, {
        method: "PUT", // since backend toggles `is_active` on PUT
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Device created/updated successfully!");
        setFormData({ first_name: "", last_name: "", mobile: "", email: "", biometric_id: "" });
        fetchDevices();
      } else {
        alert(data.message || "Failed to create/update device");
      }
    } catch (err) {
      console.error("Error creating device:", err);
    }
  };

  // ✅ Delete device
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this device?")) return;
    try {
      const res = await fetch(`/api/settings/virtual-device`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Device deleted");
        fetchDevices();
      } else {
        alert(data.message || "Failed to delete device");
      }
    } catch (err) {
      console.error("Error deleting device:", err);
    }
  };

  // ✅ Open Edit Modal
  const openEditModal = (device: any) => {
    setEditData(device);
    setIsEditOpen(true);
  };

  // ✅ Update device
  const handleUpdate = async () => {
    try {
      const payload = {
        device_id: editData.biometric_id, // backend requires `device_id`
        ...editData,
      };
      const res = await fetch(`/api/settings/virtual-device`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Device updated successfully!");
        setIsEditOpen(false);
        fetchDevices();
      } else {
        alert(data.message || "Failed to update device");
      }
    } catch (err) {
      console.error("Error updating device:", err);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Virtual Devices
            </h1>
            <p className="text-muted-foreground">
              Manage your virtual device collection and configurations
            </p>
          </div>
          <Badge variant="secondary" className="px-3 py-1">
            {devices.length} Device{devices.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Device Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                <span>Loading devices...</span>
              </div>
            </div>
          ) : devices.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Smartphone className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No devices found. Create your first virtual device below.</p>
            </div>
          ) : (
            devices.map((device) => (
              <Card key={device.id} className="group hover:shadow-lg transition-all duration-200 border-border/50 hover:border-border bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Smartphone className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-card-foreground">
                          {device.first_name} {device.last_name}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs mt-1">
                          ID: {device.id}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">{device.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{device.mobile}</span>
                    </div>
                    {device.biometric_id && (
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <Fingerprint className="h-3.5 w-3.5" />
                        <span className="font-mono text-xs">{device.biometric_id}</span>
                      </div>
                    )}
                  </div>
                  
                  <Separator className="my-3" />
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditModal(device)}
                      className="flex-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <Edit className="h-3.5 w-3.5 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(device.id)}
                      className="hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Create New Device */}
        <Card className="border-dashed border-2 hover:border-primary/50 transition-colors bg-card/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-primary" />
              <span>Add New Virtual Device</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                  <User className="h-3.5 w-3.5" />
                  <span>First Name</span>
                </label>
                <Input
                  placeholder="Enter first name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                  <User className="h-3.5 w-3.5" />
                  <span>Last Name</span>
                </label>
                <Input
                  placeholder="Enter last name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                  <Phone className="h-3.5 w-3.5" />
                  <span>Mobile</span>
                </label>
                <Input
                  placeholder="Enter mobile number"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                  <Mail className="h-3.5 w-3.5" />
                  <span>Email</span>
                </label>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-background/50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                <Fingerprint className="h-3.5 w-3.5" />
                <span>Biometric ID</span>
              </label>
              <Input
                placeholder="Enter biometric ID (optional)"
                value={formData.biometric_id}
                onChange={(e) => setFormData({ ...formData, biometric_id: e.target.value })}
                className="bg-background/50"
              />
            </div>
            <Button 
              onClick={handleCreate} 
              className="w-full md:w-auto bg-primary hover:bg-primary/90"
              size="lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Device
            </Button>
          </CardContent>
        </Card>

        {/* Edit Device Modal */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-md bg-background/95 backdrop-blur-md border border-border/50">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Edit className="h-5 w-5 text-primary" />
                <span>Edit Device</span>
              </DialogTitle>
            </DialogHeader>
            {editData && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                    <User className="h-3.5 w-3.5" />
                    <span>First Name</span>
                  </label>
                  <Input
                    placeholder="First Name"
                    value={editData.first_name}
                    onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                    <User className="h-3.5 w-3.5" />
                    <span>Last Name</span>
                  </label>
                  <Input
                    placeholder="Last Name"
                    value={editData.last_name}
                    onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                    <Phone className="h-3.5 w-3.5" />
                    <span>Mobile</span>
                  </label>
                  <Input
                    placeholder="Mobile"
                    value={editData.mobile}
                    onChange={(e) => setEditData({ ...editData, mobile: e.target.value })}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                    <Mail className="h-3.5 w-3.5" />
                    <span>Email</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                    <Fingerprint className="h-3.5 w-3.5" />
                    <span>Biometric ID</span>
                  </label>
                  <Input
                    placeholder="Biometric ID"
                    value={editData.biometric_id}
                    onChange={(e) => setEditData({ ...editData, biometric_id: e.target.value })}
                    className="bg-background/50"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleUpdate} className="flex-1">
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}