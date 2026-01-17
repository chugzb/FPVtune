'use client';

import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export function SearchBar() {
  const t = useTranslations('Guides.search');
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 实现搜索功能
    console.log('Search:', query);
  };

  return (
    <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('placeholder')}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>
    </form>
  );
}
