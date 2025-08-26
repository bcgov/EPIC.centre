import { Bookmark } from "@/models/EpicApp";
import { Box, Button, Stack, Typography } from "@mui/material";
import { CentreLink } from "../Shared/CentreLink";
import { useModal } from "../Modals/modalStore";
import { AddBookmark } from "./AddBookmark";

type BookmarkSectionProps = {
  bookmarks: Array<Bookmark>;
  name: string;
};

export const BookmarkSection = ({ bookmarks, name }: BookmarkSectionProps) => {
  const { setOpen: setModalOpen } = useModal();

  const handleAddEditBookmarks = () => {
    setModalOpen(<AddBookmark app_name={name} bookmarks={bookmarks} />);
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
                <CentreLink
                  key={bookmark.label}
                  onClick={() => window.open(bookmark.url, "_blank")}
                >
                  <Typography
                    variant="body1"
                    fontWeight={400}
                    color={"inherit"}
                  >
                    {bookmark.label}
                  </Typography>
                </CentreLink>
              ))
            : null}
        </Stack>
      </Box>
    </Box>
  );
};
