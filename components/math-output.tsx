"use client";

import * as React from "react";
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Bot, Sparkles } from "lucide-react";

interface MathOutputProps {
  response: string | null;
  modelUsed: string | null;
  isLoading: boolean;
  error: string | null;
}

// Convert simple math expressions to LaTeX
function convertToLatex(text: string): string {
  // Already in LaTeX format
  if (text.includes("$") || text.includes("\\")) {
    return text;
  }
  
  // Check if it looks like a math expression
  const mathPattern = /^[\s]*[a-zA-Z0-9\s\+\-\*\/\=\^\(\)\[\]\{\}\.\,\<\>\≤\≥\≠]+[\s]*$/;
  if (mathPattern.test(text) && /[=\+\-\*\/\^]/.test(text)) {
    // Convert common patterns
    let latex = text
      .replace(/\^(\d+)/g, '^{$1}')           // x^2 -> x^{2}
      .replace(/\*\*/g, '^')                   // ** -> ^
      .replace(/\*/g, ' \\cdot ')              // * -> \cdot
      .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}') // sqrt(x) -> \sqrt{x}
      .replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}'); // 1/2 -> \frac{1}{2}
    
    return `$${latex}$`;
  }
  
  return text;
}

// Parse a single line and extract/render LaTeX
function parseLine(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  
  // Match LaTeX: $$...$$ or $...$ or \[...\] or \(...\)
  const regex = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$|\\\[[\s\S]*?\\\]|\\\(.*?\\\))/g;
  
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={key++}>{text.slice(lastIndex, match.index)}</span>
      );
    }

    const latex = match[0];
    
    try {
      if (latex.startsWith("$$") || latex.startsWith("\\[")) {
        const content = latex
          .replace(/^\$\$|\$\$$/g, "")
          .replace(/^\\\[|\\\]$/g, "")
          .trim();
        parts.push(
          <div key={key++} className="my-3 overflow-x-auto py-2">
            <BlockMath math={content} />
          </div>
        );
      } else {
        const content = latex
          .replace(/^\$|\$$/g, "")
          .replace(/^\\\(|\\\)$/g, "")
          .trim();
        parts.push(<InlineMath key={key++} math={content} />);
      }
    } catch {
      parts.push(<span key={key++}>{latex}</span>);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }

  return parts;
}

// Parse step header and format nicely
function parseStepHeader(text: string): { stepNumber: string; title: string } | null {
  // Match patterns like "## Step 1:", "**Step 1:**", "Step 1:", etc.
  const patterns = [
    /^#{1,3}\s*Step\s*(\d+):\s*(.*)$/i,
    /^\*\*Step\s*(\d+):\*\*\s*(.*)$/i,
    /^Step\s*(\d+):\s*(.*)$/i,
    /^Bước\s*(\d+):\s*(.*)$/i,
    /^#{1,3}\s*Bước\s*(\d+):\s*(.*)$/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return { stepNumber: match[1], title: match[2].trim() };
    }
  }
  
  return null;
}

// Check if line is a final answer
function isFinalAnswer(text: string): boolean {
  const patterns = [
    /the final answer is/i,
    /đáp án cuối cùng/i,
    /kết quả cuối cùng/i,
    /vậy.*?=/i,
    /kết luận/i,
  ];
  return patterns.some(p => p.test(text));
}

// Format the complete response into structured steps
function formatResponse(text: string): React.ReactNode {
  const lines = text.split("\n").filter(line => line.trim());
  const elements: React.ReactNode[] = [];
  let currentStep: { number: string; title: string; content: React.ReactNode[] } | null = null;
  let key = 0;

  const flushStep = () => {
    if (currentStep) {
      elements.push(
        <div key={key++} className="step-container mb-6 last:mb-0">
          <div className="step-header flex items-center gap-3 mb-3">
            <div className="step-number flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold shadow-md">
              {currentStep.number}
            </div>
            <h3 className="step-title text-base font-semibold text-zinc-800">
              {currentStep.title}
            </h3>
          </div>
          <div className="step-content ml-11 space-y-2 text-zinc-700">
            {currentStep.content}
          </div>
        </div>
      );
    }
  };

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines after ## headers
    if (!trimmedLine) continue;
    
    // Check if this is a step header
    const stepHeader = parseStepHeader(trimmedLine);
    if (stepHeader) {
      flushStep();
      currentStep = {
        number: stepHeader.stepNumber,
        title: stepHeader.title,
        content: [],
      };
      continue;
    }
    
    // Check if this is a final answer
    if (isFinalAnswer(trimmedLine)) {
      flushStep();
      currentStep = null;
      
      // Extract the answer value if present
      const converted = convertToLatex(trimmedLine);
      elements.push(
        <div key={key++} className="final-answer mt-6 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🎯</span>
            <span className="font-bold text-emerald-700">Đáp án</span>
          </div>
          <div className="text-lg font-medium text-emerald-800">
            {parseLine(converted)}
          </div>
        </div>
      );
      continue;
    }
    
    // Regular content line
    const converted = convertToLatex(trimmedLine);
    const parsed = parseLine(converted);
    
    if (currentStep) {
      currentStep.content.push(
        <div key={currentStep.content.length} className="content-line">
          {parsed}
        </div>
      );
    } else {
      // Content before any step or between steps
      elements.push(
        <div key={key++} className="mb-2 text-zinc-700">
          {parsed}
        </div>
      );
    }
  }
  
  // Flush any remaining step
  flushStep();

  return <div className="space-y-2">{elements}</div>;
}

export function MathOutput({ response, modelUsed, isLoading, error }: MathOutputProps) {
  const outputRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to output when response is ready
  React.useEffect(() => {
    if (response && outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [response]);

  if (error) {
    return (
      <Card ref={outputRef} className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 text-red-600">
            <span className="text-xl">❌</span>
            <div>
              <p className="font-medium">Có lỗi xảy ra</p>
              <p className="text-sm opacity-80">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card ref={outputRef} className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse"></div>
              <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-transparent border-t-blue-300 animate-spin"></div>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-zinc-700">
                Đang suy nghĩ để giải bài toán...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!response) {
    return (
      <Card className="border-dashed border-2 border-zinc-200 bg-zinc-50/50">
        <CardContent className="pt-6">
          <div className="text-center py-8 text-zinc-400">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Kết quả sẽ hiển thị ở đây</p>
            <p className="text-sm mt-1">Nhập bài toán và nhấn &quot;Giải ngay&quot; để bắt đầu</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const modelLabel = modelUsed?.includes("spin") ? "Tuned Model" : "Base Model";
  const isFineTuned = modelUsed?.includes("spin");

  return (
    <Card ref={outputRef} className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg shadow-green-100/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-green-700">
          <CheckCircle2 className="w-5 h-5" />
          Lời giải
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="prose prose-zinc max-w-none text-base leading-relaxed">
          {formatResponse(response)}
        </div>
        
        <div className="pt-4 border-t border-green-200">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            {isFineTuned ? (
              <Sparkles className="w-4 h-4 text-green-500" />
            ) : (
              <Bot className="w-4 h-4 text-blue-500" />
            )}
            <span>
              Model: <span className="font-medium text-zinc-700">{modelLabel}</span>
              {modelUsed && (
                <span className="ml-1 text-xs opacity-60">({modelUsed})</span>
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
