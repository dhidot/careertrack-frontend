
/** @vitest-environment jsdom */
/** @vitest-environment-options {"url":"http://localhost:3000/verify-email"} */

import { StrictMode } from "react";

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { VerifyEmailFlow } from "./verify-email-flow";

// ==========================================
// MOCK NEXT.JS ROUTER
// ==========================================

const { replaceMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

// ==========================================
// MOCK FETCH
// ==========================================

const fetchMock = vi.fn<typeof fetch>();

const VALID_TOKEN = "A".repeat(43);

function mockResponse(
  status: number,
  body: unknown
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function setVerificationUrl(
  token?: string
) {
  const url = token
    ? `/verify-email#token=${token}`
    : "/verify-email";

  window.history.replaceState(
    {},
    "",
    url
  );
}

// ==========================================
// TESTS
// ==========================================

describe("VerifyEmailFlow", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    replaceMock.mockReset();

    vi.stubGlobal("fetch", fetchMock);

    setVerificationUrl();
  });

  afterEach(() => {
    cleanup();

    vi.unstubAllGlobals();
    vi.restoreAllMocks();

    setVerificationUrl();
  });

  // ========================================
  // 1. MISSING TOKEN
  // ========================================

  it("shows missing token state without calling API", async () => {
    render(<VerifyEmailFlow />);

    expect(
      await screen.findByRole("heading", {
        name: "Verification token missing",
      })
    ).toBeInTheDocument();

    expect(fetchMock).not.toHaveBeenCalled();

    expect(replaceMock).not.toHaveBeenCalled();
  });

  // ========================================
  // 2. INVALID TOKEN FORMAT
  // ========================================

  it("rejects invalid token format before calling API", async () => {
    setVerificationUrl("invalid-token");

    render(<VerifyEmailFlow />);

    expect(
      await screen.findByRole("heading", {
        name: "Verification link unavailable",
      })
    ).toBeInTheDocument();

    expect(fetchMock).not.toHaveBeenCalled();

    expect(window.location.hash).toBe("");
  });

  // ========================================
  // 3. AUTOMATIC VERIFICATION
  // ========================================

  it("automatically verifies and redirects to login", async () => {
    setVerificationUrl(VALID_TOKEN);

    fetchMock.mockResolvedValue(
      mockResponse(200, {
        code: "200",
        message: "Email verified successfully",
      })
    );

    render(<VerifyEmailFlow />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        "/login?verified=1"
      );
    });

    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, options] =
      fetchMock.mock.calls[0];

    expect(url).toBe(
      "/api/v1/auth/verify-email"
    );

    expect(options?.method).toBe("POST");

    expect(options?.credentials).toBe(
      "same-origin"
    );

    expect(
      JSON.parse(String(options?.body))
    ).toEqual({
      token: VALID_TOKEN,
    });

    expect(window.location.hash).toBe("");

    expect(
      screen.getByRole("heading", {
        name: "Email verified successfully!",
      })
    ).toBeInTheDocument();
  });

  // ========================================
  // 4. LOADING STATE
  // ========================================


    it("shows loading while verification is pending", async () => {
    setVerificationUrl(VALID_TOKEN);

    let resolveFetch:
        | ((response: Response) => void)
        | undefined;

    fetchMock.mockImplementation(
        () =>
        new Promise<Response>((resolve) => {
            resolveFetch = resolve;
        })
    );

    render(<VerifyEmailFlow />);

    // Initial loading state should be visible.
    expect(
        screen.getByRole("heading", {
        name: "Verifying your email...",
        })
    ).toBeInTheDocument();

    expect(
        screen.getByRole("region", {
        name: "Email verification status",
        })
    ).toHaveAttribute("aria-busy", "true");

    // Wait until the deferred microtask starts fetch().
    await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledOnce();
    });

    // Token must already be removed from the URL.
    expect(window.location.hash).toBe("");

    // Verify that the pending fetch has a resolver.
    expect(resolveFetch).toBeDefined();

    // Complete the pending verification request.
    await act(async () => {
        resolveFetch?.(
        mockResponse(200, {
            code: "200",
            message: "Email verified successfully",
        })
        );
    });

    // Successful verification redirects automatically.
    await waitFor(() => {
        expect(replaceMock).toHaveBeenCalledWith(
        "/login?verified=1"
        );
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    });


  // ========================================
  // 5. INVALID OR EXPIRED TOKEN
  // ========================================

  it("shows invalid or expired state for HTTP 400", async () => {
    setVerificationUrl(VALID_TOKEN);

    fetchMock.mockResolvedValue(
      mockResponse(400, {
        code: "400",
        message:
          "Invalid or expired verification token",
      })
    );

    render(<VerifyEmailFlow />);

    expect(
      await screen.findByRole("heading", {
        name: "Verification link unavailable",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /invalid, expired, or has already been used/i
      )
    ).toBeInTheDocument();

    expect(replaceMock).not.toHaveBeenCalled();

    expect(
      screen.queryByRole("button", {
        name: "Try verification again",
      })
    ).not.toBeInTheDocument();
  });

  // ========================================
  // 6. NETWORK ERROR
  // ========================================

  it("shows retry action after network failure", async () => {
    setVerificationUrl(VALID_TOKEN);

    fetchMock.mockRejectedValue(
      new TypeError("fetch failed")
    );

    render(<VerifyEmailFlow />);

    expect(
      await screen.findByRole("heading", {
        name: "Unable to verify your email",
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Try verification again",
      })
    ).toBeInTheDocument();

    expect(replaceMock).not.toHaveBeenCalled();
  });

  // ========================================
  // 7. RETRY NETWORK ERROR
  // ========================================

  it("retries verification without requiring token in URL", async () => {
    setVerificationUrl(VALID_TOKEN);

    fetchMock
      .mockRejectedValueOnce(
        new TypeError("fetch failed")
      )
      .mockResolvedValueOnce(
        mockResponse(200, {
          code: "200",
          message: "Email verified successfully",
        })
      );

    render(<VerifyEmailFlow />);

    const retryButton = await screen.findByRole(
      "button",
      {
        name: "Try verification again",
      }
    );

    expect(window.location.hash).toBe("");

    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        "/login?verified=1"
      );
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);

    const firstBody = JSON.parse(
      String(fetchMock.mock.calls[0][1]?.body)
    );

    const secondBody = JSON.parse(
      String(fetchMock.mock.calls[1][1]?.body)
    );

    expect(firstBody).toEqual({
      token: VALID_TOKEN,
    });

    expect(secondBody).toEqual({
      token: VALID_TOKEN,
    });
  });

  // ========================================
  // 8. REACT STRICT MODE
  // ========================================

  it("does not duplicate request during Strict Mode effect replay", async () => {
    setVerificationUrl(VALID_TOKEN);

    fetchMock.mockResolvedValue(
      mockResponse(200, {
        code: "200",
        message: "Email verified successfully",
      })
    );

    render(
      <StrictMode>
        <VerifyEmailFlow />
      </StrictMode>
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        "/login?verified=1"
      );
    });

    expect(fetchMock).toHaveBeenCalledOnce();

    expect(replaceMock).toHaveBeenCalledOnce();
  });
});
