import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Chats from "@/components/chat/Chats";

const ChatsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const folderId = searchParams.get("subject");

  useEffect(() => {
    // Redirect to subjects if no folderId is provided
    if (!folderId) {
      navigate("/subjects");
    }
  }, [folderId, navigate]);

  // Don't render Chats component until we have a folderId
  if (!folderId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-7rem)]">
        <p className="text-text-muted">Loading...</p>
      </div>
    );
  }

  return <Chats folderId={folderId} />;
};

export default ChatsPage;