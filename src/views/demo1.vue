<script setup lang="ts">
import { ref } from "vue";
import * as THREE from "three";
import {
  FBXLoader,
  OrbitControls,
  RGBELoader,
  GroundedSkybox,
  GLTFLoader,
  DRACOLoader
} from "three/examples/jsm/Addons.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
const params = {
  height: 15,
  radius: 100,
  enabled: false,
  asset: "23"
};

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
camera.position.set(5, 0, 20);
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
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
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

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("./gltf/");
let object, mixer;
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

function loadAsset() {
  loader.load(`./glb/demo.glb`, gltf => {
    const model = gltf.scene;
    gltf.scene.scale.multiplyScalar(9.5);
    const animations = gltf.animations;
    mixer = new THREE.AnimationMixer(model);
    const action = mixer.clipAction(animations[0]);
    action.play();
    scene.add(model);
  });
}

loadAsset();

// 鼠标控件
const controls = new OrbitControls(camera, renderer.domElement);
controls.addEventListener("change", render);
controls.target.set(0, 8, 0);
controls.maxPolarAngle = THREE.MathUtils.degToRad(90);
controls.maxDistance = 80;
controls.minDistance = 0;
controls.enablePan = false;
controls.update();

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
