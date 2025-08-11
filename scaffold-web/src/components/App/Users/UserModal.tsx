import { useAddUser, useUpdateUser } from "@/hooks/useUsers";
import { User } from "@/models/User";
import { Save } from "@mui/icons-material";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";

type AddUserModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  user?: User | null;
};

const initFormData: Omit<User, "id"> = {
  first_name: "",
  last_name: "",
  username: "",
  email_address: "",
  contact_number: "",
  description: ""
};

const UserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  user,
}) => {
  const [formData, setFormData] = useState<Omit<User, "id">>(initFormData);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        username: user.username || "",
        email_address: user.email_address || "",
        contact_number: user.contact_number || "",
        description: user.description || "",
      });
    } else {
      setFormData(initFormData);
    }
  }, [user]);

  const onSuccess = () => {
    setFormData(initFormData);
    onSubmit();
  };

  const onError = (err: unknown) => {
    // eslint-disable-next-line no-console
    console.log(err);
  };

  const {
    mutate: addUser,
    isError,
    error,
    reset,
  } = useAddUser(onSuccess, onError);

  const { mutate: updateUser } = useUpdateUser(onSuccess, onError);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (user) {
      updateUser({ ...user, ...formData });
    } else {
      addUser(formData);
    }
  };

  const handleClose = () => {
    reset();
    setFormData(initFormData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose}>
      <DialogTitle fontWeight={"bold"}>Add New User</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {isError && <Alert severity="error">Error: {error?.message}</Alert>}
          <TextField
            label="First Name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Last Name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Email Address"
            name="email_address"
            value={formData.email_address}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Contact Number"
            name="contact_number"
            value={formData.contact_number}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions
          sx={{ paddingX: "1.5rem", paddingBottom: "1.25rem", paddingTop: "0" }}
        >
          <Button variant={"text"} onClick={handleClose}>
            Cancel
          </Button>
          <Button variant={"contained"} type="submit" startIcon={<Save />}>
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default UserModal;
