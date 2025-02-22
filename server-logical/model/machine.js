//---DATA BASE
var presist = require("../lib/presist");
var Observable = require("../lib/observer").Observable;
var machinestates = Observable.from({}); //runtime stuff
var machinedb = presist("machine", {
    test_machine: {
        id: 'test_machine',
        public: {
            cost: 2,
            title: "逻辑测试",
            intro: "永远“在线”，服务端模拟，用于测试",
            view_streams: ["wss://emerge.ltd:8444/"]
        },
        private: {
            key: 38193, //optional
            token: "super_secret_key",
            push_streams: ["http://emerge.cc:8081/test"],
        }
    },
    real_machine: {
        id: 'real_machine',
        public: {
            cost: 2,
            title: "真机 #01",
            intro: "!真机!",
            view_streams: ["wss://emerge.ltd:8444/"]
        },
        private: {
            key: 38193, //optional
            push_streams: ["http://emerge:8081/test"],
        }
    },
    test_machine3: {
        id: 'test_machine3',
        public: {
            cost: 2,
            title: "本地视频流",
            intro: "非真机，用于调试视频流",
            view_streams: ["ws://localhost:8082/"]
        },
        private: {
            key: 38193, //optional
            push_streams: ["http://localhost:8081/test"],
        }
    }
});




//---LOGIC
function __build_machine_states() {
    for (var i in machinedb.data) {
        machinestates[i] = machinestates[i] || {
            session: false,
            id: i,
            user_on_request: false,
            /** {
             *  started: Date.now()?
             *  ended: Date.now() + ...
              * machine: xxx
                countdown: 0,
                gameresult: 0,
                state: 0, //began & so on
                user: -1,
                id: 0
            } */
            message: "",
            last_update: 0,
            up: false
        };
    }
}

function machine_is_up(id) {
    return machinestates[id] && machinestates[id].up;
}

function machine_valid_for_session(id) {
    if (!machine_is_up(id)) {
        return false;
    }
    return !machinestates[id].session && (
        (!machinestates[id].user_on_request ||
            Date.now() > machinestates[id].user_on_request.expire)
    )
}

var MACHINE_GUARD_INTERVAL = 1000;
var MACHINE_TIMEOUT = 1000 * 5;

function __guard_machine_quality() {
    for (var i in machinestates) {
        var _prev = machinestates[i].up;
        machinestates[i].up = (Date.now() - machinestates[i].last_update) < MACHINE_TIMEOUT;
        if (_prev != machinestates[i].up) {
            emitter.emit(machinestates[i].up ? "up" : "down", i);
        }
    }
}
setInterval(__guard_machine_quality, MACHINE_GUARD_INTERVAL);

function __guard_machine_user_on_request() {
    for (var i in machinestates) {
        if (machinestates[i].user_on_request && Date.now() > machinestates[i].user_on_request.expire) {
            machinestates[i].user_on_request = false;
        }
    }
}
setInterval(__guard_machine_user_on_request, 100);

function report_from_machine(machine_id, package) {
    if (!machinestates[machine_id]) return;
    for (var i in package) {
        if (machinestates[machine_id][i] != package[i]) {
            console.log("update_property", i);
            machinestates[machine_id][i] = package[i];
        }
    }
    machinestates[machine_id].up = true;
    machinestates[machine_id].last_update = Date.now();
}

//---EVENT EMITTERS
var event_endpoint = require("eventemitter2");
var emitter = new event_endpoint.EventEmitter2({
    wildcard: true
});
machinestates.observe((changes) => {
    emitter.emit("states", changes);
});
machinedb.event.on("observe", (changes) => {
    emitter.emit("db", changes);
});

__build_machine_states();

function send_command(machine_id, cmd) {
    if (machinestates[machine_id] && machinestates[machine_id].up) {
        emitter.emit("ctrl", {
            machine: machine_id,
            cmd: cmd
        })
    }
}

module.exports.db = machinedb;
module.exports.events = emitter;
module.exports.states = machinestates;
module.exports.send_command = send_command;
module.exports.report_from_machine = report_from_machine;
module.exports.machine_valid_for_session = machine_valid_for_session;

presist.dump("machine-state", machinestates);