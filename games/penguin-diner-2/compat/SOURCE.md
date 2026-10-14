# Pixi CSP compatibility

Official @pixi/unsafe-eval version 5.3.3, matching the game's Pixi 5.3.3.
Downloaded from https://registry.npmjs.org/@pixi/unsafe-eval/-/unsafe-eval-5.3.3.tgz
on October 14, 2026. License: MIT; see LICENSE.

SHA-256 of unsafe-eval-5.3.3.js: 554ae1027ece7298ee8f14a430fd76c05b403c0bfb33f8921c3a5c4c89fa9a3b

Despite its name, this module removes the ShaderSystem's need for new Function.
It uses static uniform upload functions and preserves a script-src 'self' policy.
Load it after assets/pixi.min.js and before the game initializes. Otherwise Pixi
silently falls back to Canvas and loses GlowFilter and ColorMatrixFilter effects.
Official documentation: https://api.pixijs.io/%40pixi/unsafe-eval.html
