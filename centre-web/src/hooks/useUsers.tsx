import { useMutation, useQuery } from "@tanstack/react-query";
import { OnErrorType, OnSuccessType, request } from "@/utils/axiosUtils";
import { User } from "@/models/User";

const fetchUsers = () => {
  return request({ url: "/users" });
};

const fetchUserById = (id: number) => {
  return request({ url: `/users/${id}` });
};

const addUser = (user: Omit<User, "id">) => {
  return request({ url: "/users", method: "post" , data: user});
};

const updateUser = (user: User) => {
  return request({ url: `/users/${user.id}`, method: "patch" , data: user});
};

const deleteUser = (id: number) => {
  return request({ url: `/users/${id}`, method: "delete" });
};

export const useUsersData = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });
};

export const useUserById = (userId: number) => {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUserById(userId),
    enabled: !!userId,
  });
};

export const useAddUser = (onSuccess: OnSuccessType, onError: OnErrorType) => {
  return useMutation({
    mutationFn: addUser,
    onSuccess,
    onError
  })
}

export const useUpdateUser = (onSuccess: OnSuccessType, onError: OnErrorType) => {
  return useMutation({
    mutationFn: updateUser,
    onSuccess,
    onError
  })
}

export const useDeleteUser = (onSuccess: OnSuccessType, onError: OnErrorType) => {
  return useMutation({
    mutationFn: deleteUser,
    onSuccess,
    onError
  })
}
