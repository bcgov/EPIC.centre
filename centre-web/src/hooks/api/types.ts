import { DefinedInitialDataOptions } from "@tanstack/react-query";

export type RequestOptions<TData = any> = {
  onSuccess?: (data?: TData) => void;
  onError?: (error?: Error) => void;
  onSettled?: (data?: TData) => void;
};

export type QueryRequestParams<TData = any> = Partial<
  DefinedInitialDataOptions<TData>
>;
