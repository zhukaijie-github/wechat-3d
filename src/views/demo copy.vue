<script setup lang="ts">
import * as THREE from "three";

import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GroundedSkybox } from "three/addons/objects/GroundedSkybox.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";

const params = {
  height: 15,
  radius: 100,
  enabled: false,
  asset: "Arissa"
};
const assets = ["Arissa", "Jumping", "Running", "Walking"];
let camera, scene, renderer, skybox, loader, object, mixer;

async function init() {
  camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );
  camera.position.set(-20, 7, 20);
  camera.lookAt(0, 4, 0);

  scene = new THREE.Scene();

  const hdrLoader = new RGBELoader();
  const envMap = await hdrLoader.loadAsync("./hdr/2.hdr");
  envMap.mapping = THREE.EquirectangularReflectionMapping;

  skybox = new GroundedSkybox(envMap, params.height, params.radius);
  skybox.position.y = params.height - 0.01;
  scene.add(skybox);
  scene.environment = envMap;

  // 光线
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 5);
  hemiLight.position.set(0, 200, 0);
  scene.add(hemiLight);

  // 模型
  loader = new FBXLoader();
  loadAsset(params.asset);
  //

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  //

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.addEventListener("change", render);
  controls.target.set(0, 100, 0);
  controls.maxPolarAngle = THREE.MathUtils.degToRad(90);
  //   controls.maxDistance = 80;
  controls.minDistance = 200;
  controls.enablePan = false;
  controls.update();

  document.body.appendChild(renderer.domElement);
  window.addEventListener("resize", onWindowResize);

  const gui = new GUI();

  gui.add(params, "asset", assets).onChange(function (value) {
    if (value) {
      scene.add(skybox);
      scene.background = null;
    } else {
      scene.remove(skybox);
      scene.background = scene.environment;
    }
    loadAsset(value);
    render();
  });

  gui.open();
}

function loadAsset(asset: string) {
  console.log("🚀 ~ loadAsset ~ asset:", asset);
  loader.load(`./fbx/${asset}.fbx`, group => {
    if (object) {
      object.traverse(function (child) {
        if (child.material) child.material.dispose();
        if (child.material && child.material.map) child.material.map.dispose();
        if (child.geometry) child.geometry.dispose();
      });

      scene.remove(object);
    }

    //

    object = group;

    if (object.children && object.children.length) {
      const mesh = object.children[0];
      mesh.scale.set(2, 2, 2);
    }

    if (object.animations && object.animations.length) {
      mixer = new THREE.AnimationMixer(object);
      const action = mixer.clipAction(object.animations[0]);
      action.play();
    } else {
      mixer = null;
    }

    object.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scene.add(object);
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  render();
}

function render() {
  renderer.render(scene, camera);
}

onMounted(() => {
  init().then(render);
});
</script>
<template>
  <div></div>
</template>

<style lang="less" scoped></style>
