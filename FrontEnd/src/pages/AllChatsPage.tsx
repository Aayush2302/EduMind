// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { motion } from "framer-motion";
// import { MessageSquare, Trash2, Loader2, Plus } from "lucide-react";
// import { Card } from "@/components/ui/card";
// import { Link, useNavigate } from "react-router-dom";
// import { useEffect, useState } from "react";
// import { getAllUserChats, archiveChat } from "@/services/chatService";
// import { Button } from "@/components/ui/button";

// interface Chat {
//   _id: string;
//   folderId: {
//     _id: string;
//     name: string;
//   } | string;
//   title: string;
//   studyMode?: "simple" | "interview" | "step-by-step";
//   isArchived: boolean;
//   createdAt: string;
//   updatedAt: string;
// }

// export default function AllChatsPage() {
//   const [chats, setChats] = useState<Chat[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [deletingId, setDeletingId] = useState<string | null>(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     loadChats();
//   }, []);

//   const loadChats = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const data = await getAllUserChats();
//       setChats(data);
//     } catch (err) {
//       const errorMessage =
//         err instanceof Error ? err.message : "Failed to load chats";
//       setError(errorMessage);
//       console.error("Chats error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDeleteChat = async (chatId: string) => {
//     if (!window.confirm("Are you sure you want to archive this chat?")) {
//       return;
//     }

