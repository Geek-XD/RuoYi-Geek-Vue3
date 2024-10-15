import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import * as THREE from 'three'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import { ColorRepresentation } from 'three';
/**
 * gltf/glb  fbx  obj+mtl(材质) 
 * @param model 
 * @param type 
 * @returns 
 */
export function loadModel(model: { gltf?: string, obj?: string, mtl?: string, fbx?: string }, type: "gltf" | "glb" | "obj" | "fbx"): Promise<any> {
    return new Promise((resolve, reject,) => {
        if ((type == "gltf" || type == "glb") && !!model.gltf) {
            const gltfloader = new GLTFLoader()
            const dracoLoader = new DRACOLoader();
            dracoLoader.setDecoderPath('three/examples/jsm/libs/draco/');
            gltfloader.setDRACOLoader(dracoLoader);
            gltfloader.load(model.gltf, m => {
                resolve(m.scene)
            })
        } else if (type == "obj" && !!model.obj) {
            if (!!model.mtl) {
                const mtlLoader = new MTLLoader()
                mtlLoader.load(model.mtl, (mtl) => {
                    mtl.preload()
                    const objLoader = new OBJLoader()
                    objLoader.setMaterials(mtl)
                    if (!!model.obj) {
                        objLoader.load(model.obj, resolve)
                    }
                })
            } else {
                const objLoader = new OBJLoader()
                objLoader.load(model.obj, resolve)
            }
        } else if (type == "fbx" && !!model.fbx) {
            const fbxLoader = new FBXLoader()
            fbxLoader.load(model.fbx, resolve)
        }
    })
}
interface DirectorOption {
    /** canvas DOM */
    canvas: HTMLCanvasElement,
    /** 宽度 */
    width: number,
    /** 高度 */
    height: number,
    /** 坐标 */
    axes?: {
        size?: number
    },
    /** 网格 */
    grid?: {
        size?: number,
        divisions?: number,
        color1?: ColorRepresentation,
        color2?: ColorRepresentation
    },
    /** 渲染之后 */
    afterRender?: Function,
    FPS?: number
}
export class Director {
    /** 场景 */
    scene = new THREE.Scene()
    /** 相机 */
    camera = new THREE.PerspectiveCamera()
    /** 渲染器 */
    renderer: THREE.WebGLRenderer
    /** 轨道控制器 */
    controls: OrbitControls
    /** 渲染组合器 */
    composer: EffectComposer
    /** FPS */
    FPS: number
    /** 环境光 */
    ambientLight: THREE.AmbientLight
    constructor(options: DirectorOption) {
        this.camera.position.z = 10
        this.camera.position.y = 2
        if (!!options.axes)
            this.scene.add(new THREE.AxesHelper(options.axes.size))
        if (!!options.grid)
            this.scene.add(new THREE.GridHelper(
                options.grid.size,
                options.grid.divisions,
                options.grid.color1,
                options.grid.color2
            ))

        this.ambientLight = new THREE.AmbientLight(0xffffff, 2)
        this.scene.add(this.ambientLight)
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            canvas: options.canvas
        });
        this.renderer.setSize(options.width, options.height)
        this.renderer.setClearColor(0xffffff);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        // 创建渲染通道
        const renderPass = new RenderPass(this.scene, this.camera);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(renderPass);

        // 渲染循环
        let clock = new THREE.Clock();
        let timeS = 0;
        let FPS = options.FPS || 30;
        this.FPS = 30
        let renderT = 1 / FPS; //单位秒  间隔多长时间渲染渲染一次
        const animate = () => {
            requestAnimationFrame(animate)
            //.getDelta()方法获得两帧的时间间隔
            let T = clock.getDelta();
            timeS = timeS + T;
            // requestAnimationFrame默认调用render函数60次，通过时间判断，降低renderer.render执行频率
            if (timeS > renderT) {
                this.controls.update();
                this.composer.render();
                this.FPS = 1 / timeS
                timeS = 0;
                if (options.afterRender) {
                    options.afterRender()
                }
            }
        }
        animate()
    }
}