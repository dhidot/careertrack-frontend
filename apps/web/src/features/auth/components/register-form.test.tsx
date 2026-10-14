
/** @vitest-environment jsdom */

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

import { RegisterForm } from "./register-form";

// ==========================================
// MOCK NEXT.JS NAVIGATION
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

function mockResponse(
  status: number,
  data: unknown
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  } as Response;
}

// ==========================================
// TEST HELPERS
// ==========================================

async function fillValidForm(
  user: ReturnType<typeof userEvent.setup>
) {
  await user.type(
    screen.getByLabelText("Username"),
    "careertrackuser"
  );

  await user.type(
    screen.getByLabelText("Email address"),
    "careertrack@example.com"
  );

  await user.type(
    screen.getByLabelText("Password", {
      exact: true,
    }),
    "Password123"
  );

  await user.type(
    screen.getByLabelText("Confirm password"),
    "Password123"
  );
}

async function submitForm(
  user: ReturnType<typeof userEvent.setup>
) {
  await user.click(
    screen.getByRole("button", {
      name: /create account/i,
    })
  );
}

// ==========================================
// REGISTER FORM TESTS
// ==========================================

describe("RegisterForm", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    replaceMock.mockReset();

    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // ========================================
  // FORM VALIDATION
  // ========================================

  it("shows validation errors for invalid inputs", async () => {
    const user = userEvent.setup();

    render(<RegisterForm />);

    await submitForm(user);

    const username =
      screen.getByLabelText("Username");

    const email =
      screen.getByLabelText("Email address");

    await waitFor(() => {
      expect(username).toHaveAttribute(
        "aria-invalid",
        "true"
      );

      expect(email).toHaveAttribute(
        "aria-invalid",
        "true"
      );
    });

    expect(username).toHaveClass(
      "border-destructive"
    );

    expect(email).toHaveClass(
      "border-destructive"
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  // ========================================
  // REGISTRATION SUCCESS
  // ========================================

  it("submits only required fields and redirects after HTTP 201", async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValue(
      mockResponse(201, {
        code: "201",
        message: "Registration successful",
      })
    );

    render(<RegisterForm />);

    await fillValidForm(user);
    await submitForm(user);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        "/login?registered=1"
      );
    });

    expect(replaceMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, options] = fetchMock.mock.calls[0];

    expect(url).toBe(
      "/api/v1/auth/register"
    );

    expect(options?.method).toBe("POST");

    const payload = JSON.parse(
      String(options?.body)
    );

    expect(payload).toEqual({
      username: "careertrackuser",
      email: "careertrack@example.com",
      password: "Password123",
    });

    expect(payload).not.toHaveProperty(
      "confirmPassword"
    );

    expect(payload).not.toHaveProperty(
      "role"
    );
  });

  // ========================================
  // DUPLICATE EMAIL
  // ========================================

  it("shows duplicate email error without redirect", async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValue(
      mockResponse(409, {
        code: "409",
        message: "Email already registered",
      })
    );

    render(<RegisterForm />);

    await fillValidForm(user);
    await submitForm(user);

    expect(
      await screen.findByText(
        "Email already registered"
      )
    ).toBeInTheDocument();

    expect(replaceMock).not.toHaveBeenCalled();
  });

  // ========================================
  // LOADING & DUPLICATE SUBMISSION
  // ========================================

  it("disables submission while registration is pending", async () => {
    const user = userEvent.setup();

    let resolveFetch!: (response: Response) => void;

    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        })
    );

    render(<RegisterForm />);

    await fillValidForm(user);
    await submitForm(user);

    const pendingButton =
      await screen.findByRole("button", {
        name: /creating account/i,
      });

    expect(pendingButton).toBeDisabled();

    // A second click must not issue another request.
    await user.click(pendingButton);

    expect(fetchMock).toHaveBeenCalledOnce();

    await act(async () => {
      resolveFetch(
        mockResponse(201, {
          code: "201",
          message: "Registration successful",
        })
      );
    });

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith(
        "/login?registered=1"
      );
    });

    expect(replaceMock).toHaveBeenCalledOnce();
  });

  // ========================================
  // UNEXPECTED RESPONSE
  // ========================================

  it("does not redirect for unexpected HTTP 200", async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValue(
      mockResponse(200, {
        message: "Unexpected success",
      })
    );

    render(<RegisterForm />);

    await fillValidForm(user);
    await submitForm(user);

    expect(
      await screen.findByText(
        "Unexpected registration response. Please try again."
      )
    ).toBeInTheDocument();

    expect(replaceMock).not.toHaveBeenCalled();
  });

  // ========================================
  // NETWORK FAILURE
  // ========================================

  it("shows error without redirect when network fails", async () => {
    const user = userEvent.setup();

    fetchMock.mockRejectedValue(
      new TypeError("fetch failed")
    );

    render(<RegisterForm />);

    await fillValidForm(user);
    await submitForm(user);

    expect(
      await screen.findByText(
        "Unable to connect to the server. Please try again."
      )
    ).toBeInTheDocument();

    expect(replaceMock).not.toHaveBeenCalled();
  });
});
