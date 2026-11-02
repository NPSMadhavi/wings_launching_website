import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { useLocation } from "wouter";
import { searchWebsite } from "@/lib/searchData";

export default function GlobalSearch({ isMobile = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [dynamicItems, setDynamicItems] = useState([]);
  const [, navigate] = useLocation();

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Optionally fetch published articles/events from API if available to supplement index
  useEffect(() => {
    let cancelled = false;
    const fetchDynamic = async () => {
      try {
        const res = await fetch("/api/articles");
        if (res.ok) {
          const json = await res.json();
          const items = Array.isArray(json) ? json : json?.data || [];
          if (!cancelled && items.length > 0) {
            const mapped = items.map((a) => ({
              id: `api-article-${a.id}`,
              title: a.title,
              category: "Article",
              route: a.slug ? `/article/${encodeURIComponent(a.slug)}` : "/articles",
              description: a.excerpt || (a.content ? a.content.replace(/<[^>]+>/g, "").slice(0, 140) : ""),
              keywords: [a.title, a.category, "article"].filter(Boolean),
            }));
            setDynamicItems(mapped);
          }
        }
      } catch {
        // Silently fall back to static index if API unavailable
      }
    };
    fetchDynamic();
    return () => {
      cancelled = true;
    };
  }, []);

  // Update search results whenever query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const matched = searchWebsite(query, dynamicItems);
    setResults(matched);
  }, [query, dynamicItems]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 60);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  // Close on Outside Click or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectResult = (route) => {
    setIsOpen(false);
    setQuery("");
    if (route.startsWith("/#")) {
      const hash = route.slice(1);
      if (window.location.pathname === "/") {
        const el = document.querySelector(hash);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        if (hash === "#contact") {
          try {
            sessionStorage.setItem("scrollToContact", "1");
          } catch {}
        }
        navigate("/");
      }
      return;
    }
    navigate(route);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (results.length > 0) {
      handleSelectResult(results[0].route);
    } else if (query.trim()) {
      const matched = searchWebsite(query, dynamicItems);
      if (matched.length > 0) {
        handleSelectResult(matched[0].route);
      }
    }
  };

  const formatCategory = (category) => {
    if (!category) return "";
    if (category.toLowerCase() === "topic") return "Issue";
    return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  };

  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case "Service":
        return "bg-[#EAF3FF] text-[#1B4585] border-[#D0E2FF]";
      case "Article":
        return "bg-[#ECFDF5] text-[#0D7A5F] border-[#A7F3D0]";
      case "Topic":
      case "Issue":
        return "bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]";
      case "Contact":
        return "bg-[#FFF7ED] text-[#C2410C] border-[#FFEDD5]";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Search Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Search website"
        title="Search"
        className={`
          flex items-center justify-center
          rounded-full
          cursor-pointer
          transition-all duration-200
          ${
            isOpen
              ? "bg-[#1B4585] text-white shadow-sm"
              : "text-[#1B4585] hover:bg-[#F0F4FA] hover:text-[#0D4A7A] active:bg-[#E2ECF8]"
          }
          ${isMobile ? "w-10 h-10 p-2" : "w-10 h-10 p-2.5"}
        `}
      >
        <Search size={isMobile ? 20 : 19} strokeWidth={2.3} />
      </button>

      {/* Dropdown Panel with Connecting Pointer Triangle */}
      {isOpen && (
        <div
          className={`
            fixed sm:absolute
            left-3 right-3 sm:left-auto sm:right-0
            top-[76px] sm:top-full
            sm:mt-3.5
            w-auto sm:w-[460px] md:w-[500px]
            max-w-[calc(100vw-24px)]
            bg-white
            rounded-2xl
            shadow-2xl
            border border-gray-100
            p-4 sm:p-5
            z-[999]
            animate-in fade-in zoom-in-95 duration-150
          `}
          style={{
            boxShadow:
              "0 20px 35px -5px rgba(27, 69, 133, 0.15), 0 10px 15px -5px rgba(0, 0, 0, 0.08)",
          }}
        >
          {/* Pointer / Triangle connecting to navbar search icon (Desktop & Tablets) */}
          <div
            className="
              hidden sm:block
              absolute -top-2 right-4
              w-4 h-4
              bg-white
              transform rotate-45
              border-t border-l border-gray-100
              pointer-events-none
              z-10
            "
          />

          {/* Search Input Area */}
          <form onSubmit={handleSubmit} className="relative flex items-center w-full">
            <Search
              size={18}
              className="absolute left-3.5 text-gray-400 pointer-events-none"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (results.length > 0) {
                    handleSelectResult(results[0].route);
                  } else if (query.trim()) {
                    const matched = searchWebsite(query, dynamicItems);
                    if (matched.length > 0) {
                      handleSelectResult(matched[0].route);
                    }
                  }
                }
              }}
              placeholder="Search..."
              className="
                w-full
                pl-10 pr-10 py-2.5
                bg-[#F8FAFC]
                hover:bg-[#F1F5F9]
                focus:bg-white
                text-gray-900
                text-sm sm:text-base
                rounded-xl
                border border-gray-200
                focus:border-[#1B4585]
                focus:ring-2 focus:ring-[#1B4585]/15
                outline-none
                transition-all
                placeholder:text-gray-400
              "
              style={{
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="
                  absolute right-3
                  p-1
                  text-gray-400
                  hover:text-gray-600
                  rounded-full
                  hover:bg-gray-200
                  transition-colors
                "
              >
                <X size={15} />
              </button>
            )}
          </form>

          {/* Results Area */}
          <div className="mt-3">
            {/* Initial empty search prompt */}
            {query.trim().length === 0 && (
              <div className="py-4 px-1 text-left">
                <p
                  className="text-xs text-gray-400 font-semibold mb-2.5 text-left"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Suggestions
                </p>
                <div className="flex flex-wrap gap-1.5 justify-start">
                  {["Services", "Articles", "Events", "Team", "Partners", "Contact"].map(
                    (suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setQuery(suggestion)}
                        className="
                          text-xs
                          px-2.5 py-1
                          bg-gray-100
                          hover:bg-[#EAF3FF] hover:text-[#1B4585]
                          text-gray-600
                          rounded-full
                          transition-colors
                        "
                        style={{ fontFamily: "'DM Sans', sans-serif" }}
                      >
                        {suggestion}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Results list */}
            {query.trim().length > 0 && results.length > 0 && (
              <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-100 pr-1">
                <div className="px-1 py-1.5 text-xs text-gray-400 font-medium">
                  Found {results.length} relevant {results.length === 1 ? "result" : "results"}
                </div>
                {results.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectResult(item.route)}
                    className="
                      w-full
                      text-left
                      p-3
                      rounded-xl
                      hover:bg-[#F4F7FC]
                      active:bg-[#EAF3FF]
                      transition-colors
                      group
                      block
                    "
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`
                            inline-flex items-center
                            text-[11px] font-medium
                            px-2 py-0.5 rounded-full border
                            ${getCategoryBadgeClass(item.category)}
                          `}
                        >
                          {formatCategory(item.category)}
                        </span>
                      </div>
                      <h4
                        className="
                          text-sm font-semibold
                          text-gray-900
                          group-hover:text-[#1B4585]
                          transition-colors
                          truncate
                        "
                        style={{ fontFamily: "'Outfit', sans-serif" }}
                      >
                        {item.title}
                      </h4>
                      {item.description && (
                        <p
                          className="
                            text-xs text-gray-500
                            mt-0.5
                            line-clamp-2
                            leading-relaxed
                          "
                          style={{ fontFamily: "'DM Sans', sans-serif" }}
                        >
                          {item.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No results found */}
            {query.trim().length > 0 && results.length === 0 && (
              <div className="py-8 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center mb-2">
                  <Search size={18} />
                </div>
                <p
                  className="text-sm font-semibold text-gray-800"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  No results found
                </p>
                <p
                  className="text-xs text-gray-500 mt-1 max-w-xs mx-auto"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  We couldn't find anything matching &ldquo;{query.trim()}&rdquo;. Try checking for typos or searching with different keywords.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
