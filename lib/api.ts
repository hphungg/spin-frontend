const API_BASE_URL = "https://unwinking-sherwood-charmlessly.ngrok-free.dev"
const API_KEY = "LTrftQ4ZQ8BnMbKNEMw3TKIuG6LAPbK6GaOIdvJn4Wk"

export interface ChatRequest {
    message: string
    max_tokens?: number
    temperature?: number
    top_p?: number
}

export interface ChatResponse {
    response: string
    model_used: string
}

export type ModelType = "base" | "fine-tuned"

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "X-API-Key": API_KEY,
            "ngrok-skip-browser-warning": "true",
            ...options.headers,
        },
    })

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
}

export async function checkHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/health`, {
            headers: {
                "ngrok-skip-browser-warning": "true",
            },
        })
        return response.ok
    } catch {
        return false
    }
}

export async function chatWithBase(
    request: ChatRequest,
): Promise<ChatResponse> {
    return fetchWithAuth("/chat/base", {
        method: "POST",
        body: JSON.stringify({
            message: request.message,
            max_tokens: request.max_tokens ?? 512,
            temperature: request.temperature ?? 0.7,
            top_p: request.top_p ?? 0.9,
        }),
    })
}

export async function chatWithFineTuned(
    request: ChatRequest,
): Promise<ChatResponse> {
    return fetchWithAuth("/chat/fine-tuned", {
        method: "POST",
        body: JSON.stringify({
            message: request.message,
            max_tokens: request.max_tokens ?? 512,
            temperature: request.temperature ?? 0.7,
            top_p: request.top_p ?? 0.9,
        }),
    })
}

export async function solveMath(
    message: string,
    modelType: ModelType,
): Promise<ChatResponse> {
    const request: ChatRequest = { message }
    return modelType === "base"
        ? chatWithBase(request)
        : chatWithFineTuned(request)
}
