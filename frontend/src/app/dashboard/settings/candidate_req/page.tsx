"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Clock, History, CalendarCheck, Send, X, Facebook, Linkedin, Twitter, Link2, } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";

interface Request {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  group: string;
  is_wfh: boolean;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export default function CandidateRequestPage() {
  const { company } = useAuth();

  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shareableUrl, setShareableUrl] = useState("");

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Request | null>(null);
  const [password, setPassword] = useState("");
  const [wfhEnabled, setWfhEnabled] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchRequests = async () => {
    if (!company?.id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/candidate_request?company_id=${company.id}`);
      const result = await res.json();
      if (res.ok && result.success) {
        setRequests(Array.isArray(result.data) ? result.data : []);
      }
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [company?.id]);

  useEffect(() => {
    if (typeof window !== "undefined" && company?.id) {
      setShareableUrl(`${window.location.origin}/${company.id}`);
    }
  }, [company?.id]);

  const socialLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareableUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareableUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareableUrl)}`,
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareableUrl);
    alert("Link copied!");
  };

  //Accept handler 
  const handleAccept = async () => {
    if (!selectedApplication) return;
    if (!password.trim()) {
      alert("Please enter a password.");
      return;
    }

    const appId = selectedApplication.id;
    setUpdating(true);

    try {
    const res = await fetch("/api/candidate_request", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        application_id: appId,
        status: "approved",
        wfh: wfhEnabled,
        password: password.trim(),
      }),
    });

      
      await fetchRequests();
      
      const updatedApp = requests.find((r) => r.id === appId);
      if (updatedApp?.status === "approved") {
        
        setDetailDialogOpen(false);
        setSelectedApplication(null);
        setPassword("");
      } else {
        
        const result = await res.text();
        alert(result || "Failed to approve application.");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    } finally {
      setUpdating(false);
    }
  };

  // ----- Reject handler (similar) -----
  const handleReject = async () => {
    if (!selectedApplication) return;
    if (!confirm("Reject this application?")) return;

    const appId = selectedApplication.id;
    setUpdating(true);

    try {
      const res = await fetch("/api/candidate_request", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: appId,
          status: "rejected",
        }),
      });

      await fetchRequests();

      const updatedApp = requests.find((r) => r.id === appId);
      if (updatedApp?.status === "rejected") {
        setDetailDialogOpen(false);
        setSelectedApplication(null);
      } else {
        const result = await res.text();
        alert(result || "Failed to reject application.");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    } finally {
      setUpdating(false);
    }
  };

  const total = requests.length;
  const approved = requests.filter((r) => r.status === "approved").length;
  const pending = requests.filter((r) => r.status === "pending").length;
  const rejected = requests.filter((r) => r.status === "rejected").length;

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8">
      <div className="max-w-6xl mx-auto pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Candidate Requests</h1>
            <p className="text-sm text-gray-500 mt-1">Request information from candidates</p>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            onClick={() => setIsModalOpen(true)}
          >
            <Send className="h-4 w-4 mr-2" />
            Send Requests
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">Total</h3>
              <p className="text-3xl font-bold text-blue-600">{total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <History className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">Approved</h3>
              <p className="text-3xl font-bold text-green-600">{approved}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CalendarCheck className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">Pending</h3>
              <p className="text-3xl font-bold text-amber-600">{pending}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-full">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">Rejected</h3>
              <p className="text-3xl font-bold text-red-600">{rejected}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <X className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Recent Requests</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Requested On</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length > 0 ? (
                  requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">
                        {req.first_name} {req.last_name}
                      </TableCell>
                      <TableCell>{req.role}</TableCell>
                      <TableCell>{req.group}</TableCell>
                      <TableCell>
                        {new Date(req.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            req.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : req.status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                        {req.status === "pending" && (
                          <Button variant="ghost" size="sm" className="h-8 text-xs hover:bg-amber-50 text-amber-800 ml-2"
                            onClick={() => {
                              setSelectedApplication(req);
                              setPassword("");
                              setWfhEnabled(req.is_wfh); 
                              setDetailDialogOpen(true);
                            }}
                          >
                            View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      No requests found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Share Dialog */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md bg-white rounded-xl p-0 overflow-hidden border border-[#dde3ec] shadow-2xl">
            <DialogHeader className="p-6 border-b border-[#dde3ec] bg-white relative">
              <DialogTitle className="text-[18px] font-bold text-[#1a1a2e] tracking-tight">
                Share Profile
              </DialogTitle>
            </DialogHeader>
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">
                  Profile Link
                </label>
                <div className="flex gap-2">
                  <Input readOnly value={shareableUrl} className="bg-gray-50" />
                  <Button onClick={copyToClipboard}>Copy</Button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <Button variant="outline" onClick={() => window.open(socialLinks.twitter, "_blank")}>
                  <Twitter className="h-5 w-5" />
                </Button>
                <Button variant="outline" onClick={() => window.open(socialLinks.facebook, "_blank")}>
                  <Facebook className="h-5 w-5" />
                </Button>
                <Button variant="outline" onClick={() => window.open(socialLinks.linkedin, "_blank")}>
                  <Linkedin className="h-5 w-5" />
                </Button>
                <Button variant="outline" onClick={copyToClipboard}>
                  <Link2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <DialogFooter className="px-6 py-4 bg-white border-t border-[#dde3ec] flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-[#dde3ec] text-[#434655] font-semibold rounded-lg hover:bg-[#f2f4f6] h-10 transition-colors"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-lg bg-white rounded-xl p-0 overflow-hidden border border-[#dde3ec] shadow-2xl">
            <DialogHeader className="p-6 border-b border-[#dde3ec] bg-white">
              <DialogTitle className="text-[18px] font-bold text-[#1a1a2e] tracking-tight">
                Application Details
              </DialogTitle>
            </DialogHeader>
            {selectedApplication && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Name</p>
                    <p className="text-sm font-medium">
                      {selectedApplication.first_name} {selectedApplication.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Email</p>
                    <p className="text-sm">{selectedApplication.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Phone</p>
                    <p className="text-sm">{selectedApplication.phone || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Role</p>
                    <p className="text-sm">{selectedApplication.role}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Group</p>
                    <p className="text-sm">{selectedApplication.group}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <label htmlFor="password" className="text-xs font-semibold text-gray-500 uppercase">
                    Set Password (for approved candidates)
                  </label>
                  <Input id="password" type="password" placeholder="Enter a secure password" value={password} 
                         onChange={(e) => setPassword(e.target.value)} 
                         className="bg-gray-50" />
                  <p className="text-xs text-gray-400">
                    This password will be given to the candidate for login.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label htmlFor="is_wfh" className="text-xs font-semibold text-gray-500 uppercase">
                      Enable for Work From Home
                    </label>
                    <Switch 
                      id="is_wfh" 
                      checked={wfhEnabled} 
                      onCheckedChange={setWfhEnabled} 
                    />
                  </div>
                </div>


                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <Button variant="outline" onClick={() => setDetailDialogOpen(false)} className="border-[#dde3ec] text-[#434655]">
                    Cancel
                  </Button>

                  <Button variant="destructive" onClick={handleReject}
                    disabled={updating}
                    className="bg-red-600 hover:bg-red-700 text-white">
                    {updating ? "Updating..." : "Reject"}
                  </Button>

                  <Button onClick={handleAccept} disabled={updating} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {updating ? "Updating..." : "Accept"}
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