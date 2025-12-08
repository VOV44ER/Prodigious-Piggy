import { useState } from "react";
import { Send, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, placeholder = "Ask Piggy about places in Casablanca..." }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  return (
    <form onSubmit={ handleSubmit } className="relative">
      <div className="flex items-center gap-2 p-2 bg-card border border-border rounded-2xl shadow-soft">
        <input
          type="text"
          value={ message }
          onChange={ (e) => setMessage(e.target.value) }
          placeholder={ placeholder }
          disabled={ disabled }
          className={ cn(
            "flex-1 px-4 py-3 bg-transparent text-foreground placeholder:text-muted-foreground",
            "focus:outline-none text-sm"
          ) }
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          title="Voice input (coming soon)"
          disabled
        >
          <Mic className="h-5 w-5" />
        </Button>
        <Button
          type="submit"
          size="icon"
          disabled={ !message.trim() || disabled }
          className="rounded-xl"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
