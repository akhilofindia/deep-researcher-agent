import { useState } from 'react';
import { SearchInterface } from '@/components/SearchInterface';
import { DocumentManager } from '@/components/DocumentManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Database, Brain } from 'lucide-react';

interface Document {
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

interface ResearchStep {
  id: string;
  query: string;
  status: 'pending' | 'processing' | 'completed';
  results: any[];
}

interface SearchResult {
  query: string;
  steps: ResearchStep[];
  documents: Document[];
  synthesis: string;
  completedAt?: string;
}

const Index = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDocumentsUpdate = (newDocuments: Document[]) => {
    setDocuments(newDocuments);
  };

  const handleSearch = async (query: string) => {
    setIsProcessing(true);

    // Create new search result with multi-step reasoning
    const newResult: SearchResult = {
      query,
      steps: [
        { id: '1', query: `Analyze key concepts in: "${query}"`, status: 'pending', results: [] },
        { id: '2', query: 'Search for relevant documents', status: 'pending', results: [] },
        { id: '3', query: 'Extract and rank information', status: 'pending', results: [] },
        { id: '4', query: 'Synthesize findings', status: 'pending', results: [] }
      ],
      documents: [],
      synthesis: ''
    };

    setSearchResults(prev => [newResult, ...prev]);

    // Simulate multi-step processing
    setTimeout(() => {
      setSearchResults(prev =>
        prev.map((result, index) =>
          index === 0
            ? {
                ...result,
                steps: result.steps.map((step, stepIndex) => ({
                  ...step,
                  status: stepIndex < 2 ? 'completed' : step.status
                })),
                documents: documents.slice(0, 3),
                synthesis: `Based on the analysis of ${documents.length} documents, I found relevant information related to "${query}". The research indicates multiple perspectives and data points that contribute to a comprehensive understanding of the topic.`
              }
            : result
        )
      );
      setIsProcessing(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-primary rounded-lg shadow-glow">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Deep Research Agent
              </h1>
              <p className="text-muted-foreground text-sm">
                Local embedding generation • Multi-step reasoning • Document synthesis
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Research
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Documents
            </TabsTrigger>
          </TabsList>

          {/* Research Tab */}
          <TabsContent value="search" className="space-y-6">
            <SearchInterface documentCount={documents.length} />

            {searchResults.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-foreground">Current Research</h2>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  {JSON.stringify(searchResults, null, 2)}
                </pre>
              </div>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <DocumentManager
              documents={documents}
              onDocumentsUpdate={handleDocumentsUpdate}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
