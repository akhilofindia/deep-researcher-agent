import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Search, Loader2, Download, Info } from 'lucide-react';
import { useSearch } from '@/store/SearchContent';
import jsPDF from 'jspdf';

interface SearchInterfaceProps {
  documentCount: number;
}

export const SearchInterface = ({ documentCount }: SearchInterfaceProps) => {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { results, setResults } = useSearch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsProcessing(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!res.ok) throw new Error('Failed to fetch results');
      const data = await res.json();

      if (!data.results || !Array.isArray(data.results) || data.results.length === 0) {
        setResults([]);
        return;
      }

      const mappedResult = {
        query: query.trim(),
        steps: [],
        documents: Array.from(new Set(data.results.map((r: any) => r.source))).map((source, i) => {
          const src = source as string;
          return {
            id: `doc-${i}`,
            title: src || `Document ${i + 1}`,
            content: '', // Do not include full content in PDF
            embedding: [],
            metadata: {
              source: src || `Document ${i + 1}`,
              uploadedAt: new Date().toISOString(),
              wordCount: 0,
            },
          };
        }),
        synthesis: data.synthesis || 'No summary available.',
        completedAt: new Date().toISOString(),
      };

      setResults([mappedResult, ...results]);
    } catch (err) {
      console.error("SearchInterface Error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!results || results.length === 0) return;

    const doc = new jsPDF();
    let y = 10;

    results.forEach((res, idx) => {
      doc.setFontSize(14);
      doc.text(`Research #${idx + 1}`, 10, y);
      y += 10;

      doc.setFontSize(12);
      doc.text(`Query: ${res.query}`, 10, y);
      y += 8;

      doc.text(`Documents analyzed: ${res.documents.length}`, 10, y);
      y += 8;

      doc.text(`Completed at: ${res.completedAt || '-'}`, 10, y);
      y += 10;

      doc.text(`Summary:`, 10, y);
      y += 8;
      const lines = doc.splitTextToSize(res.synthesis || 'No summary available.', 180);
      doc.text(lines, 12, y);
      y += lines.length * 7 + 10;

      if (y > 270) {
        doc.addPage();
        y = 10;
      }
    });

    // Footer
    doc.setFontSize(10);
    doc.text('By Akhil Raj', 10, 290);

    doc.save('search_results.pdf');
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card className="p-6 shadow-research">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="research-query" className="block text-sm font-medium mb-2">
              Research Query
            </label>
            <Textarea
              id="research-query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your research question (e.g., 'List technical skills')..."
              className="min-h-[100px] resize-none"
              disabled={isProcessing}
            />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              The agent will analyze your query and extract relevant information
            </p>
            <Button type="submit" disabled={!query.trim() || isProcessing} variant="research">
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Researching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Start Research
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Help / Tips Section */}
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 mt-1 text-blue-500" />
          <div>
            <h3 className="text-lg font-semibold mb-2">Tips for better results</h3>
            <ul className="list-disc ml-6 text-sm text-muted-foreground space-y-1">
              <li>Ensure documents are uploaded in the Document Repository.</li>
              <li>Queries are case-insensitive and punctuation is ignored.</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Search Results */}
      {results.length > 0 ? (
        <Card className="p-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Previous Research Results</h3>
            <Button onClick={handleDownloadPDF} variant="secondary" className="flex items-center gap-2">
              <Download className="w-4 h-4" /> Download Results as PDF
            </Button>
          </div>

          {results.map((res, idx) => (
            <div key={idx} className="mb-4 border-b pb-2">
              <p><strong>Query:</strong> {res.query}</p>
              <p><strong>Documents analyzed:</strong> {res.documents.length}</p>
              <p><strong>Completed at:</strong> {res.completedAt}</p>
              <p><strong>Summary:</strong> {res.synthesis}</p>
            </div>
          ))}
        </Card>
      ) : (
        <Card className="p-6">
          <p>No results yet. Please run a research query.</p>
        </Card>
      )}

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground mt-4">By Akhil Raj</p>
    </div>
  );
};
