
import { NextResponse } from "next/server";

import { registerRequestSchema } from "@/features/auth/schemas/register-schema";

type BackendResponse = {
  code?: string;
  message?: string;
  data?: unknown;
};


export async function POST(request: Request) {
  console.log("[BFF REGISTER] Handler entered", {
    method: request.method,
    pathname: new URL(request.url).pathname,
  });
  // 1. Parse request body
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        message: "Invalid JSON request body",
      },
      { status: 400 }
    );
  }

  // 2. Validate payload
  const validation = registerRequestSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json(
      {
        message: "Invalid registration data",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  // 3. Resolve Gateway URL from server environment
  const gatewayUrl = process.env.API_GATEWAY_URL;

  if (!gatewayUrl) {
    return NextResponse.json(
      {
        message: "Registration service is not configured",
      },
      { status: 503 }
    );
  }

  try {
    // 4. Forward request to Spring Cloud Gateway
    const response = await fetch(
      new URL("/api/auth/register", gatewayUrl),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validation.data),
        cache: "no-store",
        signal: AbortSignal.timeout(12_000),
        redirect: "error",
      }
    );

    const result: BackendResponse | null =
      await response.json().catch(() => null);

    // 5. Successful registration
    if (response.status === 201) {
      // Do not expose backend data until
      // RegisterResponse contract is verified.
      return NextResponse.json(
        {
          code: "201",
          message: "Registration successful",
        },
        { status: 201 }
      );
    }

    // 6. Expected client errors from Auth Service
    if (response.status >= 400 && response.status < 500) {
      return NextResponse.json(
        {
          message:
            typeof result?.message === "string"
              ? result.message
              : "Registration failed. Please check your information.",
        },
        { status: response.status }
      );
    }

    // 7. Unexpected response or upstream server errors
    return NextResponse.json(
      {
        message: "Registration service is temporarily unavailable",
      },
      { status: 502 }
    );
  } catch (error) {
    const isTimeout =
      error instanceof Error &&
      (error.name === "TimeoutError" ||
        error.name === "AbortError");

    return NextResponse.json(
      {
        message: isTimeout
          ? "Registration request timed out"
          : "Unable to connect to registration service",
      },
      { status: isTimeout ? 504 : 503 }
    );
  }
}
