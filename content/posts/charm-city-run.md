---
title: "Charm City Run: A Baltimore Side-Scroller"
date: 2026-11-14
draft: false
tags: ["projects", "games", "javascript"]
author: Taylor Martin
---

You know the little dinosaur game Chrome shows you when the internet goes down? I wanted that, but Baltimore.

Charm City Run is a pixel-art side-scroller split into five levels, each with its own character, neighborhood, and a unique ability the level is built around:

- **Blue Crab** in the **Inner Harbor**: a scuttle dash that blasts through crab-pot traps and gull swarms.
- **Utz Girl** in **Fells Point**: a slide to get under scaffolding that hangs too low to duck.
- **Natty Boh Guy** in **Brewers Hill**: a mustache twirl that spins him up over keg towers too tall to jump.
- **Oriole** at **Camden Yards**: a double jump for peanut stacks and light-rail gaps.
- **Raven** at **Poe's Grave**: a glide across open graves too wide to jump.

Each level gets harder than the last and ends in a boss fight that leans on that character's ability: outrunning a giant steamer pot, chasing down a runaway chip truck, popping foam off a keg cannon, surviving a home run derby, and a "Nevermore" showdown with a giant quill. Every character also has their own theme song, and you get a random Baltimore fun fact after each level.

**Controls:** Space/Up to jump, Down to duck, X or Shift for the ability, P to pause, M to mute. On a phone you get on-screen buttons instead (landscape plays best). Click the game first so it picks up your keys. There's also a code screen on the title (press C), if you happen to know any codes.

Like my last game, it's plain JavaScript and HTML5 Canvas with no frameworks. All the art is drawn in code, and the music and sound effects are generated live with the Web Audio API. A `config.js` file holds the tuning (scroll speed, level length, gravity, hearts, how far the crab dashes, how high the mustache twirl goes) so I can rebalance it without touching the game logic.

Give it a try below:

{{< iframe src="/games/charm-city-run/index.html" height="560px" title="Charm City Run" >}}
