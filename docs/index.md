---
layout: home

hero:
  name: FuncWork
  text: Run pure functions in Web Worker
  tagline: Add functions to a Web Worker dynamically — no preset worker files, no build config. Just write functions.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Live Demo
      link: /demo/

features:
  - icon: 🍵
    title: Zero Config Workers
    details: Pass any named function to <code>add()</code> and call it with <code>invoke()</code>. FuncWork serializes the function and runs it inside a Worker automatically.
  - icon: ⚡️
    title: Non-blocking by Design
    details: Heavy computation runs off the main thread. Your UI stays smooth while the Worker crunches numbers.
  - icon: 🔄
    title: Dynamic Lifecycle
    details: Register, remove, clear or destroy at any time. Functions are managed as a live set inside the Worker.
---
