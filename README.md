# Crimson Music

> Crimson Music is dynamic web app for streaming music.

# Crimson Music Desktop
> [!NOTE]
> View the code [HERE](https://github.com/Stefan-Mihajlovic/CrimsonMusicDesktop)

## Netlify Google sign-in

Production uses a same-origin Firebase Auth helper so redirect sign-in also works in the installed iOS app. The Google OAuth web client used by Firebase must include this exact authorized redirect URI:

`https://crimsonmusic.netlify.app/__/auth/handler`

`netlify.toml` proxies `/__/auth/*` to the Firebase-hosted auth helper. Netlify deploy previews intentionally keep the default Firebase auth domain because Google OAuth does not support wildcard redirect URIs.
