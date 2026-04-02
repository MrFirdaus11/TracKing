"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

interface QuickInputProps {
  onActivityAdded?: () => void;
}

export default function QuickInput({ onActivityAdded }: QuickInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((json) => {
        if (json.data && json.data.length > 0) {
          setCategories(json.data);
          setCategory(json.data[0].name);
        }
      })
      .catch((err) => console.error("Failed to fetch categories:", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, category }),
      });

      if (res.ok) {
        setDescription("");
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setIsOpen(false);
        }, 1200);
        onActivityAdded?.();
      }
    } catch (err) {
      console.error("Failed to add:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Bottom Sheet */}
      {isOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-300">
          <div className="bg-card border-t border-border/50 rounded-t-3xl p-6 pb-8 shadow-2xl max-w-lg mx-auto">
            {success ? (
              <div className="text-center py-6">
                <span className="text-5xl block mb-3 animate-in zoom-in">✅</span>
                <p className="font-semibold text-lg">Aktivitas Tercatat!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Handle */}
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mb-5" />

                <h3 className="font-semibold text-lg mb-4">Catat Aktivitas</h3>

                {/* Description */}
                <Input
                  placeholder="Apa yang sudah kamu lakukan?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  autoFocus
                  className="h-12 text-base mb-4 rounded-xl"
                />

                {/* Category selector */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.name)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                        category === cat.name
                          ? "bg-primary text-primary-foreground shadow-md scale-105"
                          : "bg-secondary text-secondary-foreground hover:bg-accent"
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={submitting || !description.trim()}
                  className="w-full h-12 text-base font-semibold rounded-xl cursor-pointer"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Menyimpan...
                    </span>
                  ) : (
                    "Simpan Aktivitas"
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* FAB Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-chart-2 text-white shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer lg:bottom-8 lg:right-8"
          aria-label="Tambah aktivitas"
        >
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      )}
    </>
  );
}
