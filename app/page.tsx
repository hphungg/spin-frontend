"use client";

import * as React from "react";
import { MathInput } from "@/components/math-input";
import { MathOutput } from "@/components/math-output";
import { solveMath, ModelType } from "@/lib/api";
import { HyperText } from "@/components/ui/hyper-text";

export default function Home() {
  const [response, setResponse] = React.useState<string | null>(null);
  const [modelUsed, setModelUsed] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = React.useState("");

  const handleSubmit = async (message: string, modelType: ModelType) => {
    setIsLoading(true);
    setError(null);
    setResponse(null);
    setModelUsed(null);

    try {
      const result = await solveMath(message, modelType);
      setResponse(result.response);
      setModelUsed(result.model_used);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể kết nối đến server. Vui lòng thử lại sau."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setSelectedSuggestion(suggestion);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl"></div>
      </div>

      <main className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <header className="text-center mb-10">
          <HyperText className="text-black">S P I N</HyperText>
        </header>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Input Section */}
          <section className="bg-white rounded-2xl p-6 shadow-lg shadow-zinc-300/50 border-2 border-zinc-200">
            <MathInput
              onSubmit={handleSubmit}
              isLoading={isLoading}
              initialValue={selectedSuggestion}
            />
          </section>

          {/* Output Section */}
          <section>
            <MathOutput
              response={response}
              modelUsed={modelUsed}
              isLoading={isLoading}
              error={error}
            />
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-zinc-400">
          <p>
            Ngô Việt Anh - Phạm Thị Kim Huệ - Hoàng Phi Hùng - Long Trí Thái Sơn
          </p>
        </footer>
      </main>
    </div>
  );
}
