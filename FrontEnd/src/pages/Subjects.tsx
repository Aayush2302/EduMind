import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, MoreVertical, MessageSquare } from "lucide-react";
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

interface Subject {
  id: string;
  name: string;
  description: string;
  chatCount: number;
  lastActivity: string;
}

const initialSubjects: Subject[] = [
  {
    id: "1",
    name: "Data Structures & Algorithms",
    description: "Arrays, linked lists, trees, and more",
    chatCount: 12,
    lastActivity: "2 hours ago",
  },
  {
    id: "2",
    name: "Machine Learning",
    description: "Neural networks and deep learning concepts",
    chatCount: 8,
    lastActivity: "1 day ago",
  },
  {
    id: "3",
    name: "Web Development",
    description: "Frontend and backend technologies",
    chatCount: 3,
    lastActivity: "3 days ago",
  },
];

const Subjects = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: "", description: "" });

  const handleCreate = () => {
    if (!newSubject.name.trim()) {
      toast.error("Please enter a subject name");
      return;
    }

    const subject: Subject = {
      id: Date.now().toString(),
      name: newSubject.name,
      description: newSubject.description,
      chatCount: 0,
      lastActivity: "Just now",
    };

    setSubjects([subject, ...subjects]);
    setNewSubject({ name: "", description: "" });
    setIsCreateOpen(false);
    toast.success("Subject created");
  };

  const handleDelete = (id: string) => {
    setSubjects(subjects.filter((s) => s.id !== id));
    toast.success("Subject deleted");
  };

  const handleSubjectClick = (subjectId: string) => {
    navigate(`/chats?subject=${subjectId}`);
  };

  return (
    <div className="space-y-6">
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

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {subjects.map((subject, index) => (
          <motion.div
            key={subject.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
          >
            <Card 
              variant="hover" 
              className="p-6 h-full cursor-pointer"
              onClick={() => handleSubjectClick(subject.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-foreground mb-1">
                    {subject.name}
                  </h3>
                  <p className="text-sm text-text-secondary line-clamp-2">
                    {subject.description}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover border-border">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      handleSubjectClick(subject.id);
                    }}>
                      Open Chats
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(subject.id);
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
                  <span>{subject.chatCount} chats</span>
                </div>
                <span className="text-text-muted">{subject.lastActivity}</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {subjects.length === 0 && (
        <div className="text-center py-16">
          <p className="text-text-muted mb-4">No subjects yet</p>
          <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
            Create your first subject
          </Button>
        </div>
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
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="hero-primary" onClick={handleCreate}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Subjects;