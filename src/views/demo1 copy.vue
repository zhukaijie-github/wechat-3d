<script setup lang="ts">
import { ref } from "vue";
import * as THREE from "three";
import {
  FBXLoader,
  OrbitControls,
  RGBELoader,
  GroundedSkybox
} from "three/examples/jsm/Addons.js";
const params = {
  height: 15,
  radius: 100,
  enabled: false,
  asset: "23"
};
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

const assets = ["Arissa", "Jumping", "Running", "Walking"];
const canvasRef = ref<HTMLElement>();
const clock = new THREE.Clock();
// 场景
const scene = new THREE.Scene();

// 相机
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);
// camera.position.set(0, 100, 500);
camera.position.set(-20, 7, 20);
camera.lookAt(scene.position);

// 渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setClearColor("#f2f2f2");
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(render);

// 背景
const hdrLoader = new RGBELoader();
let skybox;
hdrLoader.load(
  "./hdr/2.hdr",
  texture => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    skybox = new GroundedSkybox(texture, 15, 100);
    skybox.position.y = 15 - 0.01;
    scene.add(skybox);
    scene.environment = texture;
  },
  undefined,
  err => console.error(err)
);

// 光线
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 50);
hemiLight.position.set(0, 200, 0);
scene.add(hemiLight);

//添加平行光
const dirLight = new THREE.DirectionalLight(0xffffff, 3);
dirLight.position.set(-3, 10, -10);
dirLight.castShadow = true;
dirLight.shadow.camera.top = 2;
dirLight.shadow.camera.bottom = -2;
dirLight.shadow.camera.left = -2;
dirLight.shadow.camera.right = 2;
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 40;
scene.add(dirLight);

// FBXLoader
let object, mixer;
const loader = new FBXLoader();

function loadAsset(asset) {
  loader.load(`./fbx/${asset}.fbx`, group => {
    if (object) {
      object.traverse(function (child) {
        if (child.material) child.material.dispose();
        if (child.material && child.material.map) child.material.map.dispose();
        if (child.geometry) child.geometry.dispose();
      });

      scene.remove(object);
    }

    object = group;

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

loadAsset(params.asset);

// 鼠标控件
const controls = new OrbitControls(camera, renderer.domElement);
controls.addEventListener("change", render);
controls.target.set(0, 100, 0);
controls.maxPolarAngle = THREE.MathUtils.degToRad(90);
controls.maxDistance = 1000;
controls.minDistance = 100;
controls.enablePan = false;
controls.update();

const gui = new GUI();
gui.add(params, "asset", assets).onChange(function (value) {
  loadAsset(value);
});

// 渲染

function render() {
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  renderer.render(scene, camera);
}

// 窗口大小改变
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", onWindowResize);

onMounted(() => {
  canvasRef.value?.appendChild(renderer.domElement);
});
</script>

<template>
  <div ref="canvasRef"></div>
</template>

<style lang="less" scoped></style>
