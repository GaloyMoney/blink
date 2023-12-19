import React from "react";
import { Story } from "@storybook/react";
import { Button, ButtonProps } from "./button";

export default {
  component: Button,
  title: "Button",
};

export const Template: Story<ButtonProps> = (args) => (
  <Button {...args}>Button</Button>
);
