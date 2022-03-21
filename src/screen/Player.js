import React, {Component} from 'react';
import {
    Button,
    Chip,
    CircularProgress,
    Container,
    createTheme,
    CssBaseline,
    Grid,
    IconButton,
    InputAdornment,
    Stack,
    TextField,
    ThemeProvider,
    Typography
} from "@mui/material";
import WebTorrent from "webtorrent";
import {
    DownloadForOffline,
    Downloading,
    FileUploadOutlined,
    PlayCircleOutlined,
    StopCircleOutlined
} from "@mui/icons-material";


const round = (input) => {
    return Math.round(input * 100) / 100
}
const humanFileSize = (bytes, si = false, dp = 1) => {
    const thresh = si ? 1000 : 1024;

    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }

    const units = si
        ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    const r = 10 ** dp;

    do {
        bytes /= thresh;
        ++u;
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1);


    return round(bytes.toFixed(dp)) + ' ' + units[u];
}
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
const trackers = ['wss://tracker.btorrent.xyz', 'wss://tracker.openwebtorrent.com', 'wss://tracker.quix.cf']

const rtcConfig = {
    'iceServers': [
        {
            'urls': ['stun:stun.l.google.com:19305', 'stun:stun1.l.google.com:19305']
        }
    ]
}

const torrentOpts = {
    announce: trackers
}

const trackerOpts = {
    announce: trackers,
    rtcConfig: rtcConfig
}

class Player extends Component {

    localClient = new WebTorrent({tracker: trackerOpts})
    state = {
        files: null,
        theme: createTheme(options),
        magnet: "",
        errorMessage: false,
        reproducing: false,
        loading: false,
        downloadSpeed: null
    }

    componentDidMount() {
        this.localClient.on("error", (error) => {
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
        let {magnet, torrentFile} = this.state
        let input = magnet || torrentFile[0];
        this.setState({loading: true})
        this.localClient.add(input, torrentOpts, (torrent) => {
            console.log("Torrent catched: ", torrent)
            torrent.on('download', (bytes) => {
                this.setState({files: torrent.files, downloadSpeed: humanFileSize(torrent.downloadSpeed)})
            })
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
                        this.setState({reproducing: true, loading: false, files: torrent.files})
                    }
                })

            } else {
                // torrent.destroy();
                this.setState({reproducing: true, loading: false, files: torrent.files})
            }
        })
    }

    render() {
        let {loading, theme, magnet, errorMessage, reproducing, files, torrentFile, downloadSpeed} = this.state;
        return (
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                <Container maxWidth="false">
                    <Stack key={"FIRST-ELEMENT"} justifyContent={"center"} spacing={2}>
                        <Stack
                            key={"SECOND-ELEMENT"}
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
                        <Stack key={"THIRD-ELEMENT"} alignItems={"center"} spacing={2}>
                            {loading && <>
                                <Typography variant={"h4"}>Loading (Due to the low number of users, the process can take
                                    several minutes)...</Typography>
                                <CircularProgress variant={"indeterminate"}/>
                            </>}
                            {!reproducing && !loading && <>
                                <Typography variant={"h4"}>Stream torrent directly in your browser</Typography>
                                {torrentFile ? <Chip label={torrentFile[0].name} variant="outlined"
                                                     onDelete={() => {
                                                         this.setState({files: null})
                                                     }}
                                    />
                                    : <TextField
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
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton variant="contained"
                                                                component="label">
                                                        <FileUploadOutlined/>
                                                        <input
                                                            type="file"
                                                            hidden
                                                            accept={".torrent"}
                                                            onChange={(e) => {
                                                                this.setState({torrentFile: e.target.files, magnet: ""})
                                                            }}
                                                        />
                                                    </IconButton>
                                                </InputAdornment>
                                            )
                                        }}
                                    />}
                                <Button
                                    disabled={(magnet == null || magnet === "") && (torrentFile == null)}
                                    color={"primary"}
                                    variant={"contained"}
                                    startIcon={<PlayCircleOutlined/>}
                                    onClick={this.play}
                                >
                                    Play
                                </Button>
                            </>
                            }
                            <Stack key={"ELEMENT4"} sx={{maxWidth: "100%"}} component={"div"}
                                   id={"PREDISPOSING"}></Stack>
                            {files && <Grid container
                                            justifyContent="center"
                                            alignItems="center"
                                            spacing={2}
                            >
                                {files.map(file => {
                                    return <Grid id={file.name} key={file.name} item>
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
                            {reproducing && <Stack spacing={2} direction={"row"}> <Button
                                color={"primary"}
                                variant={"contained"}
                                startIcon={<StopCircleOutlined/>}
                                onClick={() => {
                                    this.localClient.torrents.forEach((torrent) => {
                                        this.localClient.remove(torrent.infoHash)
                                    })
                                    document.getElementById("PREDISPOSING").innerHTML = "";
                                    this.setState({reproducing: false, files: null, downloadSpeed: null})
                                }}
                            >
                                Cancel
                            </Button>
                                {downloadSpeed &&
                                    <Chip icon={<Downloading />} color={"primary"} label={"Download speed " + downloadSpeed} variant="outlined"/>}
                            </Stack>}
                        </Stack>
                    </Stack>
                </Container>
            </ThemeProvider>
        );
    }
}

export default Player;
