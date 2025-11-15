import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface MessageInputProps {
  onSend: (message: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

export const MessageInput = ({ 
  onSend, 
  onTypingStart, 
  onTypingStop 
}: MessageInputProps) => {
  const [localMessage, setLocalMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalMessage(newValue);
    // ✅ NU APELĂM onTypingStart/onTypingStop
  };

  const handleSend = () => {
    const trimmedMessage = localMessage.trim();
    
    if (trimmedMessage) {
      onSend(trimmedMessage);
      setLocalMessage("");
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-3 sm:p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex gap-2 max-w-4xl mx-auto">
        <Input
          ref={inputRef}
          placeholder="Scrie un mesaj..."
          value={localMessage}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="flex-1 h-10 sm:h-11 rounded-full bg-muted/50 border-none focus-visible:ring-2"
          autoComplete="off"
        />
        <Button
          onClick={handleSend}
          disabled={!localMessage.trim()}
          size="icon"
          className="flex-shrink-0 rounded-full h-10 w-10 sm:h-11 sm:w-11"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </div>
    </div>
  );
};