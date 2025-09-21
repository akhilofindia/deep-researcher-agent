import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Upload, FileText, Trash2, RefreshCw } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  content: string;
  metadata: {
    source: string;
    uploadedAt: string;
    wordCount: number;
  };
}

interface DocumentManagerProps {
  documents: Document[];
  onDocumentsUpdate: (documents: Document[]) => void;
}

export const DocumentManager = ({ documents, onDocumentsUpdate }: DocumentManagerProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      console.log('sending',formData)
      const response = await fetch('http://127.0.0.1:8000/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);
      const uploadedDocs: Document[] = await response.json();

      const updatedDocuments = [...documents, ...uploadedDocs];
      onDocumentsUpdate(updatedDocuments);

      toast({
        title: 'Documents uploaded successfully',
        description: `Added ${uploadedDocs.length} document(s) to the backend index`,
      });
    } catch (error: any) {
      // console.log(response)
      console.error('Error uploading documents:', error);
      toast({
        title: 'Error uploading documents',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/delete/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(`Delete failed: ${response.statusText}`);

      const updatedDocuments = documents.filter((doc) => doc.id !== id);
      onDocumentsUpdate(updatedDocuments);

      toast({
        title: 'Document removed',
        description: 'Document has been deleted from the backend index',
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Error deleting document',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 shadow-research">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Document Repository</h2>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            variant="research"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Documents
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.md,.json,.pdf"
          onChange={handleFileUpload}
          className="hidden"
        />

        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Processing documents in backend...</span>
              <span>{Math.round(processingProgress)}%</span>
            </div>
            <Progress value={processingProgress} className="w-full" />
          </div>
        )}

        {documents.length === 0 ? (
          <Card className="p-8 text-center mt-4">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No documents uploaded</h3>
            <p className="text-muted-foreground mb-4">Upload documents to start building your research corpus</p>
            <Button onClick={() => fileInputRef.current?.click()} variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Upload Your First Document
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="p-4 shadow-card hover:shadow-research transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold truncate">{doc.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{doc.content.slice(0, 200)}...</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Uploaded: {new Date(doc.metadata.uploadedAt).toLocaleDateString()}</span>
                      <span>Words: {doc.metadata.wordCount.toLocaleString()}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteDocument(doc.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
