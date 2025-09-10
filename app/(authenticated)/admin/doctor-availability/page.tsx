"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface Doctor { id: string; name: string; department: string; specialization: string; }
interface AvailabilityRule { id: string; doctorId: string; type: "UNAVAILABLE" | "LEAVE" | "HOLIDAY" | "CUSTOM"; startDate: string; endDate?: string; startTime?: string; endTime?: string; weekdays?: string | number[]; reason?: string; isRecurring: boolean; doctor: Doctor; }

export default function DoctorAvailabilityPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"routine" | "leaves">("routine");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availabilityRules, setAvailabilityRules] = useState<AvailabilityRule[]>([]);
  const [loading, setLoading] = useState(false);

  const weekDays = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  const [routine, setRoutine] = useState<Record<string, { isWorking: boolean; sessions: string[] }>>({});
  const [templates, setTemplates] = useState<{ shortCode: string; name: string }[]>([]);

  const isDoctor = session?.user?.role === "DOCTOR";
  const currentDoctorId = isDoctor ? session.user.id : "";

  const [formData, setFormData] = useState({ doctorId: currentDoctorId, type: "UNAVAILABLE" as const, startDate: "", endDate: "", startTime: "", endTime: "", weekdays: [] as number[], reason: "", isRecurring: false });

  useEffect(() => {
    if (!isDoctor) fetchDoctors();
    loadAvailabilityRules();
    loadTemplates();
    loadRoutine(isDoctor ? currentDoctorId : "");
    if (isDoctor && currentDoctorId) setFormData((p) => ({ ...p, doctorId: currentDoctorId }));
  }, [isDoctor, currentDoctorId]);

  const fetchDoctors = async () => {
    try { const r = await fetch("/api/doctors"); if (r.ok) { const data = await r.json(); const list = Array.isArray(data) ? data : data.doctors || []; setDoctors(list); } } catch { toast.error("Failed to load doctors"); }
  };

  const loadAvailabilityRules = async () => {
    try { const url = isDoctor ? `/api/doctors/availability?doctorId=${currentDoctorId}` : "/api/doctors/availability"; const r = await fetch(url); if (r.ok) { const data = await r.json(); setAvailabilityRules(data.availabilityRules || []); } } catch { toast.error("Failed to load availability rules"); }
  };

  const loadTemplates = async () => {
    try { const r = await fetch('/api/sessions/templates'); if (r.ok) { const data = await r.json(); const active = (data.templates || []).map((t: any) => ({ shortCode: t.shortCode, name: t.name })); setTemplates(active); } } catch {}
  };

  const loadRoutine = async (doctorId?: string) => {
    try { const url = doctorId ? `/api/doctors/routine?doctorId=${doctorId}` : '/api/doctors/routine'; const r = await fetch(url); if (r.ok) { const data = await r.json(); setRoutine(data.routine || {}); } } catch {}
  };

  const handleSubmitAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    const doctorIdToUse = isDoctor ? session?.user?.id : formData.doctorId;
    if (!doctorIdToUse || !formData.startDate) { toast.error("Please fill in required fields"); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/doctors/availability", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...formData, doctorId: doctorIdToUse, weekdays: formData.isRecurring ? formData.weekdays : [], }) });
      if (r.ok) { toast.success("Availability rule created successfully"); setFormData({ doctorId: "", type: "UNAVAILABLE", startDate: "", endDate: "", startTime: "", endTime: "", weekdays: [], reason: "", isRecurring: false }); loadAvailabilityRules(); }
      else { const err = await r.json(); toast.error(typeof err.error === 'string' ? err.error : 'Failed to create availability rule'); }
    } catch { toast.error("Something went wrong"); } finally { setLoading(false); }
  };

  const handleDeleteRule = async (id: string) => {
    try { const r = await fetch(`/api/doctors/availability?id=${id}`, { method: 'DELETE' }); if (r.ok) { toast.success('Availability rule deleted'); loadAvailabilityRules(); } else { toast.error('Failed to delete rule'); } } catch { toast.error('Something went wrong'); }
  };

  const saveRoutine = async () => {
    try { const doctorIdToUse = isDoctor ? session?.user?.id : formData.doctorId; if (!doctorIdToUse) { toast.error('Please select a doctor'); return; } const r = await fetch('/api/doctors/routine', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ doctorId: doctorIdToUse, routine }) }); if (r.ok) toast.success('Routine saved'); else { const err = await r.json().catch(() => ({})); toast.error(err?.error || 'Failed to save routine'); } } catch { toast.error('Failed to save routine'); }
  };

  const toggleWeekday = (day: number) => setFormData((p) => ({ ...p, weekdays: p.weekdays.includes(day) ? p.weekdays.filter((d) => d !== day) : [...p.weekdays, day] }));

  const weekdayNames = ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"];
  const formatIndianDate = (s: string) => { if (!s) return ""; const d = new Date(s); return d.toLocaleDateString('en-IN'); };
  const formatIndianTime = (t: string) => { if (!t) return ""; const [h,m]=t.split(':'); const d=new Date(); d.setHours(parseInt(h),parseInt(m)); return d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true}); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Doctor Availability</h1>
        <p className="text-gray-600">Set your weekly routine and leaves</p>
      </div>

      <div className="flex space-x-4 border-b">
        <button onClick={() => setActiveTab("routine")} className={`pb-2 px-1 ${activeTab==='routine'?'border-b-2 border-blue-500 text-blue-600':'text-gray-500'}`}>Weekly Routine</button>
        <button onClick={() => setActiveTab("leaves")} className={`pb-2 px-1 ${activeTab==='leaves'?'border-b-2 border-blue-500 text-blue-600':'text-gray-500'}`}>Leaves</button>
      </div>

      {activeTab==='routine' && (
        <Card>
          <CardHeader>
            <CardTitle>Weekly Routine (Workdays & Sessions)</CardTitle>
            <CardDescription>Choose working days and sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {!isDoctor && (
              <div className="space-y-2 mb-4">
                <Label>Doctor</Label>
                <select value={formData.doctorId} onChange={(e)=>setFormData((p)=>({...p,doctorId:e.target.value}))} className="w-full p-2 border rounded">
                  <option value="">Select Doctor</option>
                  {doctors.map(d=> <option key={d.id} value={d.id}>{d.name} - {d.department}</option>)}
                </select>
              </div>
            )}

            <div className="space-y-3">
              {weekDays.map(day => (
                <div key={day} className="border rounded p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium capitalize">{day}</div>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" checked={routine[day]?.isWorking||false} onChange={(e)=>setRoutine((prev)=>({...prev,[day]:{isWorking:e.target.checked,sessions:prev[day]?.sessions||[]}}))} />
                      <span className="text-sm">Works this day</span>
                    </label>
                  </div>
                  {(routine[day]?.isWorking||false) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {templates.map(t=>{
                        const selected = routine[day]?.sessions?.includes(t.shortCode);
                        return (
                          <label key={t.shortCode} className={`px-3 py-1 rounded border cursor-pointer ${selected?'bg-blue-500 text-white border-blue-500':'bg-white text-gray-700 border-gray-300'}`}>
                            <input type="checkbox" className="hidden" checked={selected} onChange={(e)=>setRoutine((prev)=>{ const curr=prev[day]?.sessions||[]; const next=e.target.checked?Array.from(new Set([...curr,t.shortCode])):curr.filter(s=>s!==t.shortCode); return {...prev,[day]:{isWorking:true,sessions:next}}; })} />
                            {t.name} ({t.shortCode})
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4"><Button type="button" onClick={saveRoutine}>Save Routine</Button></div>
          </CardContent>
        </Card>
      )}

      {activeTab==='leaves' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Create Leave / Unavailability</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitAvailability} className="space-y-4">
                {!isDoctor && (
                  <div className="space-y-2">
                    <Label htmlFor="doctor">Doctor</Label>
                    <select id="doctor" value={formData.doctorId} onChange={(e)=>setFormData((p)=>({...p,doctorId:e.target.value}))} className="w-full p-2 border rounded" required>
                      <option value="">Select Doctor</option>
                      {doctors.map(d=> <option key={d.id} value={d.id}>{d.name} - {d.department}</option>)}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="startDate">Start Date</Label><input id="startDate" type="date" value={formData.startDate} onChange={(e)=>setFormData((p)=>({...p,startDate:e.target.value}))} className="w-full p-2 border rounded" required /></div>
                  <div className="space-y-2"><Label htmlFor="endDate">End Date (Optional)</Label><input id="endDate" type="date" value={formData.endDate} onChange={(e)=>setFormData((p)=>({...p,endDate:e.target.value}))} className="w-full p-2 border rounded" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="startTime">Start Time (Optional)</Label><input id="startTime" type="time" value={formData.startTime} onChange={(e)=>setFormData((p)=>({...p,startTime:e.target.value}))} className="w-full p-2 border rounded" /></div>
                  <div className="space-y-2"><Label htmlFor="endTime">End Time (Optional)</Label><input id="endTime" type="time" value={formData.endTime} onChange={(e)=>setFormData((p)=>({...p,endTime:e.target.value}))} className="w-full p-2 border rounded" /></div>
                </div>
                <div className="space-y-2">
                  <Label><input type="checkbox" checked={formData.isRecurring} onChange={(e)=>setFormData((p)=>({...p,isRecurring:e.target.checked}))} className="mr-2" />Recurring (Weekly)</Label>
                  {formData.isRecurring && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {weekdayNames.map((d,idx)=>(<button key={idx} type="button" onClick={()=>toggleWeekday(idx)} className={`px-3 py-1 text-sm rounded-md border ${formData.weekdays.includes(idx)?'bg-blue-500 text-white border-blue-500':'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>{d}</button>))}
                    </div>
                  )}
                </div>
                <div className="space-y-2"><Label htmlFor="reason">Reason (Optional)</Label><Textarea id="reason" value={formData.reason} onChange={(e)=>setFormData((p)=>({...p,reason:e.target.value}))} placeholder="Enter reason for unavailability..." rows={2} /></div>
                <Button type="submit" disabled={loading} className="w-full">{loading? 'Creating...' : 'Create Rule'}</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Existing Availability Rules</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {availabilityRules.length===0 ? (
                  <p className="text-gray-500 text-center py-4">No availability rules found</p>
                ) : (
                  availabilityRules.map(rule => (
                    <div key={rule.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">Dr. {rule.doctor?.name || 'Unknown Doctor'}</h4>
                        <Button variant="destructive" size="sm" onClick={()=>handleDeleteRule(rule.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Type:</strong> {rule.type}</p>
                        <p><strong>Period:</strong> {formatIndianDate(rule.startDate)} {rule.endDate && `to ${formatIndianDate(rule.endDate)}`}</p>
                        {rule.startTime && (<p><strong>Time:</strong> {formatIndianTime(rule.startTime)} - {formatIndianTime(rule.endTime || "")}</p>)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
