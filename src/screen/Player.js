import React, {Component} from 'react';
import {
    Button,
    CircularProgress,
    Container,
    createTheme,
    CssBaseline,
    Grid,
    Stack,
    TextField,
    ThemeProvider,
    Typography
} from "@mui/material";
import WebTorrent from "webtorrent";
import {DownloadForOffline, PlayCircleOutlined, StopCircleOutlined} from "@mui/icons-material";

const defaultTheme = createTheme();
const options = {
    typography: {
        fontSize: 12,
    },
    palette: {
        mode: 'dark',
        background: {
            default: "#303030",
            paper: "#121212"
        }
    },
    components: {
        MuiLinearProgress: {
            styleOverrides: {
                root: {
                    borderRadius: "10px"
                }
            }
        },
        MuiListItemButton: {
            styleOverrides: {
                root: {
                    borderRadius: "20px",
                    paddingLeft: "10px",
                    paddingRight: "10px",
                }
            }
        },
        MuiContainer: {
            styleOverrides: {
                root: {
                    paddingLeft: "0px",
                    paddingRight: "0px",
                    height: "100%",
                    [defaultTheme.breakpoints.up('xs')]: {
                        paddingLeft: "0px",
                        paddingRight: "0px",
                        paddingTop: "5px",
                    }
                },
            },
        },
    },
};

class Player extends Component {

    state = {
        files: null,
        theme: createTheme(options),
        localClient: new WebTorrent({destroyStoreOnDestroy: false}),
        magnet: "https://webtorrent.io/torrents/sintel.torrent",
        errorMessage: false,
        reproducing: false,
        loading: false
    }

    componentDidMount() {
        let {localClient} = this.state;
        localClient.on("error", (error) => {
            console.error("Error validating torrent: ", error)
            this.setState({errorMessage: "Invalid torrent/magnet/hash", loading: false})
        })
        if (window.location.search && window.location.search.includes("?magnet=")) {
            let magnet = window.location.search.substring(8, window.location.search.length);
            this.setState({
                magnet: magnet
            }, this.play)
        }
    }

    play = () => {
        let {localClient, magnet} = this.state
        this.setState({loading: true})
        localClient.add(magnet, null, (torrent) => {
            // Torrents can contain many files. Let's use the .mp4 file
            let files = torrent.files.filter((file) => {
                return file.name.endsWith('.mp4') || file.name.endsWith('.m4v') || file.name.endsWith('.webm')
            })
            // Display the file by adding it to the DOM. Supports video, audio, image, etc. files
            if (files && files.length > 0) {
                files[0].appendTo('div#PREDISPOSING', {maxBlobLength: 2066664530000}, (err, elem) => {
                    if (err) {
                        this.setState({errorMessage: "Error reproducing file " + files[0].name, loading: false})
                    } else {
                        torrent.on('download', (bytes) => {
                            this.setState({files: torrent.files})
                        })
                        this.setState({reproducing: true, loading: false, files: torrent.files})
                    }
                })

            } else {
                torrent.destroy();
                this.setState({errorMessage: "No streamable file", files: null})
            }
        })
    }

    render() {
        let {loading, theme, magnet, localClient, errorMessage, reproducing, files} = this.state;
        return (
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                <Container maxWidth="false">
                    <Stack justifyContent={"center"} spacing={2}>
                        <Stack
                            sx={{
                                width: "100%",
                                backgroundColor: "background.paper",
                                [defaultTheme.breakpoints.down('md')]: {
                                    display: "none",
                                }
                            }}
                            spacing={2}
                            direction={"row"}
                            alignItems={"center"}
                            justifyContent={"center"}>
                            <PlayCircleOutlined sx={{fontSize: 70}} color={"primary"}/>
                            <Typography variant={"h1"} color={"primary"}>Quix Player</Typography>
                        </Stack>
                        <Stack alignItems={"center"} spacing={2}>
                            {loading && <>
                                <Typography variant={"h4"}>Loading...</Typography>
                                <CircularProgress variant={"indeterminate"}/>
                            </>}
                            {!reproducing && !loading && <>
                                <Typography variant={"h4"}>Stream torrent directly in your browser</Typography>
                                <TextField
                                    id="magnet"
                                    label="Magnet"
                                    variant="filled"
                                    value={magnet}
                                    error={errorMessage}
                                    helperText={errorMessage && errorMessage}
                                    onChange={(e) => {
                                        let value = e.target.value;
                                        this.setState({
                                            magnet: value,
                                            errorMessage: false
                                        })
                                    }}
                                />
                                <Button
                                    disabled={magnet == null || magnet === ""}
                                    color={"primary"}
                                    variant={"contained"}
                                    startIcon={<PlayCircleOutlined/>}
                                    onClick={this.play}
                                >
                                    Play
                                </Button>
                            </>
                            }
                            <Stack sx={{maxWidth: "100%"}} component={"div"} id={"PREDISPOSING"}></Stack>
                            {files && <Grid container
                                            justifyContent="center"
                                            alignItems="center"
                                            spacing={2}
                            >
                                {files.map(file => {
                                    return <Grid item>
                                        <Button disabled={file.progress < 1} onClick={() => {
                                            file.getBlobURL((err, url) => {
                                                if (err) {
                                                    console.error("Error downloading file: ", err)
                                                }
                                                let link = document.createElement("a");
                                                link.href = url;
                                                link.download = file.name;
                                                document.body.appendChild(link);
                                                link.dispatchEvent(
                                                    new MouseEvent('click', {
                                                        bubbles: true,
                                                        cancelable: true,
                                                        view: window
                                                    })
                                                );
                                                document.body.removeChild(link);
                                            })
                                        }} variant={"contained"} color={"primary"}
                                                endIcon={<DownloadForOffline/>}>
                                            {file.name} ({Math.round(file.progress * 100)}%)
                                        </Button>
                                    </Grid>
                                })
                                }
                            </Grid>}
                            {reproducing && <Button
                                color={"primary"}
                                variant={"contained"}
                                startIcon={<StopCircleOutlined/>}
                                onClick={() => {
                                    localClient.torrents.forEach((torrent) => {
                                        localClient.remove(torrent.infoHash)
                                    })
                                    document.getElementById("PREDISPOSING").innerHTML = "";
                                    this.setState({reproducing: false, files: null})
                                }}
                            >
                                Cancel
                            </Button>}
                        </Stack>
                    </Stack>
                </Container>
            </ThemeProvider>
        );
    }
}

export default Player;
