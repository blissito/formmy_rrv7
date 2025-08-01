# 🎉 CelebrationFlip

A beautiful animated flip text component for celebrating milestones with customizable text and hearts. Perfect for social media celebrations, milestone announcements, and achievement showcases.

<div align="center">
  
  [![npm version](https://badge.fury.io/js/celebration-flip.svg)](https://badge.fury.io/js/celebration-flip)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Bundle Size](https://img.shields.io/bundlephobia/minzip/celebration-flip)](https://bundlephobia.com/package/celebration-flip)
  [![Downloads](https://img.shields.io/npm/dm/celebration-flip)](https://www.npmjs.com/package/celebration-flip)
</div>

## ✨ Features

- 🎬 **Smooth flip animations** with CSS transforms and 60fps performance
- 🎨 **Fully customizable** - Colors, text, duration, and styling
- 📱 **Responsive design** - Works perfectly on mobile, tablet, and desktop
- ⚡ **Ultra lightweight** - Less than 5KB minified + gzipped
- 🔧 **Zero configuration** - Works out of the box with sensible defaults
- 🌐 **Framework agnostic** - React, Vue, Svelte, or vanilla HTML/CSS
- ♿ **Accessibility first** - Respects `prefers-reduced-motion` and screen readers
- 🎯 **TypeScript ready** - Full type definitions included
- 📦 **Multiple formats** - ESM, CommonJS, and UMD builds
- 🎨 **Retro aesthetic** - Uses the beautiful "Sixtyfour" pixel font

## 📦 Installation

```bash
# npm
npm install celebration-flip

# yarn
yarn add celebration-flip

# pnpm
pnpm add celebration-flip

# bun
bun add celebration-flip
```

Or use it directly from CDN (no installation required):

```html
<!-- CSS -->
<link
  rel="stylesheet"
  href="https://unpkg.com/celebration-flip@latest/dist/styles.css"
/>

<!-- ESM -->
<script type="module">
  import { CelebrationFlip } from "https://unpkg.com/celebration-flip@latest/dist/index.esm.js";
</script>
```

## 🚀 Quick Start

### React Component

```jsx
import { CelebrationFlip } from "celebration-flip";
import "celebration-flip/dist/styles.css";

function App() {
  return (
    <div
      style={{
        background: "#111",
        minHeight: "100vh",
        display: "grid",
        placeContent: "center",
      }}
    >
      <CelebrationFlip
        mainText="4000 SUSCRIPTORES"
        secondaryText="¡GRACIAS!"
        primaryColor="dodgerblue"
        secondaryColor="hotpink"
        duration={3}
      />
    </div>
  );
}
```

### Vanilla HTML/CSS

```html
<!DOCTYPE html>
<html>
  <head>
    <link
      rel="stylesheet"
      href="https://unpkg.com/celebration-flip/dist/styles.css"
    />
    <style>
      body {
        background: #111;
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-content: center;
      }
    </style>
  </head>
  <body>
    <div
      class="celebration-flip"
      style="--clr-1: dodgerblue; --clr-2: hotpink; --duration: 3s;"
    >
      <div class="flip-text">
        <span>4</span><span>0</span><span>0</span><span>0</span><span></span>
        <span>S</span><span>U</span><span>S</span><span>C</span><span>R</span
        ><span>I</span><span>P</span><span>T</span><span>O</span><span>R</span
        ><span>E</span><span>S</span>
      </div>
      <div class="flip-text">
        <span>♥</span><span>♥</span><span>♥</span><span>♥</span><span></span>
        <span>¡</span><span>G</span><span>R</span><span>A</span><span>C</span
        ><span>I</span><span>A</span><span>S</span><span>!</span><span></span>
        <span>♥</span><span>♥</span><span>♥</span><span>♥</span>
      </div>
    </div>
  </body>
</html>
```

## 📖 API Reference

### Props (React)

| Prop             | Type     | Default        | Description                                      |
| ---------------- | -------- | -------------- | ------------------------------------------------ |
| `mainText`       | `string` | **required**   | Main text to display (e.g., "4000 SUSCRIPTORES") |
| `secondaryText`  | `string` | **required**   | Secondary text to display (e.g., "¡GRACIAS!")    |
| `primaryColor`   | `string` | `"dodgerblue"` | Primary color for main text                      |
| `secondaryColor` | `string` | `"hotpink"`    | Secondary color for hearts and secondary text    |
| `duration`       | `number` | `3`            | Animation duration in seconds                    |
| `className`      | `string` | `""`           | Custom CSS class name                            |

### CSS Custom Properties (Vanilla)

| Property     | Default      | Description                                   |
| ------------ | ------------ | --------------------------------------------- |
| `--clr-1`    | `dodgerblue` | Primary color for main text                   |
| `--clr-2`    | `hotpink`    | Secondary color for hearts and secondary text |
| `--duration` | `3s`         | Animation duration                            |

## 🎨 Examples

### Different Milestones

```jsx
// 1000 Followers
<CelebrationFlip
  mainText="1000 FOLLOWERS"
  secondaryText="THANK YOU"
  primaryColor="#00ff88"
  secondaryColor="#ff6b35"
/>

// 1M Views
<CelebrationFlip
  mainText="1M VIEWS"
  secondaryText="INCREDIBLE"
  primaryColor="#ff0080"
  secondaryColor="#8000ff"
  duration={2}
/>

// 10K Likes
<CelebrationFlip
  mainText="10K LIKES"
  secondaryText="AMAZING"
  primaryColor="gold"
  secondaryColor="orange"
  duration={4}
/>
```

### Custom Styling

```jsx
<CelebrationFlip
  mainText="CUSTOM STYLE"
  secondaryText="AWESOME"
  primaryColor="linear-gradient(45deg, #ff6b6b, #4ecdc4)"
  secondaryColor="linear-gradient(45deg, #45b7d1, #96ceb4)"
  className="my-custom-celebration"
/>
```

```css
.my-custom-celebration {
  filter: drop-shadow(0 0 20px rgba(255, 107, 107, 0.5));
}
```

## 🎯 Use Cases

- 📊 **Social Media Milestones** - Celebrate follower counts, likes, shares
- 🏆 **Achievement Announcements** - App downloads, user registrations
- 💰 **Business Metrics** - Revenue goals, customer milestones
- 🎓 **Educational Platforms** - Course completions, student enrollments
- 🎮 **Gaming** - High scores, level completions
- 📈 **Analytics Dashboards** - KPI celebrations

## 🌐 Browser Support

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## ♿ Accessibility

The component respects the `prefers-reduced-motion` media query. Users who have requested reduced motion will see a static version without animations.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT © [@blissito](https://github.com/blissito)

## 🔗 Links

- [GitHub Repository](https://github.com/blissito/celebration-flip)
- [NPM Package](https://www.npmjs.com/package/celebration-flip)
- [Report Issues](https://github.com/blissito/celebration-flip/issues)

---

Made with ❤️ by the [Formmy](https://formmy.app) team
