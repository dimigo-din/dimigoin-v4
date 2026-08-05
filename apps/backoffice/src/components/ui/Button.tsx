import type { ButtonHTMLAttributes, ReactNode } from "react";
import styled, { css } from "styled-components";
import { mobile } from "../../styles/media.ts";

export interface ButtonVariant {
  size?: "Large" | "Medium" | "Small";
  theme?: "Grayscale" | "Accent" | "Negative";
  style?: "Primary" | "Secondary";
  stretchWidth?: boolean;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  leadingArea?: ReactNode;
  trailingArea?: ReactNode;
}

const minMax = {
  Large: css`
    min-width: 56px;
    min-height: 56px;
    max-height: 56px;
  `,
  Medium: css`
    min-width: 46px;
    min-height: 46px;
    max-height: 46px;
  `,
  Small: css`
    min-width: 32px;
    min-height: 32px;
    max-height: 32px;
  `,
};
const gap = {
  Large: css`
    gap: ${({ theme }) => theme.Component.Spacing[200]};
  `,
  Medium: css`
    gap: ${({ theme }) => theme.Component.Spacing[150]};
  `,
  Small: css`
    gap: ${({ theme }) => theme.Component.Spacing[100]};
  `,
};
const padding = {
  // top&bottom left&right (invert Figma)
  Large: css`
    padding: ${({ theme }) => `${theme.Component.Spacing[400]} ${theme.Component.Spacing[500]}`};
  `,
  Medium: css`
    padding: ${({ theme }) => `${theme.Component.Spacing[300]} ${theme.Component.Spacing[400]}`};
  `,
  Small: css`
    padding: ${({ theme }) => `${theme.Component.Spacing[150]} ${theme.Component.Spacing[300]}`};
  `,
};
const borderRadius = {
  Large: css`
    border-radius: ${({ theme }) => theme.Component.Radius[400]};
  `,
  Medium: css`
    border-radius: ${({ theme }) => theme.Component.Radius[400]};
  `,
  Small: css`
    border-radius: ${({ theme }) => theme.Component.Radius[300]};
  `,
};

const colors = {
  Grayscale: {
    Primary: css`
      background-color: ${({ theme }) => theme.Colors.Components.Fill.Inverted.Primary};
      color: ${({ theme }) => theme.Colors.Content.Inverted.Primary};
    `,
    Secondary: css`
      background-color: ${({ theme }) => theme.Colors.Components.Translucent.Secondary};
      color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
    `,
  },
  Accent: {
    Primary: css`
      background-color: ${({ theme }) => theme.Colors.Core.Brand.Primary};
      color: ${({ theme }) => theme.Colors.Solid.White};
    `,
    Secondary: css`
      background-color: ${({ theme }) => theme.Colors.Core.Brand.Tertiary};
      color: ${({ theme }) => theme.Colors.Core.Brand.Primary};
    `,
  },
  Negative: {
    Primary: css`
      background-color: ${({ theme }) => theme.Colors.Core.Status.Negative};
      color: ${({ theme }) => theme.Colors.Solid.White};
    `,
    Secondary: css`
      background-color: ${({ theme }) => theme.Colors.Solid.Translucent.Red};
      color: ${({ theme }) => theme.Colors.Solid.Pink};
    `,
  },
};

const Root = styled.button<{
  $variant: Required<ButtonVariant>;
}>`
  display: inline-flex;
  width: ${({ $variant }) => ($variant.stretchWidth ? "100%" : "auto")};
  ${({ $variant }) => minMax[$variant.size]}
  align-items: center;
  justify-content: center;
  ${({ $variant }) => gap[$variant.size]}
  ${({ $variant }) => padding[$variant.size]}
  overflow: hidden;
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  ${({ $variant }) => borderRadius[$variant.size]}

  ${({ $variant }) => colors[$variant.theme][$variant.style]}


  font-size: ${({ theme }) => theme.Font.Callout.size};
  line-height: ${({ theme }) => theme.Font.Callout.lineHeight};
  font-weight: ${({ theme }) => theme.Font.Callout.weight.strong};

  transition: background-color 140ms ease, border-color 140ms ease, opacity 140ms ease;

  &:hover:not(:disabled) {
    filter: brightness(0.97);
  }

  &:active:not(:disabled) {
    filter: brightness(0.92);
  }


  ${mobile} {
    width: ${({ $variant }) => ($variant.stretchWidth ? "100%" : "auto")};
  }
`;

export function UIButton({
  variant,
  leadingArea, 
  children, 
  trailingArea, 
  ...props
}: ButtonProps) {
  return (
    <Root
      $variant={{
        size: "Medium",
        theme: "Accent",
        style: "Primary",
        stretchWidth: false,
        ...variant,
      }}
      {...props}
    >
      {leadingArea}
      <span>{children}</span>
      {trailingArea}
    </Root>
  );
}
