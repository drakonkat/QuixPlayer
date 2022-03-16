import React, {Component} from 'react';
import {Button, Container, createTheme, CssBaseline, Stack, TextField, ThemeProvider, Typography} from "@mui/material";
import WebTorrent from "webtorrent";
import {PlayCircleOutlined, StopCircleOutlined} from "@mui/icons-material";

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
        theme: createTheme(options),
        localClient: new WebTorrent({destroyStoreOnDestroy: false}),
        magnet: "",
        errorMessage: false,
        reproducing: false
    }

    componentDidMount() {
        let {localClient} = this.state;
        localClient.on("error", (error) => {
            console.error("Error validating torrent: ", error)
            this.setState({errorMessage: "Invalid torrent/magnet/hash"})
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
        localClient.add(magnet, null, (torrent) => {
            // Torrents can contain many files. Let's use the .mp4 file
            let files = torrent.files.filter((file) => {
                return file.name.endsWith('.mp4') || file.name.endsWith('.m4v') || file.name.endsWith('.webm')
            })
            // Display the file by adding it to the DOM. Supports video, audio, image, etc. files
            if (files && files.length > 0) {
                files[0].appendTo('div#PREDISPOSING', {maxBlobLength: 2066664530000}, (err, elem) => {
                    if (err) {
                        this.setState({errorMessage: "Error reproducing file " + files[0].name})
                    } else {
                        this.setState({reproducing: true})
                    }
                })

            } else {
                torrent.destroy();
                this.setState({errorMessage: "No streamable file"})
            }
        })
    }

    render() {
        let {theme, magnet, localClient, errorMessage, reproducing} = this.state;
        return (
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                <Container maxWidth="false">
                    <Stack justifyContent={"center"} spacing={2}>
                        <Stack
                            sx={{
                                width: "100%",
                                backgroundColor: "background.paper"
                            }}
                            spacing={2}
                            direction={"row"}
                            alignItems={"center"}
                            justifyContent={"center"}>
                            <PlayCircleOutlined sx={{fontSize: 70}} color={"primary"}/>
                            <Typography variant={"h1"} color={"primary"}>Quix Player</Typography>
                        </Stack>
                        <Stack alignItems={"center"} spacing={2}>
                            {!reproducing && <>
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
                            <Stack component={"div"} id={"PREDISPOSING"}></Stack>
                            {reproducing && <Button
                                color={"primary"}
                                variant={"contained"}
                                startIcon={<StopCircleOutlined/>}
                                onClick={() => {
                                    localClient.remove(magnet)
                                    document.getElementById("PREDISPOSING").innerHTML = "";
                                    this.setState({reproducing: false})
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
