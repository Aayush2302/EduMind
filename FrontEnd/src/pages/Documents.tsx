import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, MoreVertical, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
}

const initialDocuments: Document[] = [
  {
    id: "1",
    name: "Algorithms Notes.pdf",
    type: "PDF",
    size: "2.4 MB",
    uploadedAt: "Dec 15, 2024",
  },
  {
    id: "2",
    name: "Machine Learning Guide.docx",
    type: "DOCX",
    size: "1.8 MB",
    uploadedAt: "Dec 12, 2024",
  },
  {
    id: "3",
    name: "Web Development Cheatsheet.pdf",
    type: "PDF",
    size: "890 KB",
    uploadedAt: "Dec 10, 2024",
  },
];

const Documents = () => {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleUpload(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleUpload(files);
  };

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setUploadProgress(0);

    // Simulate upload
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      setUploadProgress(i);
    }

    const newDocs: Document[] = files.map((file) => ({
      id: Date.now().toString() + file.name,
      name: file.name,
      type: file.name.split(".").pop()?.toUpperCase() || "FILE",
      size: formatFileSize(file.size),
      uploadedAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    }));

    setDocuments([...newDocs, ...documents]);
    setUploadProgress(null);
    toast.success(`${files.length} file(s) uploaded`);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleDelete = (id: string) => {
    setDocuments(documents.filter((d) => d.id !== id));
    toast.success("Document deleted");
  };

  const handleQuery = (id: string) => {
    toast.info("Opening chat with document context...");
    // In a real app, this would navigate to a chat with the document loaded
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-semibold text-foreground mb-1">Documents</h1>
        <p className="text-text-secondary">Upload and manage your learning materials</p>
      </motion.div>

      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "block p-8 border-2 border-dashed rounded-sm cursor-pointer transition-colors duration-200",
            isDragging
              ? "border-foreground bg-surface-1"
              : "border-border hover:border-text-muted"
          )}
        >
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center text-center">
            <Upload className="w-8 h-8 text-text-muted mb-3" />
            <p className="text-foreground mb-1">Drop files here or click to upload</p>
            <p className="text-sm text-text-muted">
              PDF, DOCX, TXT up to 10MB
            </p>
          </div>
        </label>

        {uploadProgress !== null && (
          <div className="mt-4 space-y-2">
            <Progress value={uploadProgress} className="h-1" />
            <p className="text-sm text-text-muted text-center">{uploadProgress}%</p>
          </div>
        )}
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="relative max-w-sm"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <Input
          variant="search"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </motion.div>

      {/* Documents List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card variant="surface" className="overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-border text-sm text-text-muted">
            <div className="col-span-6 md:col-span-5">Name</div>
            <div className="col-span-2 hidden md:block">Type</div>
            <div className="col-span-2 hidden md:block">Size</div>
            <div className="col-span-4 md:col-span-2">Date</div>
            <div className="col-span-2 md:col-span-1"></div>
          </div>

          {filteredDocuments.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              No documents found
            </div>
          ) : (
            filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="grid grid-cols-12 gap-4 p-4 border-b border-border last:border-b-0 hover:bg-surface-hover transition-colors duration-200 items-center"
              >
                <div className="col-span-6 md:col-span-5 flex items-center gap-3">
                  <FileText className="w-4 h-4 text-text-muted shrink-0" />
                  <span className="text-foreground truncate">{doc.name}</span>
                </div>
                <div className="col-span-2 hidden md:block text-text-secondary">
                  {doc.type}
                </div>
                <div className="col-span-2 hidden md:block text-text-secondary">
                  {doc.size}
                </div>
                <div className="col-span-4 md:col-span-2 text-text-secondary text-sm">
                  {doc.uploadedAt}
                </div>
                <div className="col-span-2 md:col-span-1 flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border">
                      <DropdownMenuItem onClick={() => handleQuery(doc.id)}>
                        Query Document
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(doc.id)}
                        className="text-destructive"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </Card>
      </motion.div>
    </div>
  );
};

export default Documents;
