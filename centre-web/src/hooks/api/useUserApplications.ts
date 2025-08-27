import { centreRequest } from "@/utils/axiosUtils";
import { useMutation } from "@tanstack/react-query";
import { UserEpicAppData } from "@/models/EpicApp";
import { RequestOptions } from "./types";
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
