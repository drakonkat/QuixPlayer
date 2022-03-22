[//]: # (![QPlayer]&#40;https://gitlab.com/tndsite/quix-player/raw/master/public/logo512.png&#41;)
#Qplayer

**QPlayer** is a site where anyone can stream or download torrents directly from their browser. (Only specific file format is supported by the web player, some file require to be downloaded to be played in the browser)

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
