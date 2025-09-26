import { EpicApp } from "@/models/EpicApp";
import {
  Box,
  Button,
  ButtonProps,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { CentreLink } from "../Shared/CentreLink";
import { useModal } from "../Shared/Modals/modalStore";
import { AddBookmark } from "./AddBookmark";
import { BCDesignTokens } from "epic.theme";

const AddBookmarkButton = (props: ButtonProps) => {
  const { sx, ...otherProps } = props;
  return (
    <Button
      {...otherProps}
      sx={{
        ...(sx ?? {}),
        height: "32px",
        fontSize: "12px",
        padding: "12px 8px",
        color: BCDesignTokens.themePrimaryBlue,
        border: `2px solid ${BCDesignTokens.themePrimaryBlue}`,
      }}
    >
      Add/Edit Bookmarks
    </Button>
  );
};

type BookmarkSectionProps = {
  epicApp?: EpicApp;
};

export const BookmarkSection = ({ epicApp }: BookmarkSectionProps) => {
  const { setOpen: setModalOpen } = useModal();
  const handleAddEditBookmarks = () => {
    if (!epicApp) return;
    setModalOpen(<AddBookmark epicApp={epicApp} />);
  };

  const bookmarks = epicApp?.user?.bookmarks || [];

  return (
    <Box sx={{ width: "100%" }}>
      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        alignItems={"center"}
        width="100%"
        padding="8px 0"
      >
        <Typography variant="h5" fontWeight={400}>
          Bookmarks
        </Typography>
        <AddBookmarkButton color="secondary" onClick={handleAddEditBookmarks} />
      </Stack>
      <Box
        sx={{
          height: "97px",
        }}
      >
        <Stack direction={"column"} spacing={1}>
          {bookmarks && bookmarks.length > 0
            ? bookmarks.map((bookmark) => (
                <Tooltip title={bookmark.label} key={bookmark.label}>
                  <CentreLink
                    key={bookmark.label}
                    onClick={() => window.open(bookmark.url, "_blank")}
                  >
                    <Typography
                      variant="body1"
                      fontWeight={400}
                      color={"inherit"}
                      sx={{
                        overflow: "clip",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {bookmark.label}
                    </Typography>
                  </CentreLink>
                </Tooltip>
              ))
            : null}
        </Stack>
      </Box>
    </Box>
  );
};
