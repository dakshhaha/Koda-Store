"use client";

import { useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { locale } = useParams();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/${locale}/products?q=${encodeURIComponent(query)}`);
  };

  return (
    <form onSubmit={handleSearch} className="search-bar" style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
      <SearchIcon size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)', opacity: 0.5 }} />
      <input 
        type="text" 
        placeholder="Search curations..." 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ 
          width: '100%', 
          padding: '0.75rem 1rem 0.75rem 2.75rem', 
          borderRadius: 'var(--radius-full)', 
          background: 'var(--surface-container-high)',
          border: '1px solid transparent',
          fontSize: '0.875rem'
        }} 
      />
      {query && (
        <button 
          type="button" 
          onClick={() => setQuery("")}
          style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--on-surface-variant)' }}
        >
          <X size={14} />
        </button>
      )}
    </form>
  );
}
