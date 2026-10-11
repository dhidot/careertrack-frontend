
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
    screen.getByLabelText("Password", { exact: true }),
    "Password123"
  );

  await user.type(
    screen.getByLabelText("Confirm password"),
    "Password123"
  );
}

describe("RegisterForm", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shows validation errors and red border on invalid submit", async () => {
    const user = userEvent.setup();

    render(<RegisterForm />);

    await user.click(
      screen.getByRole("button", {
        name: /create account/i,
      })
    );

    const username = screen.getByLabelText("Username");
    const email = screen.getByLabelText("Email address");

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

    expect(username).toHaveClass("border-destructive");
    expect(email).toHaveClass("border-destructive");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits only backend-required fields", async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValue(
      mockResponse(201, {
        code: "201",
        message: "Registration successful",
      })
    );

    render(<RegisterForm />);

    await fillValidForm(user);

    await user.click(
      screen.getByRole("button", {
        name: /create account/i,
      })
    );

    expect(
      await screen.findByText(
        "Account created successfully!"
      )
    ).toBeInTheDocument();

    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, options] = fetchMock.mock.calls[0];

    expect(url).toBe("/api/v1/auth/register");
    expect(options?.method).toBe("POST");

    const payload = JSON.parse(String(options?.body));

    expect(payload).toEqual({
      username: "careertrackuser",
      email: "careertrack@example.com",
      password: "Password123",
    });

    expect(payload).not.toHaveProperty(
      "confirmPassword"
    );

    expect(payload).not.toHaveProperty("role");
  });

  it("shows backend duplicate email error", async () => {
    const user = userEvent.setup();

    fetchMock.mockResolvedValue(
      mockResponse(409, {
        message: "Email already registered",
      })
    );

    render(<RegisterForm />);

    await fillValidForm(user);

    await user.click(
      screen.getByRole("button", {
        name: /create account/i,
      })
    );

    expect(
      await screen.findByText(
        "Email already registered"
      )
    ).toBeInTheDocument();

    expect(
      screen.queryByText(
        "Account created successfully!"
      )
    ).not.toBeInTheDocument();
  });

  it("disables submit button while registration is pending", async () => {
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

    await user.click(
      screen.getByRole("button", {
        name: /create account/i,
      })
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: /creating account/i,
        })
      ).toBeDisabled();
    });

    await act(async () => {
      resolveFetch(
        mockResponse(201, {
          code: "201",
          message: "Registration successful",
        })
      );
    });

    expect(
      await screen.findByText(
        "Account created successfully!"
      )
    ).toBeInTheDocument();
  });
});
