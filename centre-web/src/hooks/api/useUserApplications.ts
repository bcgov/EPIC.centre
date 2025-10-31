import { centreRequest } from "@/utils/axiosUtils";
import { useMutation } from "@tanstack/react-query";
import { UserEpicAppData } from "@/models/EpicApp";
import { MutationRequestParams, RequestOptions } from "./types";
type UpdateBookmarkRequest = {
  app_id: number;
  bookmarks: any;
};

export const updateBookmarks = (data: UpdateBookmarkRequest) => {
  return centreRequest<UserEpicAppData>({
    url: `/user-applications/bookmarks`,
    method: "patch",
    data,
  });
};

export const useUpdateBookmarks = (options?: RequestOptions) => {
  return useMutation({
    mutationFn: (data: UpdateBookmarkRequest) => updateBookmarks(data),
    ...options,
  });
};

type UpdateSortOrderRequest = number[]; // payload is a list of epic app ids

export const updateSortOrder = (data: UpdateSortOrderRequest) => {
  return centreRequest<string>({
    url: `/user-applications/sort-order`,
    method: "patch",
    data,
  });
};

export const useUpdateSortOrder = (
  options?: MutationRequestParams<string, UpdateSortOrderRequest>,
) => {
  return useMutation<string, unknown, UpdateSortOrderRequest>({
    mutationFn: (data: UpdateSortOrderRequest) => updateSortOrder(data),
    ...options,
  });
};
