# OratorStudio — Precision Public Speaking & Rhetoric Coach

OratorStudio is a self-contained, zero-dependency web application designed to train your public speaking, pacing, vocal variety, impromptu thinking, and rhetorical structure.

## Included Files
- `index.html` — Application layout, responsive styling, and Apple Web App metadata for iPhone and Mac installation
- `app.js` — Interactive application engine, Speaker Login & Multi-Profile state manager (`0 / 6` clean default progress), 6-Module Rhetoric Academy with precision labs, Speech & Pace Teleprompter (`performance.now()` drift-free clock), Impromptu Arena (Toastmasters timing lights), Framework Architect, and Vocal & Calm Gym
- `README.md` — Deployment and installation guide for GitHub Pages, Mac, and iPhone

## Key Features
- **Speaker Login & Multi-Profile Switcher**: Sign in with your name, switch between multiple speaker profiles, or reset progress cleanly (new profiles always start at `0 / 6` modules completed and `0 XP`).
- **6-Module Interactive Rhetoric Academy**: Hands-on drills and interactive scenario quizzes for cognitive reframing, vocal prosody, pause engineering, PREP/ Monroe/ Aristotelean frameworks, hook mastery, and stage presence.
- **High-Precision Speech & Pace Lab**: Drift-free `performance.now()` teleprompter with live Word Pacer (`Target WPM`), interactive `[PAUSE 2s]` countdown overlays, syllable-estimated reading duration, and multi-word filler & hedge word detection.
- **Impromptu Arena & Toastmasters Timer**: Random prompt generator across 5 categories with Green (1:00), Yellow (1:30), and Red (2:00) visual stage lights and post-speech structural self-rubric.
- **Framework Architect & Vocal Gym**: Fill-in-the-blank speech builder with 1-click teleprompter export, 4-4-6-2 Box Breathing visualizer, Diaphragmatic Hiss Sustainer, and 3-Speed Articulation Drills.

## Quick Start (Local on Mac)
Double-click `index.html` in your `Orator Studio` folder to open and use the app immediately in Safari or Chrome.

## Hosting on GitHub Pages (For iPhone & Mac Installation)
1. Create a new repository on [GitHub](https://github.com/new) (for example, `orator-studio`).
2. Upload `index.html`, `app.js`, and `README.md` from this `Orator Studio` folder to the root of your repository and commit your changes ([GitHub Pages Documentation](https://docs.github.com/articles/creating-project-pages-manually)).
3. Open your repository's **Settings → Pages**, set **Build and deployment → Source** to **Deploy from a branch**, select the `main` branch and `/ (root)` folder, and click **Save** ([GitHub Pages Setup Guide](https://pages.github.com/)).
4. Visit your live URL at `https://<your-username>.github.io/orator-studio/`.

## Installing as an App
- **On iPhone (iOS Safari)**: Open your GitHub Pages URL in **Safari**, tap the **Share** button, scroll down and tap **Add to Home Screen**, and tap **Add** ([Apple iPhone User Guide](https://support.apple.com/en-me/guide/iphone/iphea86e5236/ios)).
- **On Mac (macOS Sonoma or later)**: Open your GitHub Pages URL in **Safari**, click **File → Add to Dock...** in the menu bar, and click **Add** ([Apple Support: Use Safari Web Apps on Mac](https://support.apple.com/en-us/104996)).
