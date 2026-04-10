import React from "react";
import { render, screen } from "@testing-library/react-native";
import { Button } from "./index";

describe("Button component", () => {
  it("should render with the correct title", () => {
    const title = "Click me";
    render(<Button title={title} />);

    const buttonText = screen.getByText(title);
    expect(buttonText).toBeTruthy();
  });
});
