import { Bookmark, EpicApp } from "@/models/EpicApp";
import {
  Box,
  Divider,
  Grid,
  Typography,
  Button,
  Stack,
  IconButton,
} from "@mui/material";
import { FormProvider, useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import ControlledTextField from "../Shared/ControlledInput/ControlledTextField";
import { modalStyle } from "../Shared/Modals/constants";
import { useState } from "react";
import { useModal } from "../Shared/Modals/modalStore";
import { useUpdateBookmarks } from "@/hooks/api/useUserApplications";
import { LoadingButton } from "../Shared/LoadingButton";
import { useGetApplications } from "@/hooks/api/useApplications";
import { isAxiosError } from "axios";
import { notify } from "../Shared/Snackbar/snackbarStore";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

const bookmarkSchema = yup.object().shape({
  bookmarks: yup
    .array()
    .of(
      yup
        .object()
        .shape({
          url: yup.string().url("Enter a valid URL").nullable(),
          label: yup.string().nullable(),
        })
        .test(
          "url-label-required",
          "Both URL and Label are required if either is filled",
          function (value, context) {
            const urlFilled = !!value.url;
            const labelFilled = !!value.label;
            if ((urlFilled && !labelFilled) || (!urlFilled && labelFilled)) {
              return this.createError({
                path: `${context.path}.${urlFilled ? "label" : "url"}`,
                message: urlFilled
                  ? "Please enter a name for your link"
                  : "Please enter a URL",
              });
            }
            return true;
          },
        ),
    )
    .required(),
});

type BookmarkSchema = yup.InferType<typeof bookmarkSchema>;

const getDefaultValues = (bookmarks: Bookmark[] = []): BookmarkSchema => ({
  bookmarks:
    bookmarks.length === 3
      ? bookmarks.map((b) => ({ url: b.url || "", label: b.label || "" }))
      : [
          { url: bookmarks[0]?.url || "", label: bookmarks[0]?.label || "" },
          { url: bookmarks[1]?.url || "", label: bookmarks[1]?.label || "" },
          { url: bookmarks[2]?.url || "", label: bookmarks[2]?.label || "" },
        ],
});

type BookmarkFormProps = {
  epicApp: EpicApp;
};

const BookmarkForm = ({ epicApp }: BookmarkFormProps) => {
  const [isPending, setIsPending] = useState(false);
  const { setClose: setModalClose } = useModal();
  const methods = useForm({
    defaultValues: getDefaultValues(epicApp.user.bookmarks),
    resolver: yupResolver(bookmarkSchema),
    mode: "onSubmit",
  });

  const {
    handleSubmit,
    formState: { errors },
  } = methods;

  const { mutateAsync: updateBookmarks, isError } = useUpdateBookmarks();
  const { refetch } = useGetApplications();

  const onSubmit = async (data: BookmarkSchema) => {
    setIsPending(true);
    try {
      await updateBookmarks({
        app_id: epicApp.id,
        bookmarks: data.bookmarks,
      });
      await refetch();

      notify.success("Bookmarks updated successfully");
    } catch (error) {
      const defaultMessage = "Failed to update bookmarks";
      if (isError) {
        notify.error(defaultMessage);
      } else if (isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || defaultMessage;
        notify.error(errorMessage);
      } else {
        notify.error(defaultMessage);
      }
    } finally {
      setIsPending(false);
      setModalClose();
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        aria-label="Add or edit bookmarks form"
      >
        <Grid item container rowGap={"10px"}>
          {[0, 1, 2].map((idx) => (
            <Grid
              key={idx}
              item
              container
              columnSpacing={2}
              padding={"8px 0"}
              alignItems="flex-end"
              justifyContent={"center"}
            >
              <Grid item xs={12} md={6}>
                <ControlledTextField
                  name={`bookmarks.${idx}.url`}
                  label={`URL`}
                  fullWidth
                  error={!!errors.bookmarks?.[idx]?.url}
                  helperText={errors.bookmarks?.[idx]?.url?.message}
                  sx={{ marginBottom: 0 }}
                  inputProps={{ "aria-label": `Bookmark ${idx + 1} URL` }}
                />
              </Grid>
              <Grid item xs={12} md={5}>
                <ControlledTextField
                  name={`bookmarks.${idx}.label`}
                  label={`Link Name`}
                  fullWidth
                  error={!!errors.bookmarks?.[idx]?.label}
                  helperText={errors.bookmarks?.[idx]?.label?.message}
                  sx={{ marginBottom: 0 }}
                  inputProps={{ "aria-label": `Bookmark ${idx + 1} Link Name` }}
                />
              </Grid>
              <Grid item xs={12} md={1}>
                <IconButton
                  aria-label="Clear third bookmark"
                  onClick={() => {
                    methods.setValue(`bookmarks.${idx}.url`, "");
                    methods.setValue(`bookmarks.${idx}.label`, "");
                  }}
                  color="error"
                  sx={{ minWidth: 0, padding: "6px" }}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </Grid>
            </Grid>
          ))}{" "}
          <Grid item xs={12} container justifyContent="flex-end">
            <Stack direction="row" spacing={"8px"} mt="16px">
              <Button
                variant="outlined"
                onClick={() => setModalClose()}
                aria-label="Close bookmarks form"
              >
                Close
              </Button>
              <LoadingButton
                type="submit"
                variant="contained"
                loading={isPending}
                aria-label="Save bookmarks"
              >
                Save
              </LoadingButton>
            </Stack>
          </Grid>
        </Grid>
      </form>
    </FormProvider>
  );
};

type AddBookmark = {
  epicApp: EpicApp;
};
export const AddBookmark = ({ epicApp }: AddBookmark) => {
  return (
    <Box
      sx={{
        ...modalStyle,
        padding: "16px",
        width: "810px",
        overflowY: "none",
      }}
      aria-label={`${epicApp.name} Bookmarks Modal`}
    >
      <Grid container rowGap="10px">
        <Grid item xs={12}>
          <Typography
            variant="h3"
            aria-label={`${epicApp.name} Bookmarks Title`}
          >
            {epicApp.name} Bookmarks
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Divider
            sx={{
              width: "702px",
              backgroundColor: "#D1CFCD",
            }}
            aria-label="Bookmarks divider"
          />
        </Grid>
        <Grid item>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: "bold",
              mt: "16px",
            }}
            aria-label="Bookmarks instructions"
          >
            Add any link you would like to bookmark in the {epicApp.name} card.
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <BookmarkForm epicApp={epicApp} />
        </Grid>
      </Grid>
    </Box>
  );
};
