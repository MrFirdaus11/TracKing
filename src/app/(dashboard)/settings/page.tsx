"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export default function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🏷️");
  const [newColor, setNewColor] = useState("#8b5cf6");

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const json = await res.json();
        setCategories(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    setSubmitting(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), emoji: newEmoji, color: newColor }),
      });
      if (res.ok) {
        setNewName("");
        setNewEmoji("🏷️");
        setNewColor("#8b5cf6");
        fetchCategories();
      }
    } catch (err) {
      console.error("Failed to add category", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Hapus kategori "${name}"? Semua aktivitas dengan kategori ini juga akan terhapus.`)) return;
    
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchCategories();
      }
    } catch (err) {
      console.error("Failed to delete category", err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground mt-1">Kelola preferensi dan kategori aktivitasmu</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Category List */}
        <Card className="border-border/50 shadow-sm order-2 md:order-1">
          <CardHeader>
            <CardTitle className="text-lg">Kategori Kustom</CardTitle>
            <CardDescription>
              Daftar kategori yang bisa kamu pilih saat mencatat aktivitas. 
              Disarankan maksimal 8 kategori agar grafik tetap rapi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-24 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : categories.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">Belum ada kategori.</p>
            ) : (
               <div className="space-y-3">
                 {categories.map((cat) => (
                   <div key={cat.id} className="flex flex-wrap items-center justify-between p-3 rounded-xl border border-border/50 bg-card/50">
                     <div className="flex items-center gap-3">
                       <div 
                         className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                         style={{ backgroundColor: `${cat.color}20` }}
                       >
                         {cat.emoji}
                       </div>
                       <div>
                         <p className="font-medium">{cat.name}</p>
                         <p className="text-xs text-muted-foreground uppercase">{cat.color}</p>
                       </div>
                     </div>
                     <Button 
                       variant="ghost" 
                       size="sm" 
                       onClick={() => handleDeleteCategory(cat.id, cat.name)}
                       className="text-destructive hover:text-destructive hover:bg-destructive/10"
                     >
                       Hapus
                     </Button>
                   </div>
                 ))}
               </div>
            )}
          </CardContent>
        </Card>

        {/* Add Category Form */}
        <Card className="border-border/50 shadow-sm order-1 md:order-2 h-fit sticky top-6">
          <CardHeader>
            <CardTitle className="text-lg">Tambah Kategori</CardTitle>
            <CardDescription>Buat kategori aktivitas baru</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1 space-y-1.5">
                  <Label htmlFor="emoji" className="text-xs">Emoji</Label>
                  <Input 
                    id="emoji" 
                    value={newEmoji} 
                    onChange={(e) => setNewEmoji(e.target.value)} 
                    maxLength={2}
                    className="text-center text-xl"
                  />
                </div>
                <div className="col-span-3 space-y-1.5">
                  <Label htmlFor="name" className="text-xs">Nama Kategori</Label>
                  <Input 
                    id="name" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                    placeholder="Misal: Gaming, Coding"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="color" className="text-xs">Warna Chart (HEX/HSL)</Label>
                <div className="flex gap-2">
                  <Input 
                    type="color" 
                    id="color-picker" 
                    value={newColor.startsWith('#') ? newColor : '#8b5cf6'} 
                    onChange={(e) => setNewColor(e.target.value)} 
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input 
                    id="color" 
                    value={newColor} 
                    onChange={(e) => setNewColor(e.target.value)} 
                    placeholder="#8b5cf6 atau hsl(262, 83%, 58%)"
                    required
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-xl border border-border/50 bg-card/30 flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Preview:</span>
                <Badge variant="secondary" style={{ backgroundColor: `${newColor}20`, color: newColor, borderColor: `${newColor}40`, borderWidth: 1 }}>
                  {newEmoji} {newName || "Nama Kategori"}
                </Badge>
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Menambahkan..." : "Tambah Kategori"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
