# Library Options for a Browser Card Game

For most card games, the recommended starting point is **React + dnd-kit + Motion**. It provides straightforward card placement without committing the project to a full game engine.

| Option                             | Best for                                                                   | Advantages                                                                                                                                                                                                                                                          | Tradeoffs                                                                                                                                                                                |
| ---------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **React + dnd-kit + Motion**       | Turn-based games, deck builders, and board/card hybrids                    | Cards remain normal HTML elements; CSS Grid or Flexbox handles rows and slots; dnd-kit provides draggable, droppable, and sortable behavior; Motion smoothly animates cards when their positions change. It also supports responsive design and accessibility well. | Overlapping cards, elaborate particles, shaders, and large animated scenes require additional work. React state can become awkward if animation state and game state are mixed together. |
| **Phaser**                         | A game-like experience with effects, sound, menus, and extensive animation | A full browser game framework with scenes, input handling, asset loading, tweens, audio, and drag-and-drop events. It provides considerably more game infrastructure out of the box.                                                                                | Canvas-based UI is less convenient than HTML for text, forms, responsive menus, and accessibility. It may be excessive for a restrained card game.                                       |
| **PixiJS + GSAP or custom tweens** | Highly polished or unusually animated card tables                          | Fast WebGL/WebGPU rendering and precise control over layering, transforms, masks, filters, and card effects. PixiJS provides pointer and touch events plus an opt-in accessibility overlay.                                                                         | PixiJS is primarily a renderer rather than a complete game framework. Drag rules, snapping, screens, lifecycle, and much of the UI architecture must be implemented separately.          |

## Recommended Default Stack

- React with TypeScript
- CSS Grid or Flexbox for the board and the player's hand
- `@dnd-kit/react` for moving and reordering cards
- `motion` for dealing, snapping, flipping, and rearrangement animations
- Zustand if the game state becomes too involved for ordinary React state

## Modelling Card Placement

Represent the board as ordered slots instead of deriving game state from pixel positions:

```ts
type CardPlacement = {
  cardId: string;
  row: number;
  column: number;
};
```

A rule such as “place beside this card” can then insert the card at `column - 1` or `column + 1`. The rendering library is responsible only for displaying and animating the resulting state.

## Recommendation

Use **React + dnd-kit + Motion** for the quickest path to a maintainable card game. Choose **Phaser** when the project is primarily a video game with sound and effects. Choose **PixiJS** when visual performance and custom effects matter more than development speed.

## References

- [dnd-kit React quickstart](https://dndkit.com/react/quickstart/)
- [Motion layout animations](https://motion.dev/docs/react-layout-animations)
- [Phaser input and dragging](https://docs.phaser.io/phaser/concepts/input)
- [Phaser scenes](https://docs.phaser.io/phaser/concepts/scenes)
- [PixiJS introduction](https://pixijs.com/8.x/guides/getting-started/intro)
- [PixiJS events and interaction](https://pixijs.com/8.x/guides/components/events)
