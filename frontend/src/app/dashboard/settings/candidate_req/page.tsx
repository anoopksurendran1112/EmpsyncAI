"use client";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Clock, History, CalendarCheck, TrendingUp, Send, X, Share2, Facebook, Linkedin, Twitter, MessageCircle, Link2, Mail, } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


export default function CandidateRequestPage() {
  const { company } = useAuth();
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company?.id) return;

    const fetchRequests = async () => {
      try {
        setLoading(true);  
        const res = await fetch(`/api/candidate_request?company_id=${company.id}`); 
        const result = await res.json(); 
        if (res.ok && result.success) {
            setRequests(Array.isArray(result.data) ? result.data : []);
          } else {
            console.error("Backend error:", result.message);
          }
        } catch (err) {
          console.error("Failed to fetch:", err);
        } finally {
          setLoading(false);
        }
      };    

    fetchRequests();
  }, [company?.id]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shareableUrl, setShareableUrl] = useState("");

  useEffect(() => {
    // Construct the URL only on the client side to avoid hydration mismatches
    if (typeof window !== "undefined" && company?.id) {
      const baseUrl = window.location.origin;
      setShareableUrl(`${baseUrl}/${company.id}`);
    }
  }, [company?.id]);

  const socialLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareableUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareableUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareableUrl)}`,
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareableUrl);
    alert("Link copied to clipboard!"); // Or use a toast library
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8">
      <div className="max-w-6xl mx-auto pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Candidate Requests</h1>
            <p className="text-sm text-gray-500 mt-1">Request information from candidates</p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              onClick={() => setIsModalOpen(true)}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Requests
            </Button>
          </div>
        </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">
              Total Requests
            </h3>
            <p className="text-3xl font-bold text-blue-600">0</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <History className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Approved</h3>
            <p className="text-3xl font-bold text-green-600">0</p>
          </div>
          <div className="p-3 bg-green-100 rounded-full">
            <CalendarCheck className="h-6 w-6 text-green-600" />
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">Pending</h3>
            <p className="text-3xl font-bold text-amber-600">0</p>
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
            <p className="text-3xl font-bold text-red-600">0</p>
          </div>
          <div className="p-3 bg-red-100 rounded-full">
            <X className="h-6 w-6 text-red-600" />
          </div>
        </div>
      </div>

      {/* Table Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Recent Requests</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading requests...</div>
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
                      {/* Combine first and last name */}
                      <TableCell className="font-medium">
                        {req.first_name} {req.last_name}
                      </TableCell>
                      <TableCell>{req.role}</TableCell>
                      <TableCell>{req.group}</TableCell>
                      <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                          ${req.status === 'approved' ? 'bg-green-100 text-green-700' : 
                            req.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                        {req.status === 'pending' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-xs hover:bg-amber-50 text-amber-800"
                            onClick={() => {
                              // Add your navigation or modal open logic here
                              console.log("Viewing application:", req.id);
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
                    <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                      No requests found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>


        {/* SHARE LINK DIALOG */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md bg-white rounded-xl p-0 overflow-hidden border border-[#dde3ec] shadow-2xl">
            
            {/* Modal Header */}
            <DialogHeader className="p-6 border-b border-[#dde3ec] bg-white relative">
              <DialogTitle className="text-[18px] font-bold text-[#1a1a2e] tracking-tight">
                Share Profile
              </DialogTitle>
            </DialogHeader>

            <div className="p-6 space-y-6">
              {/* Standardized Input Group */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">Profile Link</label>
                <div className="flex gap-2">
                  {/* Consistent input styling */}
                  <Input readOnly value={shareableUrl} className="bg-gray-50" />
                  <Button onClick={copyToClipboard}>Copy</Button>
                </div>
              </div>
              
              {/* Social Grid with uniform spacing */}
              <div className="grid grid-cols-4 gap-4">
                {/* Implementation will use your design's specific color/shadow tokens */}
              </div>
            </div>

            {/* Close Footer */}
            <DialogFooter className="px-6 py-4 bg-white border-t border-[#dde3ec] flex items-center justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsModalOpen(false)} 
                className="px-4 py-2 border border-[#dde3ec] text-[#434655] font-semibold rounded-lg hover:bg-[#f2f4f6] h-10 transition-colors" >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}