import { useEffect, useState } from "react";
import { markdownToHtml, isMarkdown } from "@/services/markdownService";
import "highlight.js/styles/atom-one-dark.css"; // Code block styling
import "../../styles/MessageDisplay.css"; // Custom table & markdown styles

interface MessageDisplayProps {
  content: string;
  sender: "user" | "assistant";
}

const MessageDisplay = ({ content, sender }: MessageDisplayProps) => {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const renderMarkdown = async () => {
      if (isMarkdown(content)) {
        setIsLoading(true);
        try {
          const html = await markdownToHtml(content);
          setHtmlContent(html);
        } catch (error) {
          console.error("Failed to parse markdown:", error);
          setHtmlContent(content);
        } finally {
          setIsLoading(false);
        }
      } else {
        setHtmlContent(content);
      }
    };

    renderMarkdown();
  }, [content]);

  if (isLoading) {
    return <p className="text-text-muted">Parsing content...</p>;
  }

  return (
    <div className={`message-content ${sender}`}>
      {htmlContent ? (
        <div
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      ) : (
        <p>{content}</p>
      )}
    </div>
  );
};

export default MessageDisplay;