import { createFileRoute } from "@tanstack/react-router";

import {
  Box,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import { AxiosError, AxiosResponse } from "axios";
import { User } from "@/models/User";
import { useDeleteUser, useUsersData } from "@/hooks/useUsers";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import ConfirmationDialog from "@/components/Shared/Popups/ConfirmationDialog";
import CustomSnackbar, {
  SnackBarMessageProps,
} from "@/components/Shared/Popups/SnackBarMessage";
import UserModal from "@/components/App/Users/UserModal";

export const Route = createFileRoute("/_authenticated/users/")({
  component: UsersPage,
});

function UsersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState<number | null>(null);
  const [snackbarConfig, setSnackbarConfig] =
    useState<SnackBarMessageProps | null>(null);

  const { isLoading, data, isError, error } = useUsersData();

  const handleOnSubmit = () => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
    if (selectedUser) {
      setSnackbarConfig({ message: "User updated successfully!" });
    } else {
      setSnackbarConfig({ message: "User added successfully!" });
    }
    handleCloseModal();
  };

  const handleOpenModal = (user?: User) => {
    setSelectedUser(user || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  /** Delete user START */

  const onDeleteSuccess = () => {
    setSnackbarConfig({ message: "User deleted successfully!" });
    queryClient.invalidateQueries({
      queryKey: ["users"],
    });
  };

  const onDeleteError = (error: AxiosError) => {    
    setSnackbarConfig({ message: `User deletion failed! ${error.message}`, severity: "error" });
  };

  const { mutate: deleteUser } = useDeleteUser(onDeleteSuccess, onDeleteError);

  const handleDeleteUser = () => {
    setSnackbarConfig({ message: "" });
    if (userIdToDelete !== null) {
      deleteUser(userIdToDelete);
      setIsConfirmationOpen(false);
    }
  };

  const handleOpenConfirmationDialog = (userId: number) => {
    setUserIdToDelete(userId);
    setIsConfirmationOpen(true);
  };

  const handleCloseConfirmationDialog = () => {
    setIsConfirmationOpen(false);
    setUserIdToDelete(null);
  };

  /** Delete user END */

  const users: Array<User> = (data as AxiosResponse)?.data;

  if (isLoading) {
    return <h2>Loading...</h2>;
  }

  if (isError) {
    return <h2>{error.message}</h2>;
  }

  return (
    <>
      <Box
        display={"flex"}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        <h2>Users List</h2>
        <Button
          onClick={() => handleOpenModal()}
          variant="outlined"
          color="primary"
          sx={{ width: "160px" }}
        >
          Add New User
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table width={"100%"} aria-label="simple table" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>First name</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Last name</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Username</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
              <TableCell sx={{ fontWeight: "bold" }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((row: User) => (
              <TableRow
                key={row.id}
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                <TableCell component="th" scope="row">{row.first_name}</TableCell>
                <TableCell>{row.last_name}</TableCell>
                <TableCell>{row.username}</TableCell>
                <TableCell>{row.email_address}</TableCell>
                <TableCell align="right">
                  <IconButton
                    aria-label="edit"
                    color="primary"
                    onClick={() => handleOpenModal(row)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    aria-label="delete"
                    color="error"
                    onClick={() => handleOpenConfirmationDialog(row.id)}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <UserModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleOnSubmit}
        user={selectedUser}
      ></UserModal>
      <ConfirmationDialog
        isOpen={isConfirmationOpen}
        title="Delete User"
        description="Are you sure you want to delete this user?"
        onConfirm={handleDeleteUser}
        onCancel={handleCloseConfirmationDialog}
      />
      {snackbarConfig?.message && (
        <CustomSnackbar
          message={snackbarConfig.message}
          severity={snackbarConfig.severity}
        />
      )}
    </>
  );
}
