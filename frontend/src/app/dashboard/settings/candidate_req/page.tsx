"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [autoGenerateStaffId, setAutoGenerateStaffId] = useState(false);
  const [staffId, setStaffId] = useState("");
  const [actionType, setActionType] = useState("");

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

    if (!autoGenerateStaffId && !staffId.trim()) {
      alert("Please enter a Staff ID.");
      return;
    }

    const appId = selectedApplication.id;
    setActionType("accept");
    setUpdating(true);

    try {
      const payload = {
        application_id: appId,
        status: "approved",
        wfh: wfhEnabled,
        password: password.trim(),
        ...(autoGenerateStaffId ? {} : { staff_id: staffId.trim() }),
      };

      console.log("Payload before fetch:", payload);

      const res = await fetch("/api/candidate_request", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });


      const result = await res.json();

      if (result.success) {
        await fetchRequests();

        alert(result.message);

        setDetailDialogOpen(false);
        setSelectedApplication(null);
        setPassword("");
        setStaffId("");
        setAutoGenerateStaffId(false);
        setWfhEnabled(false);
      } else {
        alert(result.message || "Failed to approve application.");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    } finally {
      setUpdating(false);
      setActionType("");
    }
  };

  // ----- Reject handler (similar) -----
  const handleReject = async () => {
    if (!selectedApplication) return;
    if (!confirm("Reject this application?")) return;

    const appId = selectedApplication.id;
    setActionType("reject");
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

      const result = await res.json();
      if (result.success) {
        await fetchRequests();
        alert(result.message);
        setDetailDialogOpen(false);
        setSelectedApplication(null);
      } else {
        alert(result.message || "Failed to reject application.");
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
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${req.status === "approved"
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
                              console.log(JSON.stringify(req, null, 2));
                              console.log("req.is_wfh =", req.is_wfh);
                              setSelectedApplication(req);
                              setPassword("");
                              console.log("req.is_wfh =", req.is_wfh);
                              setWfhEnabled(false);
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

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-sm bg-white rounded-2xl p-0 overflow-hidden border border-slate-200 shadow-2xl">
            {/* Header */}
            <DialogHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
              <DialogTitle className="text-base font-semibold text-slate-900 tracking-tight">
                Share Requets for new Candidates
              </DialogTitle>
            </DialogHeader>

            {/* Body */}
            <div className="p-5 space-y-5">
              {/* Link Input Section */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Application Link
                </label>
                <div className="flex gap-2">
                  <Input 
                    readOnly 
                    value={shareableUrl} 
                    className="bg-slate-50 border-slate-200 text-sm focus-visible:ring-indigo-500 text-slate-600 font-medium truncate" 
                  />
                  <Button 
                    onClick={copyToClipboard}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm px-4 text-sm font-medium transition-colors"
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className="border-t border-slate-100 my-1" />

              {/* Social Network Section */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Share to Social Media
                </p>
                <div className="grid grid-cols-4 gap-2.5">
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(socialLinks.twitter, "_blank")}
                    className="border-slate-200 hover:bg-slate-50 hover:text-sky-500 text-slate-500 h-11 p-0 transition-colors"
                    title="Share on Twitter"
                  >
                    <Twitter className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(socialLinks.facebook, "_blank")}
                    className="border-slate-200 hover:bg-slate-50 hover:text-blue-600 text-slate-500 h-11 p-0 transition-colors"
                    title="Share on Facebook"
                  >
                    <Facebook className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open(socialLinks.linkedin, "_blank")}
                    className="border-slate-200 hover:bg-slate-50 hover:text-blue-700 text-slate-500 h-11 p-0 transition-colors"
                    title="Share on LinkedIn"
                  >
                    <Linkedin className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={copyToClipboard}
                    className="border-slate-200 hover:bg-slate-50 hover:text-slate-800 text-slate-500 h-11 p-0 transition-colors"
                    title="Copy Alternate Link"
                  >
                    <Link2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <DialogFooter className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <Button
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-700 bg-slate-200 border border-slate-300 hover:bg-slate-300 text-sm font-medium h-9 px-4 rounded-lg transition-colors"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        {/* Detail Dialog */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="max-w-md bg-white rounded-xl p-0 overflow-hidden border border-slate-200 shadow-2xl">
            {/* Header */}
            <DialogHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
              <DialogTitle className="text-base font-semibold text-slate-900 tracking-tight">
                Application Details
              </DialogTitle>
            </DialogHeader>

            {selectedApplication && (
              <div>
                {/* Scrollable Content Body */}
                <div className="p-5 max-h-[70vh] overflow-y-auto space-y-5">
                  
                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Name</p>
                      <p className="text-sm font-medium text-slate-800 mt-0.5">
                        {selectedApplication.first_name} {selectedApplication.last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
                      <p className="text-sm font-medium text-slate-800 mt-0.5 truncate">{selectedApplication.email || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phone</p>
                      <p className="text-sm text-slate-600 mt-0.5">{selectedApplication.phone || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Role</p>
                      <p className="text-sm text-slate-600 mt-0.5">{selectedApplication.role}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Group</p>
                      <p className="text-sm text-slate-600 mt-0.5">{selectedApplication.group}</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 my-2" />

                  {/* Staff ID Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="staffId" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Staff ID
                      </label>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="autoStaffId"
                          checked={autoGenerateStaffId}
                          onCheckedChange={(checked) => setAutoGenerateStaffId(checked === true)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="autoStaffId" className="text-xs text-slate-500 font-medium cursor-pointer selection:bg-transparent">
                          Auto-generate
                        </label>
                      </div>
                    </div>

                    <Input
                      id="staffId"
                      type="text"
                      placeholder={
                        autoGenerateStaffId
                          ? "Generated automatically upon acceptance"
                          : "e.g. STF-2026-01"
                      }
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                      disabled={autoGenerateStaffId}
                      className="bg-slate-50 border-slate-200 focus-visible:ring-indigo-500 disabled:opacity-60 text-sm"
                    />
                  </div>

                  {/* Password Section */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Set Password
                    </label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-50 border-slate-200 focus-visible:ring-indigo-500 text-sm" 
                    />
                    <p className="text-[11px] text-slate-400">
                      Required for approved candidates to log in.
                    </p>
                  </div>

                  {/* Toggle Options */}
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label htmlFor="is_wfh" className="text-xs font-semibold text-slate-700 cursor-pointer">
                        Work From Home
                      </label>
                      <p className="text-[11px] text-slate-400">Enable remote work permissions</p>
                    </div>
                    <Switch
                      id="is_wfh"
                      checked={wfhEnabled}
                      onCheckedChange={setWfhEnabled}
                      className="data-[state=checked]:bg-indigo-600"
                    />
                  </div>
                </div>

                {/* Action Footer */}
                <div className="flex items-center justify-end gap-2 p-4 bg-slate-50 border-t border-slate-100">
                  <Button 
                    variant="ghost" 
                    onClick={() => setDetailDialogOpen(false)} 
                    className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-sm font-medium"
                  >
                    Cancel
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={updating}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 shadow-none text-sm font-medium transition-colors"
                  >
                    {updating && actionType === "reject" ? "Rejecting..." : "Reject"}
                  </Button>

                  <Button
                    onClick={handleAccept}
                    disabled={updating}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm text-sm font-medium transition-colors"
                  >
                    {updating && actionType === "accept" ? "Accepting..." : "Accept"}
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