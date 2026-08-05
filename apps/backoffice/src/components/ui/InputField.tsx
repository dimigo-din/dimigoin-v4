import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import styled from "styled-components";
import { UIControl } from "./Control";

type InputFieldType = "single" | "double";

interface UIInputFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  title?: string;
  subLabel?: string;
  fieldType?: InputFieldType;
  tags?: string[];
  onTagRemove?: (index: number) => void;
}

const FieldWrap = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.Component.Spacing[100]};
`;

const Label = styled.label`
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  font-size: ${({ theme }) => theme.Font.Footnote.size};
  line-height: ${({ theme }) => theme.Font.Footnote.lineHeight};
  font-weight: ${({ theme }) => theme.Font.Footnote.weight.regular};
`;

const Hint = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.Colors.Content.Standard.Secondary};
  font-size: ${({ theme }) => theme.Font.Caption.size};
  line-height: ${({ theme }) => theme.Font.Caption.lineHeight};
  font-weight: ${({ theme }) => theme.Font.Caption.weight.regular};
`;

const InputWrap = styled.div`
  width: 100%;
  min-height: 44px;
  border-radius: ${({ theme }) => theme.Component.Radius[400]};
  border: 1px solid ${({ theme }) => theme.Colors.Line.Outline};
  background-color: ${({ theme }) => theme.Colors.Background.Standard.Primary};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.Component.Spacing[100]};
  padding: 0 ${({ theme }) => theme.Component.Spacing[300]};

  &:focus-within {
    border-color: ${({ theme }) => theme.Colors.Core.Brand.Primary};
  }
`;

const NativeInput = styled.input`
  width: 100%;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  font-size: ${({ theme }) => theme.Font.Callout.size};
  line-height: ${({ theme }) => theme.Font.Callout.lineHeight};

  &::placeholder {
    color: ${({ theme }) => theme.Colors.Content.Standard.Tertiary};
  }

  &:focus {
    outline: none;
  }
`;

const ClearButton = styled.button`
  width: 20px;
  height: 20px;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.Colors.Content.Standard.Tertiary};
  font-size: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.Component.Spacing[100]};
`;

const Tag = styled.button`
  border: 1px solid ${({ theme }) => theme.Colors.Line.Outline};
  border-radius: ${({ theme }) => theme.Component.Radius[400]};
  background: ${({ theme }) => theme.Colors.Background.Standard.Primary};
  color: ${({ theme }) => theme.Colors.Content.Standard.Secondary};
  min-height: 32px;
  padding: 0 ${({ theme }) => theme.Component.Spacing[300]};
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.Component.Spacing[100]};
`;

export function UIInputField({
  title,
  subLabel,
  fieldType = "single",
  tags,
  onTagRemove,
  value,
  ...props
}: UIInputFieldProps) {
  const stringValue = typeof value === "string" ? value : "";

  return (
    <FieldWrap>
      {title ? <Label>{title}</Label> : null}
      <InputWrap>
        <NativeInput value={value} {...props} />
        {stringValue ? <ClearButton type="button">×</ClearButton> : null}
      </InputWrap>

      {fieldType === "double" && tags && tags.length > 0 ? (
        <TagRow>
          {tags.map((tag, index) => (
            <Tag key={`${tag}-${index}`} type="button" onClick={() => onTagRemove?.(index)}>
              {tag}
              <span>×</span>
            </Tag>
          ))}
        </TagRow>
      ) : null}

      {subLabel ? <Hint>{subLabel}</Hint> : null}
    </FieldWrap>
  );
}

interface UITextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  title?: string;
  subLabel?: string;
}

const TextareaWrap = styled(InputWrap)`
  align-items: flex-start;
  min-height: 112px;
  padding: ${({ theme }) => theme.Component.Spacing[300]};
`;

const NativeTextarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  resize: vertical;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  font-size: ${({ theme }) => theme.Font.Callout.size};
  line-height: ${({ theme }) => theme.Font.Callout.lineHeight};

  &::placeholder {
    color: ${({ theme }) => theme.Colors.Content.Standard.Tertiary};
  }

  &:focus {
    outline: none;
  }
`;

export function UITextAreaField({ title, subLabel, ...props }: UITextAreaFieldProps) {
  return (
    <FieldWrap>
      {title ? <Label>{title}</Label> : null}
      <TextareaWrap>
        <NativeTextarea {...props} />
      </TextareaWrap>
      {subLabel ? <Hint>{subLabel}</Hint> : null}
    </FieldWrap>
  );
}

interface UISelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  title?: string;
  subLabel?: string;
  options: { label: string; value: string }[];
}

const NativeSelect = styled.select`
  width: 100%;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  font-size: ${({ theme }) => theme.Font.Callout.size};
  line-height: ${({ theme }) => theme.Font.Callout.lineHeight};

  &:focus {
    outline: none;
  }
`;

export function UISelectField({ title, subLabel, options, ...props }: UISelectFieldProps) {
  return (
    <FieldWrap>
      {title ? <Label>{title}</Label> : null}
      <InputWrap>
        <NativeSelect {...props}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </NativeSelect>
      </InputWrap>
      {subLabel ? <Hint>{subLabel}</Hint> : null}
    </FieldWrap>
  );
}

interface UIToggleRowProps {
  label: string;
  checked: boolean;
  onChange?: () => void;
  disabled?: boolean;
}

const ToggleRowRoot = styled.button`
  width: 100%;
  border: 0;
  padding: ${({ theme }) => theme.Component.Spacing[200]} 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: ${({ theme }) => theme.Colors.Content.Standard.Primary};
  font-size: ${({ theme }) => theme.Font.Body.size};
  line-height: ${({ theme }) => theme.Font.Body.lineHeight};
  text-align: left;
`;

export function UIToggleRow({ label, checked, onChange, disabled }: UIToggleRowProps) {
  return (
    <ToggleRowRoot type="button" onClick={onChange}>
      {label}
      <UIControl controlType="toggle" checked={checked} disabled={disabled} />
    </ToggleRowRoot>
  );
}
