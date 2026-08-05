import type { HTMLAttributes } from "react";
import styled, { css } from "styled-components";

type TextVariant =
  | "display"
  | "title"
  | "headline"
  | "body"
  | "callout"
  | "footnote"
  | "caption"
  | "paragraphLarge"
  | "paragraphSmall";

type TextWeight = "weak" | "regular" | "strong";

type TextColor = "primary" | "secondary" | "tertiary" | "quaternary";

interface TextProps extends HTMLAttributes<HTMLElement> {
  variant?: TextVariant;
  weight?: TextWeight;
  color?: TextColor;
  as?: "span" | "p" | "label" | "strong" | "h1" | "h2" | "h3";
}

const variantMap: Record<TextVariant, keyof import("styled-components").DefaultTheme["Font"]> = {
  display: "Display",
  title: "Title",
  headline: "Headline",
  body: "Body",
  callout: "Callout",
  footnote: "Footnote",
  caption: "Caption",
  paragraphLarge: "Paragraph_Large",
  paragraphSmall: "Paragraph_Small",
};

const colorMap: Record<TextColor, "Primary" | "Secondary" | "Tertiary" | "Quaternary"> = {
  primary: "Primary",
  secondary: "Secondary",
  tertiary: "Tertiary",
  quaternary: "Quaternary",
};

const StyledText = styled.span<Required<Pick<TextProps, "variant" | "weight" | "color">>>`
  margin: 0;
  color: ${({ theme, color }) => theme.Colors.Content.Standard[colorMap[color]]};

  ${({ theme, variant, weight }) => {
    const token = theme.Font[variantMap[variant]];
    return css`
      font-size: ${token.size};
      line-height: ${token.lineHeight};
      font-weight: ${token.weight[weight]};
      letter-spacing: -0.02em;
    `;
  }}
`;

export function Text({
  variant = "body",
  weight = "regular",
  color = "primary",
  ...props
}: TextProps) {
  return <StyledText variant={variant} weight={weight} color={color} {...props} />;
}
