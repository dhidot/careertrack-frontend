
// @vitest-environment jsdom

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { AuthProvider, useAuth } from "./auth-provider";
import { getSession } from "../lib/session-client";

vi.mock("../lib/session-client", () => ({
  getSession: vi.fn(),
}));

const getSessionMock = vi.mocked(getSession);

function SessionConsumer() {
  const { status, user } = useAuth();

  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="email">
        {user?.email ?? "none"}
      </span>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("loads an authenticated session", async () => {
    getSessionMock.mockResolvedValue({
      status: "authenticated",
      user: {
        id: "123e4567-e89b-42d3-a456-426614174000",
        username: "testuser",
        email: "user@example.com",
        roles: ["USER"],
        permissions: [],
      },
    });

    render(
      <AuthProvider>
        <SessionConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("status")
      ).toHaveTextContent("authenticated");
    });

    expect(
      screen.getByTestId("email")
    ).toHaveTextContent("user@example.com");

    expect(getSessionMock).toHaveBeenCalledTimes(1);
  });

  it("handles unauthenticated session", async () => {
    getSessionMock.mockResolvedValue({
      status: "unauthenticated",
    });

    render(
      <AuthProvider>
        <SessionConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("status")
      ).toHaveTextContent("unauthenticated");
    });

    expect(
      screen.getByTestId("email")
    ).toHaveTextContent("none");

    expect(getSessionMock).toHaveBeenCalledTimes(1);
  });

  it("handles unavailable session service", async () => {
    getSessionMock.mockResolvedValue({
      status: "unavailable",
    });

    render(
      <AuthProvider>
        <SessionConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("status")
      ).toHaveTextContent("unavailable");
    });

    expect(
      screen.getByTestId("email")
    ).toHaveTextContent("none");

    expect(getSessionMock).toHaveBeenCalledTimes(1);
  });

  it("rejects useAuth outside AuthProvider", () => {
    vi.spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      render(<SessionConsumer />);
    }).toThrow(
      "useAuth must be used inside AuthProvider"
    );
  });


it("starts with loading state", () => {
  getSessionMock.mockReturnValue(
    new Promise(() => {})
  );

  render(
    <AuthProvider>
      <SessionConsumer />
    </AuthProvider>
  );

  expect(
    screen.getByTestId("status")
  ).toHaveTextContent("loading");

  expect(
    screen.getByTestId("email")
  ).toHaveTextContent("none");
});

it("handles forbidden session", async () => {
  getSessionMock.mockResolvedValue({
    status: "forbidden",
  });

  render(
    <AuthProvider>
      <SessionConsumer />
    </AuthProvider>
  );

  await waitFor(() => {
    expect(
      screen.getByTestId("status")
    ).toHaveTextContent("forbidden");
  });

  expect(
    screen.getByTestId("email")
  ).toHaveTextContent("none");
});

it("refreshes session and updates identity", async () => {
  getSessionMock
    .mockResolvedValueOnce({
      status: "unauthenticated",
    })
    .mockResolvedValueOnce({
      status: "authenticated",
      user: {
        id: "123e4567-e89b-42d3-a456-426614174000",
        username: "testuser",
        email: "user@example.com",
        roles: ["USER"],
        permissions: [],
      },
    });

  function RefreshConsumer() {
    const { status, user, refreshSession } = useAuth();

    return (
      <div>
        <span data-testid="status">{status}</span>
        <span data-testid="email">
          {user?.email ?? "none"}
        </span>
        <button onClick={() => void refreshSession()}>
          Refresh session
        </button>
      </div>
    );
  }

  render(
    <AuthProvider>
      <RefreshConsumer />
    </AuthProvider>
  );

  await waitFor(() => {
    expect(
      screen.getByTestId("status")
    ).toHaveTextContent("unauthenticated");
  });

  fireEvent.click(
    screen.getByRole("button", {
      name: "Refresh session",
    })
  );

  await waitFor(() => {
    expect(
      screen.getByTestId("status")
    ).toHaveTextContent("authenticated");
  });

  expect(
    screen.getByTestId("email")
  ).toHaveTextContent("user@example.com");

  expect(getSessionMock).toHaveBeenCalledTimes(2);
});

});
