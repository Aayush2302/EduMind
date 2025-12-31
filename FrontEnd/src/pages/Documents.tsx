import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Trash2, Search, Loader2, AlertCircle, MessageSquare, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { getAllUserDocuments, deleteDocument } from "@/services/documentService";

interface Document {
  id: string;
  fileName: string;
  size: number;
  createdAt: string;
  chatId: string;
  chatTitle?: string;
  folderName?: string;
}

interface DocumentWithDetails extends Document {
  formattedSize: string;
  formattedDate: string;
}

const MAX_DOCUMENTS = 15;

const Documents = () => {
  const [documents, setDocuments] = useState<DocumentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentWithDetails | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      
      const data = await getAllUserDocuments();
      
      if (data.success) {
        const formattedDocs: DocumentWithDetails[] = data.documents.map((doc: Document) => ({
          ...doc,
          formattedSize: formatFileSize(doc.size),
          formattedDate: formatDate(doc.createdAt),
        }));
        
        setDocuments(formattedDocs);
      }
    } catch (error) {
      console.error("Failed to load documents:", error);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleDeleteClick = (doc: DocumentWithDetails) => {
    setDocumentToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;

    setDeleting(true);
    const toastId = toast.loading(`Deleting "${documentToDelete.fileName}"...`);

    try {
      await deleteDocument(documentToDelete.id);
      
      setDocuments(documents.filter((d) => d.id !== documentToDelete.id));
      toast.success(`Document "${documentToDelete.fileName}" deleted successfully`, {
        id: toastId,
      });
    } catch (error) {
      console.error("Delete error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete document";
      toast.error(errorMessage, {
        id: toastId,
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.chatTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.folderName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const documentCount = documents.length;
  const remainingSlots = MAX_DOCUMENTS - documentCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-semibold text-foreground mb-1">
          My Documents
        </h1>
        <p className="text-text-secondary">
          Manage your uploaded PDF documents
        </p>
      </motion.div>

      {/* Document Count Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card variant="surface" className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-text-muted" />
              <div>
                <p className="text-sm text-text-secondary">Total Documents</p>
                <p className="text-2xl font-semibold text-foreground">
                  {documentCount} / {MAX_DOCUMENTS}
                </p>
              </div>
            </div>
            {remainingSlots <= 5 && (
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className={`w-4 h-4 ${remainingSlots === 0 ? 'text-destructive' : 'text-amber-500'}`} />
                <span className={remainingSlots === 0 ? 'text-destructive' : 'text-amber-500'}>
                  {remainingSlots === 0 
                    ? 'Storage full! Delete documents to upload more.' 
                    : `${remainingSlots} slots remaining`}
                </span>
              </div>
            )}
          </div>
        </Card>
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
          placeholder="Search by filename, chat, or folder..."
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
          {/* Table Header - Desktop Only */}
          <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-border text-sm text-text-muted font-medium">
            <div className="col-span-4">File Name</div>
            <div className="col-span-2">Chat</div>
            <div className="col-span-2">Folder</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-1">Date</div>
            <div className="col-span-1"></div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-text-muted">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <p>Loading documents...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            /* Empty State */
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-text-muted mx-auto mb-3" />
              <p className="text-foreground font-medium mb-1">
                {searchQuery ? "No documents found" : "No documents yet"}
              </p>
              <p className="text-sm text-text-muted">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Upload PDFs from your chats to see them here"}
              </p>
            </div>
          ) : (
            /* Documents List */
            filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="p-4 border-b border-border last:border-b-0 hover:bg-surface-hover transition-colors duration-200"
              >
                {/* Mobile Layout */}
                <div className="md:hidden space-y-3">
                  {/* File Name */}
                  <div className="flex items-start gap-3">
                    <FileText className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium truncate" title={doc.fileName}>
                        {doc.fileName}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(doc)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Chat & Subject Info */}
                  <div className="pl-7 space-y-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-text-muted" />
                      <span className="text-text-secondary truncate" title={doc.chatTitle}>
                        {doc.chatTitle || "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-3.5 h-3.5 text-text-muted" />
                      <span className="text-text-secondary truncate" title={doc.folderName}>
                        {doc.folderName || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:grid grid-cols-12 gap-4 items-center">
                  {/* File Name */}
                  <div className="col-span-4 flex items-center gap-3">
                    <FileText className="w-4 h-4 text-text-muted shrink-0" />
                    <span className="text-foreground truncate" title={doc.fileName}>
                      {doc.fileName}
                    </span>
                  </div>

                  {/* Chat Title */}
                  <div className="col-span-2 text-text-secondary truncate" title={doc.chatTitle}>
                    {doc.chatTitle || "—"}
                  </div>

                  {/* Folder Name */}
                  <div className="col-span-2 text-text-secondary truncate" title={doc.folderName}>
                    {doc.folderName || "—"}
                  </div>

                  {/* Size */}
                  <div className="col-span-2 text-text-secondary">
                    {doc.formattedSize}
                  </div>

                  {/* Date */}
                  <div className="col-span-1 text-text-secondary text-sm">
                    {doc.formattedDate}
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(doc)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </Card>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{documentToDelete?.fileName}"? This action
              cannot be undone and will remove the document from both your chat and storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Documents;