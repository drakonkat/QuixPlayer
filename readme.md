![QPlayer](https://gitlab.com/tndsite/quix-player/raw/master/src/asset/logo.svg)


**QPlayer** is a site where anyone can stream or download torrents directly from their browser. (Only specific file format is supported by the web player, some file require to be downloaded to be played in the browser)

> How I can access to the service?

You can access it from this here [QPlayer](https://tndsite.gitlab.io/quix-player/)

> Is possible to share link with embedded torrent file?

**Yes!** Simply by adding a query param with the magnet that you want to share with someone. Here is an example with a free torrent Sintel [QPlayer with magnet](https://tndsite.gitlab.io/quix-player/?magnet=magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent)


It uses **[WebTorrent](https://webtorrent.io/)** - the first torrent client that works in the browser. **WebTorrent** uses **[WebRTC](https://webrtc.org/)** for true peer-to-peer transport. No browser plugin, extension, or installation is required.


---

### Note

*In the browser, WebTorrent can only download torrents that are seeded by a WebRTC-capable torrent client.*

> What does that mean?

It means that, for now, not every torrent will work on this site.

> Why?

Because most people use native torrent clients like *BitTorrent*, *Transmission*, *μTorrent*, etc. which do not use the [WebRTC](https://en.wikipedia.org/wiki/WebRTC) transport protocol, but the [TCP](https://en.wikipedia.org/wiki/Transmission_Control_Protocol)/[uTP](https://en.wikipedia.org/wiki/Micro_Transport_Protocol).

> There is a way to support more torrent?

**Yes!** It simply requires that people start using torrent client which support WebTorrent like **[TorQuiX](https://github.com/drakonkat/webtorrent-express-api/releases)**

You can subscribe to [this issue](https://github.com/feross/webtorrent/issues/369) for updates on this matter.

## License

MIT. Copyright (c) [Drakonkat](https://gitlab.com/tndsite/quix-player/-/blob/master/LICENSE).
