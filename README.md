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

It can also be built and served through Docker

```bash
$ docker build -t vanduul-space .
$ docker run --rm -p 8080:80 vanduul-space
```

That will build the site from the current checkout and serve it on port `8080`.

The current codebase is plain JavaScript mounted through a lightweight Vite shell.
