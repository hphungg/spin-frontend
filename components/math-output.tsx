"use client"

import * as React from "react"
import "katex/dist/katex.min.css"
import { InlineMath, BlockMath } from "react-katex"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Bot, Sparkles } from "lucide-react"
import { TextShimmer } from "./ui/text-shimmer"
import { Spinner } from "./ui/spinner"

interface MathOutputProps {
    response: string | null
    modelUsed: string | null
    isLoading: boolean
    error: string | null
}

// Enhanced function to convert math expressions to LaTeX
function convertMathToLatex(text: string): string {
    // If already contains LaTeX delimiters, return as is
    if (/\$\$[\s\S]*?\$\$|\$[^$]+?\$|\\\[[\s\S]*?\\\]|\\\(.*?\\\)/.test(text)) {
        return text
    }

    let result = text

    // Process integral expressions: ∫x^4 dx or ∫(...)dx
    result = result.replace(
        /∫([^∫]+?)(?:\s*dx|\s*dy|\s*dt|\s*d[a-z])/g,
        (_, expr) => `$\\int ${convertExpressionToLatex(expr.trim())} \\, dx$`
    )

    // Process expressions with = sign that look like equations
    // Split by text before/after mathematical parts
    const parts = result.split(/(\s*[=-]\s*)/g)
    let hasChanges = false

    const processedParts = parts.map((part) => {
        // Skip connectors
        if (/^\s*[=-]\s*$/.test(part)) return part

        // Check if part looks mathematical
        if (isMathExpression(part)) {
            hasChanges = true
            return `$${convertExpressionToLatex(part.trim())}$`
        }
        return part
    })

    if (hasChanges) {
        result = processedParts.join("")
        // Clean up duplicate $$ that might occur
        result = result.replace(/\$\s*\$/g, " ")
        result = result.replace(/\$\$/g, "$")
    }

    return result
}

// Check if a string looks like a math expression
function isMathExpression(text: string): boolean {
    const trimmed = text.trim()
    if (!trimmed) return false

    // Contains mathematical operators or patterns
    const mathPatterns = [
        /\^/,                    // Exponent
        /[a-z]\d+/i,             // Variable with number like x2, C1
        /\d+\/\d+/,              // Fraction like 1/2
        /\([^)]+\)/,             // Parentheses with content
        /\d+x/i,                 // Number with variable
        /x\^/i,                  // x^ pattern
        /ln\(/i,                 // Natural log
        /log\(/i,                // Log
        /sqrt\(/i,               // Square root
        /sin\(|cos\(|tan\(/i,    // Trig functions
        /\d+\s*[+\-*/]\s*\d+/,   // Basic arithmetic
        /[a-z]\s*[+\-*/]\s*[a-z]/i, // Variables with operators
    ]

    return mathPatterns.some((pattern) => pattern.test(trimmed))
}

// Convert a math expression to proper LaTeX
function convertExpressionToLatex(expr: string): string {
    let latex = expr

    // Handle integrals first
    latex = latex.replace(/∫/g, "\\int ")

    // Handle fractions: (a/b) or a/b patterns
    // Match (num/denom) style
    latex = latex.replace(/\((\d+)\/(\d+)\)/g, "\\frac{$1}{$2}")
    // Match simple a/b style (only numbers)
    latex = latex.replace(/(\d+)\/(\d+)/g, "\\frac{$1}{$2}")

    // Handle exponents: x^4, x^(n-1), (x+1)^2
    latex = latex.replace(/\^(\([^)]+\))/g, "^{$1}")
    latex = latex.replace(/\^(\d+)/g, "^{$1}")
    latex = latex.replace(/\^([a-zA-Z])/g, "^{$1}")

    // Handle common functions
    latex = latex.replace(/ln\(([^)]+)\)/gi, "\\ln($1)")
    latex = latex.replace(/log\(([^)]+)\)/gi, "\\log($1)")
    latex = latex.replace(/sqrt\(([^)]+)\)/gi, "\\sqrt{$1}")
    latex = latex.replace(/sin\(([^)]+)\)/gi, "\\sin($1)")
    latex = latex.replace(/cos\(([^)]+)\)/gi, "\\cos($1)")
    latex = latex.replace(/tan\(([^)]+)\)/gi, "\\tan($1)")

    // Handle multiplication symbol
    latex = latex.replace(/\*/g, " \\cdot ")

    // Clean up C1, C2, etc. to be subscripts
    latex = latex.replace(/([C])(\d+)/g, "$1_{$2}")

    return latex
}

