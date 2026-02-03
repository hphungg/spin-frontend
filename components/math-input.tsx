"use client";

import * as React from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModelType } from "@/lib/api";

interface MathInputProps {
  onSubmit: (message: string, modelType: ModelType) => void;
  isLoading: boolean;
  initialValue?: string;
}

export function MathInput({ onSubmit, isLoading, initialValue = "" }: MathInputProps) {
  const [message, setMessage] = React.useState(initialValue);
  const [modelType, setModelType] = React.useState<ModelType>("base");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (initialValue) {
      setMessage(initialValue);
      textareaRef.current?.focus();
    }
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSubmit(message.trim(), modelType);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nhập đề bài tại đây..."
        disabled={isLoading}
        className="min-h-[140px] text-base leading-relaxed text-zinc-900"
      />
      
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-zinc-600 whitespace-nowrap">
            Chọn model:
          </label>
          <Select
            value={modelType}
            onValueChange={(value) => setModelType(value as ModelType)}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Chọn model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="base" className="border-none">
                <div className="flex items-center gap-2">
                  Base Model
                </div>
              </SelectItem>
              <SelectItem value="fine-tuned" className="border-none">
                <div className="flex items-center gap-2">
                  Tuned Model
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" disabled={!message.trim() || isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" />
              Đang giải...
            </>
          ) : (
            <>
              <Send />
              Giải ngay
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
