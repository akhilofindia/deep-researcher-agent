import { createContext, useContext, useState, ReactNode } from "react";

export interface ResearchStep {
  id: string;
  query: string;
  status: "pending" | "processing" | "completed";
  results: any[];
}

export interface Document {
  id: string;
  title: string;
  content: string;
  embedding: any[];
  metadata: {
    source: string;
    uploadedAt: string;
    wordCount: number;
  };
}

export interface SearchResult {
  query: string;
  steps: ResearchStep[];
  documents: Document[];
  synthesis: string;
  completedAt?: string;
}

interface SearchContentType {
  results: SearchResult[];
  setResults: (results: SearchResult[]) => void;
  query: string;
  setQuery: (query: string) => void;
}

const SearchContent = createContext<SearchContentType | undefined>(undefined);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [query, setQuery] = useState("");

  return (
    <SearchContent.Provider value={{ results, setResults, query, setQuery }}>
      {children}
    </SearchContent.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContent);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
};
