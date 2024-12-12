import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import * as THREE from 'three'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { SelectControls } from './SelectControls';
/**
 * gltf/glb  fbx  obj+mtl(材质) 
 * @param model 
 * @param type 
 * @returns 
 */
export function loadModel(model: { gltf?: string, obj?: string, mtl?: string, fbx?: string }, type: "gltf" | "glb" | "obj" | "fbx", onProgress?: (progress: ProgressEvent<EventTarget>) => void): Promise<any> {
    return new Promise((resolve, reject,) => {
        if ((type == "gltf" || type == "glb") && !!model.gltf) {
            const gltfloader = new GLTFLoader()
            const dracoLoader = new DRACOLoader();
            dracoLoader.setDecoderPath('/draco/gltf/');
            dracoLoader.setDecoderConfig({ type: "js" });
            dracoLoader.preload();
            gltfloader.setDRACOLoader(dracoLoader);
            gltfloader.load(
                model.gltf,
                load => {
                    console.log(load);
                    resolve(load.scene)
                },
                progress => {
                    if (onProgress) onProgress(progress)
                },
                error => {
                    console.log(error);
                }
            )
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

export function getWorldCenterPosition(box: THREE.Box3, scalar = 0.5): THREE.Vector3 {
    return new THREE.Vector3().addVectors(box.max, box.min).multiplyScalar(scalar);
}

class ExplodeControls extends THREE.Controls<{}> {
    constructor(object: THREE.Object3D) {
        super(object, null)
    }
}
// 初始化爆炸数据保存到每个mesh的userdata上
export function initExplodeModel(modelObject: THREE.Object3D) {
    if (!modelObject) return;

    // 计算模型中心
    const explodeBox = new THREE.Box3();
    explodeBox.setFromObject(modelObject);
    const explodeCenter = getWorldCenterPosition(explodeBox);

    const meshBox = new THREE.Box3();
    modelObject.userData.canExplode = true;
    // 遍历整个模型，保存数据到userData上，以便爆炸函数使用
    modelObject.traverse(function (value: any) {
        if (value.isLine || value.isSprite) return;
        if (value.isMesh) {
            meshBox.setFromObject(value);

            const meshCenter = getWorldCenterPosition(meshBox);
            // 爆炸方向
            value.userData.canExplode = true;
            value.userData.worldDir = new THREE.Vector3()
                .subVectors(meshCenter, explodeCenter)
                .normalize();
            // 爆炸距离 mesh中心点到爆炸中心点的距离
            value.userData.worldDistance = new THREE.Vector3().subVectors(meshCenter, explodeCenter);
            // 原始坐标
            value.userData.originPosition = value.getWorldPosition(new THREE.Vector3());
            // mesh中心点
            value.userData.meshCenter = meshCenter.clone();
            value.userData.explodeCenter = explodeCenter.clone();
        }
    });
}

// 模型爆炸函数 
export function explodeModel(model: THREE.Object3D, scalar: number) {
    model.traverse(function (value) {
        // @ts-ignore
        if (!value.isMesh || !value.userData.originPosition) return;
        const distance = value.userData.worldDir
            .clone()
            .multiplyScalar(value.userData.worldDistance.length() * scalar);
        const offset = new THREE.Vector3().subVectors(
            value.userData.meshCenter,
            value.userData.originPosition
        );
        const center = value.userData.explodeCenter;
        const newPos = new THREE.Vector3().copy(center).add(distance).sub(offset);
        const localPosition = value.parent?.worldToLocal(newPos.clone());
        localPosition && value.position.copy(localPosition);
    });
};

interface DirectorOption {
    /** canvas DOM */
    canvas: HTMLCanvasElement,
    /** 宽度 */
    width: number,
    /** 高度 */
    height: number,
    /** 渲染之后 */
    afterRender?: Function,
    FPS?: number
}
export interface TreeNode {
    label: string;
    id: string;
    children: TreeNode[];
}

export class Director {
    /** 场景 */
    scene = new THREE.Scene()
    /** 相机 */
    camera = new THREE.PerspectiveCamera()
    /** 时钟 */
    clock = new THREE.Clock()
    /** 渲染器 */
    renderer: THREE.WebGLRenderer
    /** 轨道控制器 */
    controls: THREE.Controls<{}>
    selectControls: SelectControls
    /** 渲染组合器 */
    composer: EffectComposer
    /** FPS */
    FPS: number
    /** 环境光 */
    ambientLight: THREE.AmbientLight = new THREE.AmbientLight(0xffffff, 2)
    /** 辅助坐标 */
    axesHelper: THREE.AxesHelper = new THREE.AxesHelper(100)
    showAxesHelper: boolean = false
    /** 辅助网格 */
    gridHelper: THREE.GridHelper = new THREE.GridHelper(100, 100)
    showGridHelper: boolean = false
    /** 状态监控 */
    stats: Stats = new Stats()
    /** 窗口大小 */
    width: number
    height: number

    constructor(options: DirectorOption) {
        this.width = options.width
        this.height = options.height
        this.camera.position.z = 10
        this.camera.position.y = 2
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
        // 创建描边选项
        this.selectControls = new SelectControls(this.scene, this.camera, this.renderer.domElement)
        this.composer.addPass(renderPass);
        this.composer.addPass(this.selectControls.outlinePass);

        this.FPS = options.FPS || 30
    }
    switchAxesHelper(show: boolean) {
        if (show && !this.showAxesHelper) {
            this.scene.add(this.axesHelper)
            this.showAxesHelper = false
        } else {
            this.scene.remove(this.axesHelper)
        }
    }
    switchGridHelper(show: boolean) {
        if (show && !this.showGridHelper) {
            this.scene.add(this.gridHelper)
            this.showGridHelper = true
        } else {
            this.scene.remove(this.gridHelper)
            this.showGridHelper = false
        }
    }
    generateTreeData() {
        function _generateTreeData(node: THREE.Object3D<THREE.Object3DEventMap>, parent: TreeNode | null = null) {
            const treeItem = {
                label: node.name || node.type,
                id: `${parent ? parent.id + '.' : ''}${node.uuid}`, // 使用唯一标识符作为id
                children: new Array<TreeNode>()
            }
            if (node.children && node.children.length > 0) {
                for (let child of node.children) {
                    treeItem.children.push(_generateTreeData(child, treeItem));
                }
            }
            return treeItem;
        }
        return _generateTreeData(this.scene).children
    }
    getObjectByUUID(uuidPath: string) {
        const uuids = uuidPath.split('.');
        let currentObject: THREE.Object3D = this.scene;
        for (let i = 1; i < uuids.length; i++) {
            const uuid = uuids[i];
            let found = null;
            if (currentObject.children) {
                for (let j = 0; j < currentObject.children.length; j++) {
                    const child = currentObject.children[j];
                    if (child.uuid === uuid) {
                        found = child;
                        break;
                    }
                }
            }
            if (!found) {
                console.log(`未找到具有UUID ${uuid} 的对象`);
                return null;
            }
            currentObject = found;
        }
        return currentObject;
    }
    startRender(onRander?: (FPS: number) => void) {
        let timeS = 0;
        let realFPS = 0;
        const animate = () => {
            requestAnimationFrame(animate)
            let T = this.clock.getDelta();
            timeS = timeS + T;
            if (timeS > 1 / this.FPS) {
                this.stats.update()
                this.controls.update(T);
                this.composer.render();
                realFPS = 1 / timeS
                timeS = 0;
                if (onRander) onRander(realFPS)
            }
        }
        animate()

    }
}