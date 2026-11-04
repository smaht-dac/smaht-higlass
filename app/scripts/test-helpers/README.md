# test-helpers

Several useful methods for running tests. In this project, these methods are only used in tests, but plugin tracks also make use of them, so not really extraneous.

- `wait-helpers.js`: Enzyme-free helpers (`waitForTilesLoaded`, `waitForJsonComplete`, ...). These are re-exported from `hglib` and the plugin `utils`, so they ship in the library bundle and must not import anything test-only.
- `test-helpers.jsx`: Enzyme-based helpers (`mountHGComponent`, `mountHGComponentAsync`). Tests only: never import this file from library code, or Enzyme ends up in the bundle.

Tests should import from `test-helpers/index.js`, which re-exports both.