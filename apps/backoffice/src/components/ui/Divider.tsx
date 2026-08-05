import styled, { css } from "styled-components";

type DividerSize = "Large" | "Medium" | "Small";

interface UIDividerProps {
  size?: DividerSize;
}

const sizeMap = {
  Large: css`
    height: 8px;
  `,
  Medium: css`
    height: 4px;
  `,
  Small: css`
    height: 1px;
  `,
};

const Root = styled.hr<{ $size: DividerSize }>`
  width: 100%;
  border: 0;
  margin: 0;
  background-color: ${({ theme }) => theme.Colors.Line.Divider};
  ${({ $size }) => sizeMap[$size]}
`;

export function UIDivider({ size = "Small" }: UIDividerProps) {
  return <Root $size={size} />;
}
