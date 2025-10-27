import { centreRequest } from "@/utils/axiosUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEY } from "./constants";
import { UserSettings } from "@/models/UserSettings";

const getUserSettings = () => {
  return centreRequest<UserSettings>({
    url: `user-settings`,
  });
};

export const useGetUserSettings = () => {
  return useQuery({
    queryKey: [QUERY_KEY.USER_SETTINGS],
    queryFn: getUserSettings,
  });
};

const updateCardPositions = (cardPositions: Record<string, number>) => {
  return centreRequest<UserSettings>({
    url: `user-settings/card-positions`,
    method: "PUT",
    data: { card_positions: cardPositions },
  });
};

export const useUpdateCardPositions = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateCardPositions,
    retry: 3,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY.USER_SETTINGS] });
    },
  });
};

const updateSettings = (settings: Record<string, any>) => {
  return centreRequest<UserSettings>({
    url: `user-settings/settings`,
    method: "PUT",
    data: { settings },
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY.USER_SETTINGS] });
    },
  });
};

