"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Clock,
  History,
  CalendarCheck,
  Send,
  X,
  Linkedin,
  Twitter,
  MessageCircle,
  Phone,
  Mail,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
function getInitials(first?: string, last?: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
}

const avatarPalette = [
  "bg-indigo-100 text-indigo-600",
  "bg-amber-100 text-amber-600",
  "bg-rose-100 text-rose-600",
  "bg-emerald-100 text-emerald-600",
  "bg-sky-100 text-sky-600",
];

function getAvatarColor(seed?: string) {
  const index = (seed?.charCodeAt(0) ?? 0) % avatarPalette.length;
  return avatarPalette[index];
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    approved: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    rejected: "bg-rose-100 text-rose-700",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${
        styles[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function CandidateRequestPage() {
  const { company } = useAuth();

  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shareableUrl, setShareableUrl] = useState("");

  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] =
    useState<Request | null>(null);
  const [password, setPassword] = useState("");
  const [wfhEnabled, setWfhEnabled] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchRequests = async () => {
    if (!company?.id) return;
    try {
      setLoading(true);
      const res = await fetch(
        `/api/candidate_request?company_id=${company.id}`,
      );
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

  const emailShareLink = () => {
    const subject = encodeURIComponent("Candidate request link");
    const body = encodeURIComponent(
      `Please use this candidate request link: ${shareableUrl}`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const whatsappShareLink = () => {
    const message = encodeURIComponent(
      `Please use this candidate request link: ${shareableUrl}`,
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
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
  const filteredRequests = requests.filter((req) => {
    const fullName = `${req.first_name} ${req.last_name}`.toLowerCase();
    return fullName.includes(searchQuery.trim().toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8">
      <div className="max-w-6xl mx-auto pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Candidate Requests
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Request information from candidates
            </p>
          </div>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
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
              <h3 className="text-sm font-semibold text-gray-500 mb-1">
                Total
              </h3>
              <p className="text-3xl font-bold text-blue-600">{total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <History className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">
                Approved
              </h3>
              <p className="text-3xl font-bold text-green-600">{approved}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CalendarCheck className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">
                Pending
              </h3>
              <p className="text-3xl font-bold text-amber-600">{pending}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-full">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-1">
                Rejected
              </h3>
              <p className="text-3xl font-bold text-red-600">{rejected}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <X className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        {/* Table */}
        {/* Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Requests
            </h2>
            <div className="flex items-center gap-2 w-full max-w-sm">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search candidates by name"
                  className="h-10 pl-9 bg-gray-50 border-gray-200 focus-visible:ring-1 focus-visible:ring-indigo-500"
                />
              </div>
            </div>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-gray-100">
                  <TableHead className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Candidate
                  </TableHead>
                  <TableHead className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Role
                  </TableHead>
                  <TableHead className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Department
                  </TableHead>
                  <TableHead className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Requested On
                  </TableHead>
                  <TableHead className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((req) => (
                    <TableRow
                      key={req.id}
                      className="border-gray-100 hover:bg-gray-50/60 transition-colors"
                    >
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarColor(
                              req.first_name,
                            )}`}
                          >
                            {getInitials(req.first_name, req.last_name)}
                          </div>
                          <span className="font-medium text-gray-900">
                            {req.first_name} {req.last_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-slate-600 font-medium">
                        {req.role}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-slate-600 font-medium">
                        {req.group}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-gray-500">
                        {new Date(req.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <StatusBadge status={req.status} />
                        {req.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs hover:bg-amber-50 text-amber-800 ml-2"
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
                    <TableCell
                      colSpan={5}
                      className="text-center text-gray-500 py-8"
                    >
                      No requests found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
          {!loading && filteredRequests.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-sm text-gray-400">
                Showing {filteredRequests.length} of {requests.length} results
              </span>
              <div className="flex items-center gap-2">
                <button
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  disabled
                >
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
                <button className="w-8 h-8 flex items-center justify-center bg-indigo-600 text-white rounded-lg text-sm font-medium">
                  1
                </button>
                <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Share Dialog */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md bg-white rounded-xl p-0 overflow-hidden border border-[#dde3ec] shadow-2xl">
            <DialogHeader className="p-6 border-b border-[#dde3ec] bg-white relative">
              <DialogTitle className="text-[18px] font-bold text-indigo-700 tracking-tight">
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
                  <Button
                    onClick={copyToClipboard}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Copy
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  onClick={() => window.open(socialLinks.twitter, "_blank")}
                  className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <Twitter className="h-5 w-5" />
                </Button>

                <Button
                  variant="outline"
                  onClick={() => window.open(socialLinks.linkedin, "_blank")}
                  className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <Linkedin className="h-5 w-5" />
                </Button>
                <Button
  variant="outline"
  onClick={whatsappShareLink}
  className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
>
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className="h-6 w-6"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12.05 2C6.5 2 2 6.5 2 12.05c0 1.906.531 3.759 1.535 5.36L2 22l4.732-1.502a10.05 10.05 0 0 0 5.317 1.503h.001c5.549 0 10.049-4.5 10.049-10.05C22.099 6.5 17.599 2 12.05 2zm0 18.28h-.001a8.212 8.212 0 0 1-4.19-1.147l-.3-.178-3.12.998 1.017-3.043-.196-.311a8.198 8.198 0 0 1-1.263-4.4c0-4.542 3.696-8.238 8.257-8.238a8.19 8.19 0 0 1 5.83 2.414 8.19 8.19 0 0 1 2.412 5.83c0 4.542-3.696 8.075-8.446 8.075z" />
  </svg>
</Button>
                <Button
                  variant="outline"
                  onClick={emailShareLink}
                  className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <Mail className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <DialogFooter className="px-6 py-4 bg-white border-t border-[#dde3ec] flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-indigo-200 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 h-10 transition-colors"
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
                    <p className="text-xs font-semibold text-gray-500 uppercase">
                      Name
                    </p>
                    <p className="text-sm font-medium">
                      {selectedApplication.first_name}{" "}
                      {selectedApplication.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">
                      Email
                    </p>
                    <p className="text-sm">
                      {selectedApplication.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">
                      Phone
                    </p>
                    <p className="text-sm">
                      {selectedApplication.phone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">
                      Role
                    </p>
                    <p className="text-sm">{selectedApplication.role}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">
                      Group
                    </p>
                    <p className="text-sm">{selectedApplication.group}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <label
                    htmlFor="password"
                    className="text-xs font-semibold text-gray-500 uppercase"
                  >
                    Set Password (for approved candidates)
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter a secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-400">
                    This password will be given to the candidate for login.
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="is_wfh"
                      className="text-xs font-semibold text-gray-500 uppercase"
                    >
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
                  <Button
                    variant="outline"
                    onClick={() => setDetailDialogOpen(false)}
                    className="border-[#dde3ec] text-[#434655]"
                  >
                    Cancel
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={updating}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {updating ? "Updating..." : "Reject"}
                  </Button>

                  <Button
                    onClick={handleAccept}
                    disabled={updating}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
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
