# Vanduul Space 

A browser game written in javascript, inspired by the space adventure Star Citizen.

Via the Apache 2.0 license you are free to distribute and modify this software as you please.

If you just want to play it, you can visit

https://vanduul.space

Or you can run it yourself.

It can be run locally with Vite
```
$ cd vanduul.space
$ npm install
$ npm run dev
```

To create the GitHub Pages build locally

```
$ npm run build
```

That writes the production site into `docs/`, which matches the current GitHub Pages branch-folder setup.

It can also be run through docker

`docker run -p 8080:8080 -d -t vacation/vanduul.space`

That will launch a server with Vanduul Space running on port 8080.  

The current codebase is plain JavaScript mounted through a lightweight Vite shell.