// Process entire text line by line, converting math expressions
function processText(text: string): string {
    // If already has LaTeX, don't process
    if (/\$/.test(text)) {
        return text
    }

    let result = text

    // Find and wrap standalone math expressions
    // Pattern: sequences containing math-like content

    // Handle "Tích phân của x^n là nx^(n-1)" style
    const integralRulePattern = /(Tích phân của\s+)([^\s]+\s+là\s+[^\s]+)/gi
    result = result.replace(integralRulePattern, (_, prefix, mathPart) => {
        const parts = mathPart.split(/\s+là\s+/)
        if (parts.length === 2) {
            return `${prefix}$${convertExpressionToLatex(parts[0])}$ là $${convertExpressionToLatex(parts[1])}$`
        }
        return prefix + mathPart
    })

    // Handle function notations like f'(x), g(x), etc.
    result = result.replace(/([cfg])'?\(([^)]+)\)/g, (match) => {
        return `$${match}$`
    })

    // Handle expressions like "x^4 + 1/2x^3 - ln(x) + 7x"
    // Find sequences that look like polynomial expressions
    result = result.replace(
        /([a-z]\^\d+(?:\s*[+\-]\s*(?:\d+\/?\d*)?[a-z]?\^?\d*)+)/gi,
        (match) => `$${convertExpressionToLatex(match)}$`
    )

    // Handle standalone expressions with = sign
    // "∫x^4 dx = (x^5)/5 + C1" style
    const equationPattern = /(∫[^=]+)\s*=\s*([^,]+)/g
    result = result.replace(equationPattern, (_, left, right) => {
        const leftLatex = convertExpressionToLatex(left.replace(/\s*dx\s*$/i, "") + " \\, dx")
        const rightLatex = convertExpressionToLatex(right.trim())
        return `$${leftLatex} = ${rightLatex}$`
    })

    return result
}

// Parse a single line and extract/render LaTeX
function parseLine(text: string): React.ReactNode[] {
    const parts: React.ReactNode[] = []

    // First, process the text to convert math expressions
    const processedText = processText(text)

    // Match LaTeX: $$...$$ or $...$ or \[...\] or \(...\)
    const regex =
        /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$|\\\[[\s\S]*?\\\]|\\\(.*?\\\))/g

    let lastIndex = 0
    let match
    let key = 0

    while ((match = regex.exec(processedText)) !== null) {
        if (match.index > lastIndex) {
            parts.push(
                <span key={key++}>{processedText.slice(lastIndex, match.index)}</span>,
            )
        }

        const latex = match[0]

        try {
            if (latex.startsWith("$$") || latex.startsWith("\\[")) {
                const content = latex
                    .replace(/^\$\$|\$\$$/g, "")
                    .replace(/^\\\[|\\\]$/g, "")
                    .trim()
                parts.push(
                    <div key={key++} className="my-3 overflow-x-auto py-2">
                        <BlockMath math={content} />
                    </div>,
                )
            } else {
                const content = latex
                    .replace(/^\$|\$$/g, "")
                    .replace(/^\\\(|\\\)$/g, "")
                    .trim()
                parts.push(<InlineMath key={key++} math={content} />)
            }
        } catch {
            parts.push(<span key={key++}>{latex}</span>)
        }

        lastIndex = regex.lastIndex
    }

    if (lastIndex < processedText.length) {
        parts.push(<span key={key++}>{processedText.slice(lastIndex)}</span>)
    }

    return parts
}

