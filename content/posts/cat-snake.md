---
title: "Cat & Cat-Lady: A Two-Character Snake Game"
date: 2026-08-16
draft: false
tags: ["projects", "games", "javascript"]
author: Taylor Martin
---

I built a little twist on Snake: instead of controlling one snake, you're controlling two characters at once on the same board.

**The Cat** (Arrow Keys) plays the classic Snake role — it eats food to grow longer, and its length becomes half of your final score. But every so often it also drops litter behind it as it moves.

**The Cat-Lady** (WASD) has an entirely separate job: sweep up that litter before it becomes a problem. Litter starts out fresh and valuable, then ages from green, to brown, to black over a few seconds, losing points the longer it sits unswept. Whatever a tile is worth the moment the Cat-Lady crosses it gets banked permanently into her score — win or lose. The catch is that the Cat still can't survive running into its own mess, so letting litter pile up isn't an option either.

It's a small vanilla JS + HTML5 Canvas project — no frameworks, just a game loop, two independently-clocked entities, and a config file (`config.js`) that drives all the tuning: grid size, movement speeds, litter aging/scoring, and the art. The idea was to keep the whole thing reskinnable and rebalanceable without touching the game logic itself.

Give it a try below:

{{< iframe src="/games/cat-snake/index.html" height="900px" title="Cat & Cat-Lady Snake" >}}
