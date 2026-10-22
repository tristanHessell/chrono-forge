# Bugs

````json {
  "version": 2,
  "rulesVersion": 2,
  "seed": "b720e322-e8aa-407f-b592-8f4c65d8cd2c",
  "numPlayers": 2,
  "actions": [
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1910-3",
          {
            "row": 1,
            "column": 0
          }
        ],
        "playerID": "0"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1950-1",
          {
            "row": 2,
            "column": 0
          }
        ],
        "playerID": "0"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "manipulate",
        "args": [
          "take-control-3",
          "event-1910-3"
        ],
        "playerID": "1"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1900-1",
          {
            "row": -1,
            "column": 0
          }
        ],
        "playerID": "1"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1910-2",
          {
            "row": -2,
            "column": 0
          }
        ],
        "playerID": "0"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1950-3",
          {
            "row": -3,
            "column": 0
          }
        ],
        "playerID": "0"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "manipulate",
        "args": [
          "take-control-2",
          "event-1950-1"
        ],
        "playerID": "1"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1920-1",
          {
            "row": 0,
            "column": -1
          }
        ],
        "playerID": "1"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1910-1",
          {
            "row": -1,
            "column": 1
          }
        ],
        "playerID": "0"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1950-2",
          {
            "row": 0,
            "column": -2
          }
        ],
        "playerID": "0"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1940-2",
          {
            "row": 1,
            "column": 1
          }
        ],
        "playerID": "1"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "manipulate",
        "args": [
          "remove-event-3",
          "event-1910-2"
        ],
        "playerID": "1"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1930-3",
          {
            "row": -1,
            "column": 2
          }
        ],
        "playerID": "0"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1930-2",
          {
            "row": -2,
            "column": 0
          }
        ],
        "playerID": "0"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1960-2",
          {
            "row": 0,
            "column": 2
          }
        ],
        "playerID": "1"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1980-1",
          {
            "row": 2,
            "column": -1
          }
        ],
        "playerID": "1"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1970-2",
          {
            "row": 1,
            "column": 2
          }
        ],
        "playerID": "0"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1990-3",
          {
            "row": -2,
            "column": -1
          }
        ],
        "playerID": "0"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1940-3",
          {
            "row": -2,
            "column": 2
          }
        ],
        "playerID": "1"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "manipulate",
        "args": [
          "time-jump-1",
          "event-1990-3",
          {
            "row": 3,
            "column": 0
          }
        ],
        "playerID": "1"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "manipulate",
        "args": [
          "remove-event-4",
          "event-1920-1"
        ],
        "playerID": "0"
      }
    }
  ]
}```
I should be able to place a card next to the 1900 card, which would then block the removed 1920 card from ever being overwritten


```json
{
  "version": 2,
  "rulesVersion": 2,
  "seed": "b720e322-e8aa-407f-b592-8f4c65d8cd2c",
  "numPlayers": 2,
  "actions": [
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1910-3",
          {
            "row": 1,
            "column": 0
          }
        ],
        "playerID": "0"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1950-1",
          {
            "row": 2,
            "column": 0
          }
        ],
        "playerID": "0"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "manipulate",
        "args": [
          "take-control-3",
          "event-1910-3"
        ],
        "playerID": "1"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1900-1",
          {
            "row": -1,
            "column": 0
          }
        ],
        "playerID": "1"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1910-2",
          {
            "row": -2,
            "column": 0
          }
        ],
        "playerID": "0"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1950-3",
          {
            "row": -3,
            "column": 0
          }
        ],
        "playerID": "0"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "manipulate",
        "args": [
          "take-control-2",
          "event-1950-1"
        ],
        "playerID": "1"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1920-1",
          {
            "row": 0,
            "column": -1
          }
        ],
        "playerID": "1"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1910-1",
          {
            "row": -1,
            "column": 1
          }
        ],
        "playerID": "0"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1950-2",
          {
            "row": 0,
            "column": -2
          }
        ],
        "playerID": "0"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1940-2",
          {
            "row": 1,
            "column": 1
          }
        ],
        "playerID": "1"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "manipulate",
        "args": [
          "remove-event-3",
          "event-1910-2"
        ],
        "playerID": "1"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1930-3",
          {
            "row": -1,
            "column": 2
          }
        ],
        "playerID": "0"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1930-2",
          {
            "row": -2,
            "column": 0
          }
        ],
        "playerID": "0"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1960-2",
          {
            "row": 0,
            "column": 2
          }
        ],
        "playerID": "1"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1980-1",
          {
            "row": 2,
            "column": -1
          }
        ],
        "playerID": "1"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1970-2",
          {
            "row": 1,
            "column": 2
          }
        ],
        "playerID": "0"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1990-3",
          {
            "row": -2,
            "column": -1
          }
        ],
        "playerID": "0"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1940-3",
          {
            "row": -2,
            "column": 2
          }
        ],
        "playerID": "1"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "manipulate",
        "args": [
          "time-jump-1",
          "event-1990-3",
          {
            "row": 3,
            "column": 0
          }
        ],
        "playerID": "1"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "manipulate",
        "args": [
          "remove-event-4",
          "event-1920-1"
        ],
        "playerID": "0"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1920-3",
          {
            "row": 0,
            "column": -1
          }
        ],
        "playerID": "0"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1960-3",
          {
            "row": -1,
            "column": -2
          }
        ],
        "playerID": "1"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1970-1",
          {
            "row": 0,
            "column": -3
          }
        ],
        "playerID": "1"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1990-2",
          {
            "row": -2,
            "column": -1
          }
        ],
        "playerID": "0"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1990-1",
          {
            "row": -4,
            "column": 0
          }
        ],
        "playerID": "0"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "manipulate",
        "args": [
          "time-swap-2",
          "event-1980-1",
          "event-1990-2"
        ],
        "playerID": "1"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "manipulate",
        "args": [
          "time-swap-3",
          "event-1960-3",
          "event-1990-1"
        ],
        "playerID": "1"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "manipulate",
        "args": [
          "time-jump-3",
          "event-1990-1",
          {
            "row": -2,
            "column": -2
          }
        ],
        "playerID": "0"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "manipulate",
        "args": [
          "take-control-4",
          "event-1900-1"
        ],
        "playerID": "0"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1940-1",
          {
            "row": -1,
            "column": 3
          }
        ],
        "playerID": "1"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "manipulate",
        "args": [
          "remove-event-2",
          "event-1900-1"
        ],
        "playerID": "1"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1900-2",
          {
            "row": -1,
            "column": 0
          }
        ],
        "playerID": "0"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "manipulate",
        "args": [
          "remove-event-1",
          "event-1930-3"
        ],
        "playerID": "0"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1980-2",
          {
            "row": 1,
            "column": -2
          }
        ],
        "playerID": "1"
      }
    },
    {
      "type": "MAKE_MOVE",
      "payload": {
        "type": "playEvent",
        "args": [
          "event-1980-3",
          {
            "row": -3,
            "column": 1
          }
        ],
        "playerID": "1"
      }
    }
  ]
}
````

I should be able to Time Jump the `Climate Summit` to the `Silent Spring` but can't
