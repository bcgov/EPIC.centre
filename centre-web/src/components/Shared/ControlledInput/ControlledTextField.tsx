import React, { FC } from "react";
import { TextField, TextFieldProps } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form";
import { BCDesignTokens } from "epic.theme";

type IFormInputProps = {
  name: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputEffects?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => string;
  maxLength?: number;
} & TextFieldProps;

const ControlledTextField: FC<IFormInputProps> = ({
  name,
  inputEffects,
  maxLength,
  onChange: onInputChange,
  inputProps,
  ...otherProps
}) => {
  const {
    control,
    formState: { defaultValues },
  } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      defaultValue={defaultValues?.[name] ?? ""}
      // fieldState resolves nested names like "bookmarks.0.url"
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          onChange={(e) => {
            if (onInputChange) {
              onInputChange(e);
            }
            if (inputEffects) {
              e.target.value = inputEffects(e);
            }
            field.onChange(e.target.value);
          }}
          error={!!error}
          FormHelperTextProps={{
            sx: { color: BCDesignTokens.typographyColorDanger },
          }}
          helperText={error?.message ?? " "}
          {...otherProps}
          inputProps={{ maxLength, ...inputProps }}
        />
      )}
    />
  );
};

export default ControlledTextField;
