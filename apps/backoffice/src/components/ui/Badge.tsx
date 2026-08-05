import styled, { css } from "styled-components";

type BadgeType = "normal" | "circular" | "circularText";
type BadgeSize = "small" | "large";
type BadgeTone = "grayscale" | "accent" | "negative" | "solid" | "positive";

interface UIBadgeProps {
  type?: BadgeType;
  size?: BadgeSize;
  tone?: BadgeTone;
  label?: string;
}

const colorMap = {
  grayscale: css`
    background-color: ${({ theme }) => theme.Colors.Components.Translucent.Primary};
    color: ${({ theme }) => theme.Colors.Content.Standard.Secondary};
  `,
  accent: css`
    background-color: ${({ theme }) => theme.Colors.Core.Brand.Tertiary};
    color: ${({ theme }) => theme.Colors.Core.Brand.Primary};
  `,
  negative: css`
    background-color: ${({ theme }) => theme.Colors.Core.Status.Translucent.Negative};
    color: ${({ theme }) => theme.Colors.Core.Status.Negative};
  `,
  solid: css`
    background-color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
    color: ${({ theme }) => theme.Colors.Solid.White};
  `,
  positive: css`
    background-color: ${({ theme }) => theme.Colors.Core.Status.Translucent.Positive};
    color: ${({ theme }) => theme.Colors.Core.Status.Positive};
  `,
};

const Root = styled.span<Required<Pick<UIBadgeProps, "type" | "size" | "tone">>>`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  ${({ theme, type, size }) => {
    if (type === "circular") {
      return css`
        width: ${size === "large" ? "6px" : "4px"};
        height: ${size === "large" ? "6px" : "4px"};
        border-radius: 999px;
      `;
    }

    if (type === "circularText") {
      return css`
        width: ${size === "large" ? "20px" : "16px"};
        height: ${size === "large" ? "20px" : "16px"};
        border-radius: 999px;
        font-size: ${theme.Font.Caption.size};
        line-height: ${theme.Font.Caption.lineHeight};
        font-weight: ${theme.Font.Caption.weight.strong};
      `;
    }

    return css`
      min-height: ${size === "large" ? "22px" : "18px"};
      padding: 0 ${size === "large" ? theme.Component.Spacing[300] : theme.Component.Spacing[200]};
      border-radius: ${theme.Component.Radius[400]};
      font-size: ${theme.Font.Footnote.size};
      line-height: ${theme.Font.Footnote.lineHeight};
      font-weight: ${theme.Font.Footnote.weight.regular};
    `;
  }}

  ${({ tone }) => colorMap[tone]}
`;

export function UIBadge({
  type = "normal",
  size = "large",
  tone = "grayscale",
  label = "배지",
}: UIBadgeProps) {
  const content = type === "circular" ? null : label;
  return (
    <Root type={type} size={size} tone={tone}>
      {content}
    </Root>
  );
}