// Format the complete response - simplified without step parsing or final answer box
function formatResponse(text: string): React.ReactNode {
    const lines = text.split("\n")
    const elements: React.ReactNode[] = []
    let key = 0

    for (const line of lines) {
        const trimmedLine = line.trim()

        // Keep empty lines as spacing
        if (!trimmedLine) {
            elements.push(<div key={key++} className="h-2" />)
            continue
        }

        // Handle headers (## or **)
        if (trimmedLine.startsWith("##") || trimmedLine.startsWith("**")) {
            const headerText = trimmedLine
                .replace(/^#{1,3}\s*/, "")
                .replace(/^\*\*|\*\*$/g, "")
                .trim()
            elements.push(
                <h3 key={key++} className="mt-4 mb-2 text-base font-semibold text-zinc-800">
                    {parseLine(headerText)}
                </h3>,
            )
            continue
        }

        // Handle list items (- or *)
        if (trimmedLine.startsWith("-") || (trimmedLine.startsWith("*") && !trimmedLine.startsWith("**"))) {
            const listText = trimmedLine.replace(/^[-*]\s*/, "").trim()
            elements.push(
                <div key={key++} className="mb-1 flex gap-2 text-zinc-700">
                    <span className="text-zinc-400">•</span>
                    <span>{parseLine(listText)}</span>
                </div>,
            )
            continue
        }

        // Regular content line
        elements.push(
            <div key={key++} className="mb-2 text-zinc-700 leading-relaxed">
                {parseLine(trimmedLine)}
            </div>,
        )
    }

    return <div className="space-y-1">{elements}</div>
}

export function MathOutput({
    response,
    modelUsed,
    isLoading,
    error,
}: MathOutputProps) {
    const outputRef = React.useRef<HTMLDivElement>(null)

    // Auto-scroll to output when response is ready
    React.useEffect(() => {
        if (response && outputRef.current) {
            outputRef.current.scrollIntoView({
                behavior: "smooth",
                block: "start",
            })
        }
    }, [response])

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
        )
    }

    if (isLoading) {
        return (
            <Card
                ref={outputRef}
                className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50"
            >
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <Spinner />
                        <div className="space-y-2">
                            <TextShimmer className="text-base" duration={1}>
                                Đang suy nghĩ để giải bài toán...
                            </TextShimmer>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!response) {
        return (
            <Card className="border-2 border-dashed border-zinc-200 bg-zinc-50/50">
                <CardContent className="pt-6">
                    <div className="py-8 text-center text-zinc-400">
                        <Bot className="mx-auto mb-3 h-12 w-12 opacity-50" />
                        <p className="font-medium">Kết quả sẽ hiển thị ở đây</p>
                        <p className="mt-1 text-sm">
                            Nhập bài toán và nhấn &quot;Giải ngay&quot; để bắt
                            đầu
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const modelLabel = modelUsed?.includes("spin")
        ? "Tuned Model"
        : "Base Model"
    const isFineTuned = modelUsed?.includes("spin")

    return (
        <Card
            ref={outputRef}
            className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg shadow-green-100/50"
        >
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-green-700">
                    <CheckCircle2 className="h-5 w-5" />
                    Lời giải
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="prose prose-zinc max-w-none text-base leading-relaxed">
                    {formatResponse(response)}
                </div>

                <div className="border-t border-green-200 pt-4">
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                        {isFineTuned ? (
                            <Sparkles className="h-4 w-4 text-green-500" />
                        ) : (
                            <Bot className="h-4 w-4 text-blue-500" />
                        )}
                        <span>
                            Model:{" "}
                            <span className="font-medium text-zinc-700">
                                {modelLabel}
                            </span>
                            {modelUsed && (
                                <span className="ml-1 text-xs opacity-60">
                                    ({modelUsed})
                                </span>
                            )}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
