import { Bookmark } from "@/models/EpicApp";
import { Box, Divider, Grid, Typography, Button, Stack } from "@mui/material";
import { FormProvider, useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import ControlledTextField from "../Shared/ControlledInput/ControlledTextField";
import { modalStyle } from "../Modals/constants";
import { useEffect } from "react";
import { useModal } from "../Modals/modalStore";

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
                  ? "Label is required if the URL is filled"
                  : "URL is required if the Link Name is filled",
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
  bookmarks: Bookmark[];
};

const BookmarkForm = ({ bookmarks }: BookmarkFormProps) => {
  const { setClose: setModalClose } = useModal();
  const methods = useForm({
    defaultValues: getDefaultValues(bookmarks),
    resolver: yupResolver(bookmarkSchema),
    mode: "onSubmit",
  });

  const {
    handleSubmit,
    formState: { errors },
  } = methods;

  useEffect(() => {
    if (errors) {
      console.log("Form errors:", errors);
    }
  }, [errors]);

  const onSubmit = (data: BookmarkSchema) => {
    // handle form submission
    console.log(data);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid item container rowGap={"10px"}>
          {[0, 1, 2].map((idx) => (
            <Grid item container columnSpacing={2} key={idx} padding={"8px 0"}>
              <Grid item xs={12} md={6} key={idx}>
                <ControlledTextField
                  name={`bookmarks.${idx}.url`}
                  label={`URL`}
                  fullWidth
                  error={!!errors.bookmarks?.[idx]?.url}
                  helperText={errors.bookmarks?.[idx]?.url?.message}
                  sx={{ marginBottom: 0 }}
                />
              </Grid>
              <Grid item xs={12} md={6} key={idx}>
                <ControlledTextField
                  name={`bookmarks.${idx}.label`}
                  label={`Link Name`}
                  fullWidth
                  error={!!errors.bookmarks?.[idx]?.label}
                  helperText={errors.bookmarks?.[idx]?.label?.message}
                  sx={{ marginBottom: 0 }}
                />
              </Grid>
            </Grid>
          ))}{" "}
          <Grid item xs={12} container justifyContent="flex-end">
            <Stack direction="row" spacing={"8px"} mt="16px">
              <Button variant="outlined" onClick={() => setModalClose()}>
                Close
              </Button>
              <Button type="submit" variant="contained">
                Save
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </form>
    </FormProvider>
  );
};

type AddBookmark = {
  app_name: string;
  bookmarks: Bookmark[];
};
export const AddBookmark = ({ app_name, bookmarks }: AddBookmark) => {
  return (
    <Box
      sx={{
        ...modalStyle,
        padding: "16px",
        width: "810px",
        overflowY: "none",
      }}
    >
      <Grid container rowGap="10px">
        <Grid item xs={12}>
          <Typography variant="h3">{app_name} Bookmarks</Typography>
        </Grid>
        <Grid item xs={12}>
          <Divider
            sx={{
              width: "702px",
              backgroundColor: "#D1CFCD",
            }}
          />
        </Grid>
        <Grid item>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: "bold",
              mt: "16px",
            }}
          >
            Add any link you would like to bookmark in the {app_name} card.
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <BookmarkForm bookmarks={bookmarks} />
        </Grid>
      </Grid>
    </Box>
  );
};
