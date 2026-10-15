
/** @vitest-environment jsdom */

import type {
  MouseEventHandler,
  ReactNode,
} from "react";

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  act,
  cleanup,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";

// ==========================================
// MOCK NEXT.JS ROUTER
// ==========================================

const routerMocks = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: routerMocks.replace,
    refresh: routerMocks.refresh,
    push: routerMocks.push,
  }),
}));

import { LoginForm } from "./login-form";

// ==========================================
// MOCK NEXT.JS LINK
// ==========================================

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    onClick,
  }: {
    href: string;
    children: ReactNode;
    onClick?: MouseEventHandler<HTMLAnchorElement>;
  }) => (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
    >
      {children}
    </a>
  ),
}));

// RegistrationNotice has its own test suite.
vi.mock("./registration-notice", () => ({
  RegistrationNotice: () => null,
}));

// ==========================================
// MOCK FETCH
// ==========================================

const fetchMock = vi.fn<typeof fetch>();

function mockResponse(
  status: number,
  body: unknown
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

// ==========================================
// TEST HELPERS
// ==========================================

async function fillForm(
  user: ReturnType<typeof userEvent.setup>
) {
  await user.type(
    screen.getByLabelText("Email address"),
    "user@example.com"
  );

  await user.type(
    screen.getByLabelText("Password"),
    "Password123"
  );
}

async function clickSignIn(
  user: ReturnType<typeof userEvent.setup>
) {
  await user.click(
    screen.getByRole("button", {
      name: /^sign in/i,
    })
  );
}

const LOGIN_ERROR =
  "Invalid email or password. If you recently registered, please verify your email before signing in.";

// ==========================================
// LOGIN FORM TESTS
// ==========================================

describe("LoginForm", () => {
  beforeEach(() => {
    fetchMock.mockReset();

    routerMocks.replace.mockClear();
    routerMocks.refresh.mockClear();
    routerMocks.push.mockClear();

    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shows validation errors for empty fields", async () => {
    const user = userEvent.setup();

    render(<LoginForm />);

    await clickSignIn(user);

    await waitFor(() => {
      expect(
        screen.getByLabelText("Email address")
      ).toHaveAttribute("aria-invalid", "true");

      expect(
        screen.getByLabelText("Password")
      ).toHaveAttribute("aria-invalid", "true");
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(routerMocks.replace).not.toHaveBeenCalled();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();

    render(<LoginForm />);

    const password =
      screen.getByLabelText("Password");

    expect(password).toHaveAttribute(
      "type",
      "password"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Show password",
      })
    );

    expect(password).toHaveAttribute(
      "type",
      "text"
    );

    await user.click(
      screen.getByRole("button", {
        name: "Hide password",
      })
    );

    expect(password).toHaveAttribute(
      "type",
      "password"
    );
  });

  it("submits credentials and redirects to dashboard", async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValue(
      mockResponse(200, {
        code: "200",
        message: "Login success",
      })
    );

    render(<LoginForm />);

    await fillForm(user);
    await clickSignIn(user);

    await waitFor(() => {
      expect(routerMocks.replace).toHaveBeenCalledWith(
        "/dashboard"
      );
    });

    expect(routerMocks.replace).toHaveBeenCalledOnce();
    expect(routerMocks.refresh).not.toHaveBeenCalled();

    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, options] = fetchMock.mock.calls[0];

    expect(url).toBe("/api/v1/auth/login");
    expect(options?.method).toBe("POST");
    expect(options?.credentials).toBe("same-origin");

    expect(
      JSON.parse(String(options?.body))
    ).toEqual({
      email: "user@example.com",
      password: "Password123",
    });
  });

  it("shows HTTP 401 login error", async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValue(
      mockResponse(401, {
        code: "401",
        message: LOGIN_ERROR,
      })
    );

    render(<LoginForm />);

    await fillForm(user);
    await clickSignIn(user);

    expect(
      await screen.findByText(LOGIN_ERROR)
    ).toBeInTheDocument();

    expect(routerMocks.replace).not.toHaveBeenCalled();
  });

  it("clears stale login error when Create account is clicked", async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValue(
      mockResponse(401, {
        code: "401",
        message: LOGIN_ERROR,
      })
    );

    render(<LoginForm />);

    await fillForm(user);
    await clickSignIn(user);

    expect(
      await screen.findByText(LOGIN_ERROR)
    ).toBeInTheDocument();

    const createAccountLink =
      screen.getByRole("link", {
        name: "Create account",
      });

    expect(createAccountLink).toHaveAttribute(
      "href",
      "/register"
    );

    await user.click(createAccountLink);

    expect(
      screen.queryByText(LOGIN_ERROR)
    ).not.toBeInTheDocument();

    expect(
      screen.getByLabelText("Email address")
    ).toHaveValue("");

    expect(
      screen.getByLabelText("Password")
    ).toHaveValue("");

    expect(routerMocks.replace).not.toHaveBeenCalled();
  });

  it("clears stale error on browser history navigation", async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValue(
      mockResponse(401, {
        code: "401",
        message: LOGIN_ERROR,
      })
    );

    render(<LoginForm />);

    await fillForm(user);
    await clickSignIn(user);

    expect(
      await screen.findByText(LOGIN_ERROR)
    ).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(
        new PopStateEvent("popstate")
      );
    });

    expect(
      screen.queryByText(LOGIN_ERROR)
    ).not.toBeInTheDocument();
  });

  it("disables submission while awaiting backend", async () => {
    const user = userEvent.setup();

    let resolveFetch!: (response: Response) => void;

    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        })
    );

    render(<LoginForm />);

    await fillForm(user);
    await clickSignIn(user);

    const pendingButton =
      await screen.findByRole("button", {
        name: /signing in/i,
      });

    expect(pendingButton).toBeDisabled();

    await user.click(pendingButton);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(routerMocks.replace).not.toHaveBeenCalled();

    await act(async () => {
      resolveFetch(
        mockResponse(200, {
          code: "200",
          message: "Login success",
        })
      );
    });

    await waitFor(() => {
      expect(routerMocks.replace).toHaveBeenCalledWith(
        "/dashboard"
      );
    });
  });

  it("shows network error without redirect", async () => {
    const user = userEvent.setup();

    fetchMock.mockRejectedValue(
      new TypeError("fetch failed")
    );

    render(<LoginForm />);

    await fillForm(user);
    await clickSignIn(user);

    expect(
      await screen.findByText(
        "Unable to connect to the server. Please try again."
      )
    ).toBeInTheDocument();

    expect(routerMocks.replace).not.toHaveBeenCalled();
  });
});
