import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@mui/material';

type ConfirmationDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({ isOpen, title, description, onConfirm, onCancel }) => {
  return (
    <Dialog open={isOpen} onClose={onCancel}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{padding: '1rem'}}>
        <Button onClick={onCancel} color="primary">Cancel</Button>
        <Button variant='contained' onClick={onConfirm} color="error">Confirm</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;
