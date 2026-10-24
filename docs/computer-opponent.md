# Computer opponent

The computer player uses only its own hand and the public board. It does not use
other hands or the deck order to choose a move.

It evaluates legal Event placements for points, free-action effects, draw
effects, and future plays. If it cannot place an Event, it discards a card. It
can also use Manipulation cards. Its hand stays visible in this prototype.

Computer moves run locally after a short delay. Undo and redo pause the computer
so you can inspect a restored position. Use **Resume computer** to continue.
