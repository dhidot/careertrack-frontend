
import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";

const ACCESS_COOKIE = "careertrack_access";

const meResponseSchema = z.object({
  code: z.literal("200"),
  data: z.object({
    id: z.string().uuid(),
    username: z.string(),
    email: z.string(),
    roles: z.array(z.enum(["USER", "ADMIN"])),
    permissions: z.array(z.string()),
  }),
});

export type ServerSessionResult =
  | {
      status: "authenticated";
      user: z.infer<typeof meResponseSchema>["data"];
    }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "unavailable" };

function getGatewayEndpoint(): URL | null {
  const gatewayUrl = process.env.API_GATEWAY_URL;

  if (!gatewayUrl) {
    return null;
  }

  try {
    const baseUrl = new URL(gatewayUrl);

    if (
      !["http:", "https:"].includes(baseUrl.protocol) ||
      baseUrl.username ||
      baseUrl.password ||
      baseUrl.search ||
      baseUrl.hash
    ) {
      return null;
    }

    return new URL("/api/auth/me", baseUrl);
  } catch {
    return null;
  }
}

export async function getServerSession(): Promise<ServerSessionResult> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!accessToken) {
    return { status: "unauthenticated" };
  }

  const jwtPattern =
    /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

  if (!jwtPattern.test(accessToken)) {
    return { status: "unauthenticated" };
  }

  const endpoint = getGatewayEndpoint();

  if (!endpoint) {
    return { status: "unavailable" };
  }

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(12_000),
    });

    if (response.status === 401) {
      return { status: "unauthenticated" };
    }

    if (response.status === 403) {
      return { status: "forbidden" };
    }

    if (response.status !== 200) {
      return { status: "unavailable" };
    }

    const raw: unknown = await response
      .json()
      .catch(() => null);

    const parsed = meResponseSchema.safeParse(raw);

    if (!parsed.success) {
      return { status: "unavailable" };
    }

    const user = parsed.data.data;

    if (
      user.roles.length !== 1 ||
      user.roles[0] !== "USER"
    ) {
      return { status: "forbidden" };
    }

    return {
      status: "authenticated",
      user,
    };
  } catch {
    return { status: "unavailable" };
  }
}
