import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, Loader2, FileText, Brain, Lightbulb } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  content: string;
  embedding: number[];
  metadata: {
    source: string;
    uploadedAt: Date | string;
    wordCount: number;
  };
}

interface ResearchStep {
  id: string;
  query: string;
  status: 'pending' | 'processing' | 'completed';
  results?: any[];
}

interface SearchResult {
  query: string;
  steps?: ResearchStep[];
  documents?: Document[];
  synthesis?: string;
  completedAt?: string;
}

interface ResearchResultsProps {
  results: SearchResult[];
}

export const ResearchResults = ({ results }: ResearchResultsProps) => {
  const getStepIcon = (status: ResearchStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-research-accent" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-research-secondary animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getOverallProgress = (steps?: ResearchStep[]) => {
    if (!steps || steps.length === 0) return 0;
    const completed = steps.filter(s => s.status === 'completed').length;
    return (completed / steps.length) * 100;
  };

  // Extract query-specific items (e.g., skills) for tag display
  const extractItems = (result: SearchResult) => {
    const items = new Set<string>();
    if (result.synthesis) {
      result.synthesis.split('\n').slice(1).forEach(line => { // Skip the "Summary for..." line
        const cleaned = line.replace(/[-•\s]+/g, ' ').trim();
        if (cleaned) items.add(cleaned);
      });
    }
    result.documents?.forEach(doc => {
      const matches = doc.content.match(new RegExp(`${result.query}.*?(?:\.|\n|$)`, 'gi'));
      if (matches) {
        matches.forEach(match => {
          match.split(/[,|]/).forEach(item => {
            const cleaned = item.replace(/[-•\s]+/g, ' ').trim();
            if (cleaned) items.add(cleaned);
          });
        });
      }
    });
    return Array.from(items);
  };

  const hasDocuments = results.some(
    r => Array.isArray(r.documents) && r.documents.length > 0
  );

  if (!hasDocuments) {
    return (
      <Card className="p-8 text-center">
        <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No research results yet</h3>
        <p className="text-muted-foreground">
          Start a research query to see multi-step reasoning and document analysis.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {results.map((result, idx) => (
        <Card key={idx} className="p-6 shadow-research bg-gradient-to-r from-research-muted/10 to-research-accent/10">
          {/* Query Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1 text-research-primary break-words">
                Query: {result.query}
              </h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{result.documents?.length || 0} documents analyzed</span>
                {result.completedAt && (
                  <span>
                    Completed at {new Date(result.completedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
            <Badge variant="secondary" className="bg-research-muted">
              Research #{results.length - idx}
            </Badge>
          </div>

          {/* Query-Specific Items (e.g., Skills) */}
          {extractItems(result).length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
                Key Findings
              </h4>
              <div className="flex flex-wrap gap-2">
                {extractItems(result).map((item, i) => (
                  <Badge key={i} variant="outline" className="text-sm bg-research-accent/20 border-research-accent">
                    {item.slice(0, 50)}{item.length > 50 ? '...' : ''}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Multi-step progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">Analysis Progress</span>
              <span>{Math.round(getOverallProgress(result.steps))}%</span>
            </div>
            <Progress value={getOverallProgress(result.steps)} className="w-full h-2 bg-research-muted" />
          </div>

          {/* Reasoning Steps */}
          {result.steps && result.steps.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
                Analysis Steps
              </h4>
              <div className="grid gap-2">
                {result.steps.map((step, stepIdx) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      step.status === 'completed'
                        ? 'bg-research-accent/5 border-research-accent/20'
                        : step.status === 'processing'
                        ? 'bg-research-secondary/5 border-research-secondary/20'
                        : 'bg-muted/50 border-border'
                    }`}
                  >
                    <div>{getStepIcon(step.status)}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium break-words">{step.query}</p>
                      {step.status === 'completed' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Step {stepIdx + 1} completed
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analyzed Documents */}
          {result.documents && result.documents.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
                Source Documents
              </h4>
              <div className="grid gap-2">
                {result.documents.map(doc => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-2 rounded border bg-card/50 hover:bg-card/80 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-research-secondary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.metadata.wordCount.toLocaleString()} words
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Relevant
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Synthesis */}
          {result.synthesis && result.synthesis.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-research-accent" />
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Summary
                </h4>
              </div>
              <Card className="p-4 bg-gradient-subtle border-research-accent/30 shadow-sm">
                <p className="text-sm leading-relaxed break-words whitespace-pre-line">{result.synthesis}</p>
              </Card>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};