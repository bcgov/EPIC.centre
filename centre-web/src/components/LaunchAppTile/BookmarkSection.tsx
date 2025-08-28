import { EpicApp } from "@/models/EpicApp";
import { Box, Button, Stack, Tooltip, Typography } from "@mui/material";
import { CentreLink } from "../Shared/CentreLink";
import { useModal } from "../Shared/Modals/modalStore";
import { AddBookmark } from "./AddBookmark";

type BookmarkSectionProps = {
  epicApp?: EpicApp;
};

export const BookmarkSection = ({ epicApp }: BookmarkSectionProps) => {
  const { setOpen: setModalOpen } = useModal();

  const bookmarks = epicApp?.user?.bookmarks || [];

  const handleAddEditBookmarks = () => {
    if (!epicApp) return;
    setModalOpen(<AddBookmark epicApp={epicApp} />);
  };

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
        <Button color="secondary" onClick={handleAddEditBookmarks}>
          Add/Edit Bookmarks
        </Button>
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
