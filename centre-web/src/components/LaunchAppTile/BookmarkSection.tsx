import { Bookmark } from "@/models/EpicApp";
import { Box, Button, Stack, Typography } from "@mui/material";
import { CentreLink } from "../Shared/CentreLink";

type BookmarkSectionProps = {
  bookmarks: Array<Bookmark>;
};

export const BookmarkSection = ({ bookmarks }: BookmarkSectionProps) => {
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
        <Button color="secondary">Add/Edit Bookmarks</Button>
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
