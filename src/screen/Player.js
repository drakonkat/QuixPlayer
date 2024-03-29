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
    Favorite,
    FileUploadOutlined,
    PlayCircleOutlined,
    StopCircleOutlined
} from "@mui/icons-material";
import logo from '../asset/default-nomargin.svg'
import queryString from "query-string"


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
                        paddingTop: "0px",
                    }
                },
            },
        }
    },
};
const trackers = ['wss://tracker.btorrent.xyz', 'wss://tracker.openwebtorrent.com', 'wss://tracker.crawfish.cf']

const rtcConfig = {
    "iceServers": [
        {
            "urls": "stun:23.21.150.121"
        },
        {
            urls: [
                'stun:stun.l.google.com:19302',
                'stun:global.stun.twilio.com:3478'
            ]
        },
        {
            "username": "admin",
            "credential": "Password1!",
            "urls": "turn:23.94.202.235:3478"
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

function inIframe() {
    try {
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
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
        downloadSpeed: null,
        inIframe: inIframe()
    }


    componentDidMount() {

        navigator.serviceWorker.register("sw.min.js")
            .then((reg) => {
                const worker = reg.active || reg.waiting || reg.installing
                let checkState = (worker) => {
                    return worker.state === 'activated' && this.localClient.loadWorker(worker, () => {
                        console.log("Service worker registered, scope: ", navigator.serviceWorker.controller);
                    })
                }
                if (!checkState(worker)) {
                    worker.addEventListener('statechange', ({target}) => checkState(target))
                }
            })
            .catch(function (error) {
                console.log("Service worker registration failed: " + error.message);
            });

        this.localClient.on("warning", (warning) => {
            console.warn("Error torrent: ", warning)
        });
        this.localClient.on("error", (error) => {
            console.error("Error validating torrent: ", error)
            this.setState({errorMessage: "Invalid torrent/magnet/hash", loading: false})
        })
        if (window.location.search && window.location.search.includes("?magnet=")) {
            const queryParams = queryString.parse(window.location.search)
            let {magnet, fallbackUrl} = queryParams
            this.setState({
                magnet: magnet, fallbackUrl
            }, this.play)
        }
    }

    play = () => {
        let {magnet, torrentFile, inIframe, fallbackUrl} = this.state
        let input = magnet || torrentFile[0];
        let video = document.getElementById("PREDISPOSING")

        this.setState({loading: true})
        console.time()
        if (inIframe) {
            setTimeout(() => {
                if (!video.src && inIframe && fallbackUrl) {
                    this.setState({
                        loading: false,
                        reproducing: true,
                        fallbackElement: <iframe
                            src={fallbackUrl} style={{
                            height: "100%",
                            width: "100%",
                            border: "none",
                            marginTop: 0
                        }}
                            title={"fallback"}
                            allowFullScreen/>
                    }, () => {
                        this.localClient.remove(input);
                    })
                }
            }, 20000)
        }
        this.localClient.add(input, torrentOpts, (torrent) => {
            torrent.on('download', (bytes) => {
                this.setState({files: torrent.files, downloadSpeed: humanFileSize(torrent.downloadSpeed)})
            })
            // Torrents can contain many files. Let's use the .mp4 file
            let files = torrent.files.filter((file) => {
                return file.name.endsWith('.mp4') || file.name.endsWith('.m4v') || file.name.endsWith('.webm')
            })
            // Display the file by adding it to the DOM. Supports video, audio, image, etc. files
            if (files && files.length > 0) {
                files[0].streamTo(video, (err, elem) => {
                    console.timeEnd();
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
        let {
            loading,
            theme,
            magnet,
            errorMessage,
            reproducing,
            files,
            torrentFile,
            downloadSpeed,
            inIframe,
            fallbackElement
        } = this.state;
        return (
            <ThemeProvider theme={theme}>
                <CssBaseline/>
                <Container maxWidth="false">
                    <Stack
                        sx={{
                            height: inIframe ? "100%" : "auto"
                        }}
                        key={"FIRST-ELEMENT"} justifyContent={"center"} spacing={2}>
                        {inIframe ? undefined : <Stack
                            key={"SECOND-ELEMENT"}
                            sx={{
                                width: "100%",
                                backgroundColor: "background.paper",
                                [defaultTheme.breakpoints.down('md')]: {
                                    display: "none",
                                },
                                padding: "10px"
                            }}
                            spacing={2}
                            direction={"row"}
                            alignItems={"center"}
                            justifyContent={"center"}>
                            <img style={{height: "100px"}} src={logo} alt="Logo"/>
                        </Stack>}
                        <Stack
                            sx={{
                                height: inIframe ? "100%" : "auto"
                            }} key={"THIRD-ELEMENT"} alignItems={"center"} spacing={2}>
                            {loading && <>
                                <Typography variant={"h4"}>
                                    Caricamento del torrent (In caso di pochi utenti attivi potrebbe richiedere più
                                    tempo)
                                </Typography>
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
                            <video
                                key={"ELEMENT4"}
                                style={{maxWidth: "100%", display: (loading || !files) ? "none" : undefined}}
                                id={"PREDISPOSING"}
                                onPlay={() => {
                                    if (inIframe) {
                                        this.localClient.throttleDownload(-1)
                                    }
                                }}
                                controls/>
                            {inIframe && fallbackElement && fallbackElement}

                            {inIframe && <>
                                {files && <Grid container
                                                justifyContent="space-between"
                                                alignItems="center"
                                                sx={{
                                                    marginTop: "0 !important"
                                                }}
                                >
                                    {files.map(file => {
                                        return <Grid id={file.name} key={file.name} item sx={{
                                            padding: "5px"
                                        }}>
                                            <Button disabled={file.progress < 1} size={"small"} onClick={() => {
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
                                                ({Math.round(file.progress * 100)}%)
                                            </Button>
                                        </Grid>
                                    })
                                    }
                                    {downloadSpeed &&
                                        <Grid id={"Speed"} item sx={{
                                            padding: "5px"
                                        }}>
                                            <Chip
                                                sx={{
                                                    minWidth: "190px"
                                                }}
                                                icon={<Downloading/>}
                                                color={"primary"}
                                                label={"Download speed " + downloadSpeed} variant="outlined"/>
                                        </Grid>}
                                    {<Grid id={"Star github"} item sx={{
                                        padding: "5px"
                                    }}>
                                        <Chip icon={<Favorite/>} color={"primary"} onClick={() => {
                                            window.open("https://github.com/drakonkat/Crawfish", '_blank').focus();
                                        }}
                                              label={"Se ti piace il player torrent, segui CrawFish"}
                                              variant="outlined"/>
                                    </Grid>}
                                </Grid>}
                            </>}


                            {!inIframe && <>
                                {files && <Grid container
                                                justifyContent="center"
                                                alignItems="center"
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
                                        <Chip icon={<Downloading/>} color={"primary"}
                                              label={"Download speed " + downloadSpeed} variant="outlined"/>}
                                </Stack>}
                            </>}
                        </Stack>
                    </Stack>
                    {/*{!inIframe && <iframe*/}
                    {/*    style={{*/}
                    {/*        height: "100%",*/}
                    {/*        width: "100%",*/}
                    {/*        border: "2px solid red"*/}
                    {/*    }}*/}
                    {/*    src="http://localhost:3000?magnet=7ff17298cd8957ae6408d32fbb6559bd159a8dff&fallbackUrl=https%3A%2F%2Fmega.nz%2Fembed%2F5coFBZDK%23ePKmKKncNH3dWOQe5vaAbCoOYotkpvdoHnJO-G1GYA8"/>}*/}
                </Container>
            </ThemeProvider>
        );
    }
}

export default Player;
