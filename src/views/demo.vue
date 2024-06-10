<script setup lang="ts">
import * as THREE from "three";
import {
  FBXLoader,
  OrbitControls,
  RGBELoader,
  GroundedSkybox,
  GLTFLoader,
  DRACOLoader
} from "three/examples/jsm/Addons.js";

const containerRef = ref<HTMLDivElement>();
const loadingPercent = ref(0);
const loadingText = computed(() => loadingPercent.value.toFixed(0) + "%");
const showLoading = ref(true);
const showModel = ref(false);
let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let clock: THREE.Clock;
let mixer: THREE.AnimationMixer;
let controls: OrbitControls;
let actions: THREE.AnimationAction[];

//创建场景
const initScene = () => {
  clock = new THREE.Clock();
  scene = new THREE.Scene();
};

// 创建相机
const initCamera = () => {
  camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
  );
  camera.position.set(-5, 0, 20);
  camera.lookAt(scene.position);
};

// 创建渲染器
const initRender = () => {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor("#24273f");
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(sceneAnimation);
};

//渲染场景
const render = () => {
  renderer.render(scene, camera);
};

// 创建光源
const initLight = () => {
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
};

// 创建背景
const initBg = () => {
  const hdrLoader = new RGBELoader();
  hdrLoader.load(
    "./hdr/2.hdr",
    texture => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      const skybox = new GroundedSkybox(texture, 15, 100);
      skybox.position.y = 15 - 0.01;
      scene.add(skybox);
      scene.environment = texture;
    },
    undefined,
    err => console.error(err)
  );
};

// 创建控制器
const initControls = () => {
  controls = new OrbitControls(camera, renderer.domElement);
  controls.addEventListener("change", sceneAnimation);
  controls.target.set(0, 8, 0);
  controls.maxPolarAngle = THREE.MathUtils.degToRad(90);
  controls.maxDistance = 80;
  controls.minDistance = 0;
  controls.enablePan = false;
  controls.update();
};

// 创建模型加载器
const initLoader = () => {
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("./gltf/");
  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);

  loader.load(
    `./glb/demo.glb`,
    gltf => {
      const model = gltf.scene;
      gltf.scene.scale.multiplyScalar(9.5);
      const animations = gltf.animations;
      mixer = new THREE.AnimationMixer(model);
      actions = animations.map(animation => mixer.clipAction(animation));
      actions[2].play();
      scene.add(model);
    },
    function (xhr) {
      loadingPercent.value = xhr.loaded / xhr.total;
      if (loadingPercent.value >= 1) {
        nextTick(() => {
          setTimeout(() => {
            showLoading.value = false;
            showModel.value = true;
          }, 500);
        });
      }
    }
  );
};

// 使用动画器不断更新场景
const sceneAnimation = () => {
  let delta = clock.getDelta();
  if (mixer) {
    mixer.update(delta);
  }
  //渲染
  render();
};

// 点击按钮执行动作
const handleClick = (type: number) => {
  mixer.stopAllAction();
  if (type !== -1) {
    actions[type].play();
  }
};

// 初始化加载
const init = async () => {
  initScene();
  initCamera();
  initRender();
  initLoader();
  initLight();
  initBg();
  initControls();
  sceneAnimation();
};

// 监听窗口变化
const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
};

window.addEventListener("resize", onWindowResize);

onMounted(() => {
  init();
  containerRef.value?.appendChild(renderer.domElement);
});
</script>
<template>
  <div class="demo-wrapper">
    <div
      v-if="showLoading"
      class="fixed top-0 left-0 flex items-center justify-center w-full h-full z-50 bg-[#24273f]"
    >
      <van-circle
        v-model:current-rate="loadingPercent"
        :speed="100"
        :text="loadingText"
        :layer-color="'#a6a7b1'"
        :color="{
          '0%': '#3fecff',
          '100%': '#6149f6'
        }"
      />
    </div>
    <div ref="containerRef"></div>
    <div
      class="fixed flex flex-col right-[10px] bottom-[10px] w-[30px] z-20"
      v-if="!showLoading && showModel"
    >
      <div class="action-btn mb-[10px] is-jump" @click="handleClick(0)"></div>
      <div class="action-btn mb-[10px] is-run" @click="handleClick(1)"></div>
      <div class="action-btn mb-[10px] is-stand" @click="handleClick(2)"></div>
      <div class="action-btn mb-[10px] is-walk" @click="handleClick(3)"></div>
      <div class="action-btn mb-[10px] is-stop" @click="handleClick(-1)"></div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.demo-wrapper {
  :deep(.van-circle__text) {
    color: #a6a7b1;
  }
}
.action-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #fff;
  box-shadow: 0 4px 8px rgba(255, 255, 255, 0.5);
  background-repeat: no-repeat;
  background-size: 20px 20px;
  background-position: center center;
  &.is-jump {
    background-image: url("@/assets/png/001-happy.png");
  }
  &.is-run {
    background-image: url("@/assets/png/002-running.png");
  }
  &.is-stand {
    background-image: url("@/assets/png/004-man.png");
  }
  &.is-walk {
    background-image: url("@/assets/png/003-walking.png");
  }
  &.is-stop {
    background-image: url("@/assets/png/005-body.png");
  }
}
</style>
