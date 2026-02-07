"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { getToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

type University = {
  id: number;
  name: string;
  country?: string;
  state?: string;
};

type MyUniversity = {
  id: number;
  university?: University;
  category: string;
  status: string;
  progress_percent?: number;
};

type Application = {
  id: number;
  university?: University;
  university_name?: string;
  deadline_date: string | null;
  status: string;
};

export default function ApplicationsPage() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [myUniversities, setMyUniversities] = useState<MyUniversity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [status, setStatus] = useState("");

  const [selectedUniId, setSelectedUniId] = useState("");
  const [myCategory, setMyCategory] = useState("target");
  const [myStatus, setMyStatus] = useState("planning");
  const [myNotes, setMyNotes] = useState("");

  const [applicationUniId, setApplicationUniId] = useState("");
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [applicationStatus, setApplicationStatus] = useState("planned");

  async function loadAll() {
    const token = getToken();
    if (!token) return;
    setStatus("Загружаем данные...");
    try {
      const [uni, myUni, apps] = await Promise.all([
        apiFetch<University[]>("/api/universities/", { method: "GET" }, token),
        apiFetch<MyUniversity[]>("/api/my-universities/", { method: "GET" }, token),
        apiFetch<Application[]>("/api/applications/", { method: "GET" }, token),
      ]);
      setUniversities(uni);
      setMyUniversities(myUni);
      setApplications(apps);
      setStatus("Готово.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Ошибка загрузки");
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  async function addMyUniversity() {
    const token = getToken();
    if (!token) return;
    if (!selectedUniId) {
      setStatus("Выберите университет.");
      return;
    }

    setStatus("Добавляем университет...");
    try {
      await apiFetch("/api/my-universities/", {
        method: "POST",
        body: JSON.stringify({
          university_id: Number(selectedUniId),
          category: myCategory,
          status: myStatus,
          notes: myNotes,
        }),
      }, token);
      setSelectedUniId("");
      setMyNotes("");
      await loadAll();
      setStatus("Университет добавлен в список.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Ошибка добавления");
    }
  }

  async function createApplication() {
    const token = getToken();
    if (!token) return;
    if (!applicationUniId) {
      setStatus("Выберите университет из My Universities.");
      return;
    }

    setStatus("Создаём заявку...");
    try {
      await apiFetch("/api/applications/", {
        method: "POST",
        body: JSON.stringify({
          university_id: Number(applicationUniId),
          deadline_date: applicationDeadline || null,
          status: applicationStatus,
        }),
      }, token);
      setApplicationUniId("");
      setApplicationDeadline("");
      setApplicationStatus("planned");
      await loadAll();
      setStatus("Заявка создана.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Ошибка создания заявки");
    }
  }

  return (
    <ProtectedPage>
      <AppShell title="Universities" subtitle="Manage universities and applications end-to-end.">
        <div className="grid gap-5">
          <section className="glass rounded-2xl p-5">
            <h2 className="text-lg font-semibold">My Universities</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="text-sm text-white/70">
                University
                <select value={selectedUniId} onChange={(e) => setSelectedUniId(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <option value="" className="bg-[#0b1020]">-- select --</option>
                  {universities.map((u) => (
                    <option key={u.id} value={u.id} className="bg-[#0b1020]">{u.name}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-white/70">
                Category
                <select value={myCategory} onChange={(e) => setMyCategory(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  {["reach", "target", "safety"].map((value) => <option key={value} className="bg-[#0b1020]" value={value}>{value}</option>)}
                </select>
              </label>
              <label className="text-sm text-white/70">
                Status
                <select value={myStatus} onChange={(e) => setMyStatus(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  {["planning", "preparing", "applying", "submitted", "admitted", "rejected"].map((value) => <option key={value} className="bg-[#0b1020]" value={value}>{value}</option>)}
                </select>
              </label>
              <label className="text-sm text-white/70 md:col-span-2">
                Notes
                <input value={myNotes} onChange={(e) => setMyNotes(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
              </label>
            </div>
            <button onClick={addMyUniversity} className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500">Add to My Universities</button>

            <div className="mt-4 overflow-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-white/70">
                  <tr>
                    <th className="px-3 py-2">University</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {myUniversities.map((item) => (
                    <tr key={item.id} className="border-t border-white/10">
                      <td className="px-3 py-2">{item.university?.name || "-"}</td>
                      <td className="px-3 py-2">{item.category}</td>
                      <td className="px-3 py-2">{item.status}</td>
                      <td className="px-3 py-2">{item.progress_percent ?? 0}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="glass rounded-2xl p-5">
            <h2 className="text-lg font-semibold">Applications</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <label className="text-sm text-white/70">
                University (from My Universities)
                <select value={applicationUniId} onChange={(e) => setApplicationUniId(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <option value="" className="bg-[#0b1020]">-- select --</option>
                  {myUniversities.map((item) => (
                    <option key={item.id} className="bg-[#0b1020]" value={item.university?.id || ""}>
                      {item.university?.name || "-"}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-white/70">
                Deadline
                <input type="date" value={applicationDeadline} onChange={(e) => setApplicationDeadline(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2" />
              </label>
              <label className="text-sm text-white/70">
                Status
                <select value={applicationStatus} onChange={(e) => setApplicationStatus(e.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  {["planned", "in_progress", "submitted"].map((value) => <option key={value} className="bg-[#0b1020]" value={value}>{value}</option>)}
                </select>
              </label>
            </div>
            <button onClick={createApplication} className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500">Create application</button>

            <div className="mt-4 overflow-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-white/70">
                  <tr>
                    <th className="px-3 py-2">University</th>
                    <th className="px-3 py-2">Deadline</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} className="border-t border-white/10">
                      <td className="px-3 py-2">{app.university?.name || app.university_name || "-"}</td>
                      <td className="px-3 py-2">{app.deadline_date || "-"}</td>
                      <td className="px-3 py-2">{app.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <p className="text-sm text-white/70">{status}</p>
        </div>
      </AppShell>
    </ProtectedPage>
  );
}