//     try {
//       setDeletingId(chatId);
//       await archiveChat(chatId);
//       setChats(chats.filter((chat) => chat._id !== chatId));
//     } catch (err) {
//       const errorMessage =
//         err instanceof Error ? err.message : "Failed to archive chat";
//       alert(errorMessage);
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   const formatDate = (dateString: string): string => {
//     try {
//       const date = new Date(dateString);
//       const now = new Date();
//       const diffMs = now.getTime() - date.getTime();
//       const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
//       const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

//       if (diffHours < 1) return "Just now";
//       if (diffHours < 24)
//         return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
//       if (diffDays === 1) return "Yesterday";
//       if (diffDays < 7) return `${diffDays} days ago`;
//       if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
//       return date.toLocaleDateString();
//     } catch {
//       return "Recently";
//     }
//   };

//   const getStudyModeColor = (
//     mode: "simple" | "interview" | "step-by-step" | undefined
//   ) => {
//     switch (mode) {
//       case "simple":
//         return "bg-blue-100 text-blue-800";
//       case "interview":
//         return "bg-purple-100 text-purple-800";
//       case "step-by-step":
//         return "bg-green-100 text-green-800";
//       default:
//         return "bg-gray-100 text-gray-800";
//     }
//   };

//   const getFolderName = (folderId: Chat["folderId"]): string => {
//     if (typeof folderId === "string") {
//       return "Unknown Subject";
//     }
//     return folderId.name || "Unknown Subject";
//   };

//   const handleOpenChat = (chat: Chat) => {
//     // Navigate to the subject page with the chat context
//     const folderIdStr = typeof chat.folderId === "string" ? chat.folderId : chat.folderId._id;
//     const subjectName = getFolderName(chat.folderId);
    
//     navigate(`/subjects?chat=${chat._id}&subject=${folderIdStr}&subjectName=${encodeURIComponent(subjectName)}`);
//   };

//   if (error) {
//     return (
//       <div className="space-y-6">
//         <motion.div
//           initial={{ opacity: 0, y: 10 }}
//           animate={{ opacity: 1, y: 0 }}
//         >
//           <h1 className="text-3xl font-bold text-foreground mb-2">All Chats</h1>
//           <p className="text-text-secondary">
//             All your conversations in one place
//           </p>
//         </motion.div>

//         <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
//           {error}
//         </div>

//         <Button onClick={loadChats} variant="default">
//           Try Again
//         </Button>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <motion.div
//         initial={{ opacity: 0, y: 10 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.3 }}
//       >
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-3xl font-bold text-foreground mb-2">All Chats</h1>
//             <p className="text-text-secondary">
//               All your conversations in one place
//             </p>
//           </div>
//           <Link to="/subjects">
//             <Button className="flex items-center gap-2">
//               <Plus className="w-4 h-4" />
//               New Chat
//             </Button>
//           </Link>
//         </div>
//       </motion.div>

//       {/* Chats Grid */}
//       {loading ? (
//         <div className="flex items-center justify-center py-12">
//           <div className="text-center">
//             <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-text-muted" />
//             <p className="text-text-muted">Loading your chats...</p>
//           </div>
//         </div>
//       ) : chats.length === 0 ? (
//         <motion.div
//           initial={{ opacity: 0, y: 10 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="text-center py-12"
//         >
//           <MessageSquare className="w-12 h-12 mx-auto mb-4 text-text-muted opacity-50" />
//           <h2 className="text-lg font-medium text-foreground mb-2">
//             No chats yet
//           </h2>
//           <p className="text-text-secondary mb-6">
//             Create a subject and start a chat to begin learning
//           </p>
//           <Link to="/subjects">
//             <Button>Create Your First Chat</Button>
//           </Link>
//         </motion.div>
//       ) : (
//         <motion.div
//           initial={{ opacity: 0, y: 10 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
//         >
//           {chats.map((chat, index) => (
//             <motion.div
//               key={chat._id}
//               initial={{ opacity: 0, y: 10 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: index * 0.05 }}
//             >
//               <Card className="p-4 hover:bg-surface-hover transition-colors duration-200 h-full flex flex-col group">
//                 <div className="flex-1">
//                   <div className="flex items-start justify-between mb-2">
//                     <h3 className="text-foreground font-semibold line-clamp-2 flex-1">
//                       {chat.title}
//                     </h3>
//                     <button
//                       onClick={() => handleDeleteChat(chat._id)}
//                       disabled={deletingId === chat._id}
//                       className="ml-2 p-1 hover:bg-red-100 rounded transition-colors duration-200 disabled:opacity-50 opacity-0 group-hover:opacity-100"
//                       title="Archive chat"
//                     >
//                       {deletingId === chat._id ? (
//                         <Loader2 className="w-4 h-4 animate-spin text-red-600" />
//                       ) : (
//                         <Trash2 className="w-4 h-4 text-text-muted hover:text-red-600" />
//                       )}
//                     </button>
//                   </div>

//                   <p className="text-sm text-text-secondary mb-3">
//                     📁 {getFolderName(chat.folderId)}
//                   </p>

//                   {chat.studyMode && (
//                     <div className="flex gap-2 mb-3 flex-wrap">
//                       <span
//                         className={`text-xs px-2 py-1 rounded-full font-medium ${getStudyModeColor(
//                           chat.studyMode
//                         )}`}
//                       >
//                         {chat.studyMode === "step-by-step"
//                           ? "Step-by-Step"
//                           : chat.studyMode.charAt(0).toUpperCase() +
//                             chat.studyMode.slice(1)}
//                       </span>
//                     </div>
//                   )}
//                 </div>

//                 <div className="flex items-center justify-between pt-3 border-t border-border">
//                   <span className="text-xs text-text-muted">
//                     {formatDate(chat.createdAt)}
//                   </span>
//                   <Button 
//                     size="sm" 
//                     variant="ghost"
//                     onClick={() => handleOpenChat(chat)}
//                   >
//                     Open
//                   </Button>
//                 </div>
//               </Card>
//             </motion.div>
//           ))}
//         </motion.div>
//       )}

//       {/* Stats */}
//       {chats.length > 0 && (
//         <motion.div
//           initial={{ opacity: 0, y: 10 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.2 }}
//           className="pt-4"
//         >
//           <Card className="p-4 bg-surface">
//             <p className="text-sm text-text-secondary">
//               Total Chats: <span className="font-semibold text-foreground">{chats.length}</span>
//             </p>
//           </Card>
//         </motion.div>
//       )}
//     </div>
//   );
// }