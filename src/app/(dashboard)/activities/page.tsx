"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCategory) params.set("category", filterCategory);
      
      const [actRes, catRes] = await Promise.all([
        fetch(`/api/activities?${params}`),
        fetch("/api/categories")
      ]);

      if (actRes.ok && catRes.ok) {
        const actData = await actRes.json();
        const catData = await catRes.json();
        setActivities(actData);
        setCategories(catData.data || []);
        if (catData.data && catData.data.length > 0 && !newCategory) {
          setNewCategory(catData.data[0].name);
        }
      }
    } catch (err) {
      console.error("Failed to fetch activities/categories:", err);
    } finally {
      setLoading(false);
    }
  }, [filterCategory, newCategory]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const getCategoryTheme = (name: string) => {
    const found = categories.find(c => c.name === name);
    return found || { name, emoji: "🏷️", color: "#64748b", id: name };
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: newDesc, category: newCategory }),
      });
      if (res.ok) {
        setNewDesc("");
        setShowForm(false);
        fetchActivities();
      }
    } catch (err) {
      console.error("Failed to add activity:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/activities/${id}`, { method: "DELETE" });
      if (res.ok) {
        setActivities((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete activity:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Aktivitas</h1>
          <p className="text-muted-foreground mt-1">Semua kegiatan yang telah kamu catat</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="cursor-pointer font-semibold"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Tambah Manual
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <Card className="border-primary/20 shadow-md animate-in slide-in-from-top-2">
          <CardHeader>
            <CardTitle className="text-lg">Tambah Aktivitas Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="add-desc" className="text-xs">Deskripsi</Label>
                <Input
                  id="add-desc"
                  placeholder="Contoh: Lari pagi 30 menit"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  required
                  className="h-10"
                />
              </div>
              <div className="w-full sm:w-44 space-y-1.5">
                <Label htmlFor="add-cat" className="text-xs">Kategori</Label>
                <select
                  id="add-cat"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.emoji} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={submitting} className="h-10 cursor-pointer">
                  {submitting ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterCategory === "" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterCategory("")}
          className="cursor-pointer"
        >
          Semua
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={filterCategory === cat.name ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterCategory(cat.name)}
            className="cursor-pointer"
          >
            {cat.emoji} {cat.name}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : activities.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <span className="text-4xl block mb-3">📭</span>
                <p className="text-sm">Belum ada aktivitas.</p>
                <p className="text-xs mt-1">Kirim pesan ke WhatsApp Bot atau tambahkan secara manual.</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => {
                    const theme = getCategoryTheme(activity.category);
                    return (
                      <TableRow key={activity.id} className="group">
                        <TableCell className="font-medium">{activity.description}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            style={theme.color !== "#64748b" ? { backgroundColor: `${theme.color}20`, color: theme.color, borderColor: `${theme.color}40`, borderWidth: 1 } : undefined}
                          >
                            {theme.emoji} {activity.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(activity.dateLogged).toLocaleDateString("id-ID", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive cursor-pointer"
                            onClick={() => handleDelete(activity.id)}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
