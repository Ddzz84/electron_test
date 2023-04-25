import { Box, Grid, CssBaseline, ThemeProvider, Button } from "@mui/material";
import React from "react";
import { ipcRenderer } from "electron";
import theme from "../theme";

export default function App(): JSX.Element {
  ipcRenderer.on("app-path", (event, appDirPath) => {
    // eslint-disable-next-line no-console
    console.log(event, appDirPath);
  });
  return (
    // Setup theme and css baseline for the Material-UI app
    // https://mui.com/customization/theming/
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          backgroundColor: (theme) => theme.palette.background.default,
          padding: "0.1rem 1rem",
        }}
      >
        <main>
          <Grid container spacing={1}>
            <Grid
              item
              xs={3}
              sx={{ borderRight: "1px solid #afafaf", height: "100vh" }}
            >
              <Box>
                <div>no folder set</div>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    ipcRenderer.send("selectDirectory");
                    // eslint-disable-next-line no-console
                    //console.log({ dir });
                  }}
                >
                  Open folder
                </Button>
              </Box>
            </Grid>
            <Grid item xs={9}>
              <Box>xs=8</Box>
            </Grid>
          </Grid>
        </main>
      </Box>
    </ThemeProvider>
  );
}
