import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, MoreVertical, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  getFolders,
  createFolder,
  deleteFolder,
  type Folder,
} from "@/services/folderService";
// import { AuthDebug } from "@/components/AuthDebug";

const Subjects = () => {
  const navigate = useNavigate();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: "", description: "" });
  const [showDebug, setShowDebug] = useState(true); // Toggle this to hide debug panel

  // Load folders on mount
  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      setIsLoading(true);
      const data = await getFolders();
      setFolders(data);
    } catch (error) {
      console.error("Failed to load folders:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load subjects");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newSubject.name.trim()) {
      toast.error("Please enter a subject name");
      return;
    }

    try {
      setIsCreating(true);
      const folder = await createFolder({
        name: newSubject.name,
        description: newSubject.description || undefined,
      });

      setFolders([folder, ...folders]);
      setNewSubject({ name: "", description: "" });
      setIsCreateOpen(false);
      toast.success("Subject created successfully");
    } catch (error) {
      console.error("Failed to create folder:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create subject");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (folderId: string, folderName: string) => {
    try {
      await deleteFolder(folderId);
      setFolders(folders.filter((f) => f._id !== folderId));
      toast.success(`"${folderName}" deleted successfully`);
    } catch (error) {
      console.error("Failed to delete folder:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete subject");
    }
  };

  const handleSubjectClick = (folderId: string) => {
    navigate(`/chats?subject=${folderId}`);
  };

  const getRelativeTime = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInMs = now.getTime() - past.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    if (diffInDays === 1) return "1 day ago";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return past.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Debug Panel - Remove once auth is working */}
      {/* {showDebug && <AuthDebug />} */}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-1">Subjects</h1>
          <p className="text-text-secondary">Organize your learning by topic</p>
        </div>
        <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Subject
        </Button>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-text-muted" />
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {folders.map((folder, index) => (
              <motion.div
                key={folder._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Card
                  variant="hover"
                  className="p-6 h-full cursor-pointer"
                  onClick={() => handleSubjectClick(folder._id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-foreground mb-1">
                        {folder.name}
                      </h3>
                      {folder.description && (
                        <p className="text-sm text-text-secondary line-clamp-2">
                          {folder.description}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSubjectClick(folder._id);
                          }}
                        >
                          Open Chats
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(folder._id, folder.name);
                          }}
                          className="text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-text-muted">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>0 chats</span>
                    </div>
                    <span className="text-text-muted">
                      {getRelativeTime(folder.updatedAt)}
                    </span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {folders.length === 0 && (
            <div className="text-center py-16">
              <p className="text-text-muted mb-4">No subjects yet</p>
              <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
                Create your first subject
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create Subject Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create Subject</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-text-secondary">Subject Name</label>
              <Input
                placeholder="e.g., Data Structures"
                value={newSubject.name}
                onChange={(e) =>
                  setNewSubject({ ...newSubject, name: e.target.value })
                }
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-text-secondary">
                Description (optional)
              </label>
              <Input
                placeholder="Brief description"
                value={newSubject.description}
                onChange={(e) =>
                  setNewSubject({ ...newSubject, description: e.target.value })
                }
                disabled={isCreating}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              variant="hero-primary"
              onClick={handleCreate}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Subjects;