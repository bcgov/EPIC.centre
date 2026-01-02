import { EpicApp } from "@/models/EpicApp";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import { Circle } from "@mui/icons-material";
import { CentreLink } from "../Shared/CentreLink";
import { useModal } from "../Shared/Modals/modalStore";
import { AddBookmark } from "./AddBookmark";
import { CentreLinkProps } from "../Shared/CentreLink/type";

const AddBookmarkButton = (props: CentreLinkProps) => {
  const { sx, ...otherProps } = props;
  return (
    <CentreLink
      {...otherProps}
      sx={{
        ...(sx ?? {}),
        fontSize: "12px",
        minWidth: 0,
        textTransform: "none",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      Add/Edit Bookmarks
    </CentreLink>
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
    <Box id="bookmark-section" sx={{ width: "100%", padding: "12px 0 0 0" }}>
      <Stack
        direction={"row"}
        justifyContent={"space-between"}
        alignItems={"center"}
        width="100%"
      >
        <Typography
          variant="h6"
          fontWeight={400}
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
            flex: 1,
            marginRight: 1,
          }}
        >
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
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {bookmark.label && bookmark.label.length > 0 && (
                      <Circle
                        sx={{
                          marginRight: "5px",
                          fontSize: "7px",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <Typography
                      variant="body1"
                      fontWeight={400}
                      color={"inherit"}
                      sx={{
                        overflow: "hidden",
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
