import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Card, CardTitle, CardContent } from "./card";

describe("CareerTrack Shared UI", () => {
  it("renders Button correctly", () => {
    render(<Button>Login</Button>);

    expect(
      screen.getByRole("button", { name: "Login" })
    ).toBeInTheDocument();
  });

  it("handles Button click", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <Button onClick={handleClick}>
        Login
      </Button>
    );

    await user.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders accessible Input with Label", () => {
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" />
      </>
    );

    expect(
      screen.getByRole("textbox", { name: "Email" })
    ).toHaveAttribute("type", "email");
  });

  it("renders Card content", () => {
    render(
      <Card>
        <CardTitle>CareerTrack Login</CardTitle>
        <CardContent>Welcome back</CardContent>
      </Card>
    );

    expect(
      screen.getByText("CareerTrack Login")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Welcome back")
    ).toBeInTheDocument();
  });
});