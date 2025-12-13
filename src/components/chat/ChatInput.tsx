import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  cityName?: string;
}

export function ChatInput({ onSend, disabled, placeholder, cityName }: ChatInputProps) {
  const defaultPlaceholder = cityName
    ? `Ask The Piggy about places in ${cityName}...`
    : "Ask The Piggy about places...";
  const finalPlaceholder = placeholder || defaultPlaceholder;
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
          placeholder={ finalPlaceholder }
          disabled={ disabled }
          className={ cn(
            "flex-1 px-4 py-3 bg-transparent text-foreground placeholder:text-muted-foreground",
            "focus:outline-none text-sm"
          ) }
        />
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
