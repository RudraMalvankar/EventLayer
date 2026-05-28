import { useState } from "react";

export function SearchBar({ onSearch, loading }) {
  const [value, setValue] = useState("");
  
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onSearch?.(value);
    }
  };

  return (
    <div className="group flex w-full items-center gap-3 glass p-2 rounded-[24px] transition-all duration-500 hover:border-white/20 hover:shadow-[0_0_40px_rgba(255,77,0,0.1)]">
      <div className="pl-4 text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
        </svg>
      </div>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder='Search events, platforms or cities...'
        className="w-full bg-transparent border-none px-2 py-4 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-0"
      />
      <button
        onClick={() => onSearch?.(value)}
        className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-8 py-4 rounded-[18px] transition-all duration-300 active:scale-95 shadow-lg shadow-orange-500/20"
      >
        {loading ? "..." : "Search"}
      </button>
    </div>
  );
}
