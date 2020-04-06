import * as face from "./subsys-face";
import * as remote from "./subsys-remote";
import * as shared_actions from "./shared-actions";
import {
    eased
} from "./libao_stripped";

export var actions = shared_actions.actions

import * as three from "three"
import {
    GLTFLoader
} from "three/examples/jsm/loaders/GLTFLoader"

export var resources = {
    model_claw: {}
};

export var vueData = {
    scene: "main",
    bgScene: "main",
    picked_room: "",
    threeBg: {
        bgScaleCoeff: 0.2,
        visibility: eased(0, 0, 0.02, 0.00001),
        trigger: 0,
        sceneOffsetY: 0
    },
    synced: shared_actions.synced,
    local_state: shared_actions.local_state
};

window.vueData = vueData;


var gui_related_states = {};

export var data = {};
export var methods = {};


//lets setup three & soon


export function load(cb) {
    var loader = new GLTFLoader();
    loader.load("./models/claw_machine.gltf", (result) => {
        result.scene.traverse(function (child) {
            if ((child.material && child.material.name === 'Material.009') ||
                (child.material && child.material.name === 'Material.018')) {
                var mat = child.material;
                child.material = new three.MeshBasicMaterial({
                    map: mat.emissiveMap,
                    alphaMap: mat.emissiveMap,
                    side: three.DoubleSide,
                    depthWrite: false,
                    transparent: true
                });
            } 
            child.castShadow = child.receiveShadow = true;
        });
        resources.model_claw = result.scene;
        console.log(result.scene);
        cb();
    })

}