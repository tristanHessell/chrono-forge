import event19001 from './events/event-1900-1';
import event19002 from './events/event-1900-2';
import event19003 from './events/event-1900-3';
import event19101 from './events/event-1910-1';
import event19102 from './events/event-1910-2';
import event19103 from './events/event-1910-3';
import event19201 from './events/event-1920-1';
import event19202 from './events/event-1920-2';
import event19203 from './events/event-1920-3';
import event19301 from './events/event-1930-1';
import event19302 from './events/event-1930-2';
import event19303 from './events/event-1930-3';
import event19401 from './events/event-1940-1';
import event19402 from './events/event-1940-2';
import event19403 from './events/event-1940-3';
import event19501 from './events/event-1950-1';
import event19502 from './events/event-1950-2';
import event19503 from './events/event-1950-3';
import event19601 from './events/event-1960-1';
import event19602 from './events/event-1960-2';
import event19603 from './events/event-1960-3';
import event19701 from './events/event-1970-1';
import event19702 from './events/event-1970-2';
import event19703 from './events/event-1970-3';
import event19801 from './events/event-1980-1';
import event19802 from './events/event-1980-2';
import event19803 from './events/event-1980-3';
import event19901 from './events/event-1990-1';
import event19902 from './events/event-1990-2';
import event19903 from './events/event-1990-3';
import removeEvent1 from './manipulations/remove-event-1';
import removeEvent2 from './manipulations/remove-event-2';
import removeEvent3 from './manipulations/remove-event-3';
import removeEvent4 from './manipulations/remove-event-4';
import takeControl1 from './manipulations/take-control-1';
import takeControl2 from './manipulations/take-control-2';
import takeControl3 from './manipulations/take-control-3';
import takeControl4 from './manipulations/take-control-4';
import timeJump1 from './manipulations/time-jump-1';
import timeJump2 from './manipulations/time-jump-2';
import timeJump3 from './manipulations/time-jump-3';
import timeJump4 from './manipulations/time-jump-4';
import timeSwap1 from './manipulations/time-swap-1';
import timeSwap2 from './manipulations/time-swap-2';
import timeSwap3 from './manipulations/time-swap-3';
import timeSwap4 from './manipulations/time-swap-4';
import starting0 from './starting-event';

// Preserve this order so existing seeds produce the same deals.
const definitions = {
  deck: [
    event19001,
    event19101,
    event19201,
    event19301,
    event19401,
    event19501,
    event19601,
    event19701,
    event19801,
    event19901,
    event19002,
    event19102,
    event19202,
    event19302,
    event19402,
    event19502,
    event19602,
    event19702,
    event19802,
    event19902,
    event19003,
    event19103,
    event19203,
    event19303,
    event19403,
    event19503,
    event19603,
    event19703,
    event19803,
    event19903,
    timeJump1,
    timeJump2,
    timeJump3,
    timeJump4,
    timeSwap1,
    timeSwap2,
    timeSwap3,
    timeSwap4,
    takeControl1,
    takeControl2,
    takeControl3,
    takeControl4,
    removeEvent1,
    removeEvent2,
    removeEvent3,
    removeEvent4,
  ],
  startingCard: starting0,
} as const;

export default definitions;
