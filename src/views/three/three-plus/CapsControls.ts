import * as THREE from 'three'
import { loadModel } from './ThreeHelper';

type AxisKey = "x1" | "y1" | "z1" | "x2" | "y2" | "z2";
export function setToNormalizedDeviceCoordinates(
	vector: THREE.Vector2,
	event: MouseEvent | TouchEvent,
	window: Window
) {
	vector.x = event instanceof MouseEvent ? event.clientX : (event.touches && event.touches[0].clientX);
	vector.y = event instanceof MouseEvent ? event.clientY : (event.touches && event.touches[0].clientY);
	vector.x = (vector.x / window.innerWidth) * 2 - 1;
	vector.y = - (vector.y / window.innerHeight) * 2 + 1;
}

class Geometry extends THREE.BufferGeometry {
	private vertices: THREE.Vector3[] = [];

	constructor() {
		super();
	}

	push(...args: THREE.Vector3[]) {
		this.vertices = this.vertices.concat(args);
		const points = this.vertices.flatMap(v => [v.x, v.y, v.z]);
		const positionAttribute = new THREE.Float32BufferAttribute(points, 3);
		this.setAttribute('position', positionAttribute);
	}

	set dynamic(value: boolean) {
		this.attributes.position.needsUpdate = value;
	}

	get dynamic() {
		return this.attributes.position.needsUpdate;
	}

	set verticesNeedUpdate(value: boolean) {
		const points = this.vertices.flatMap(v => [v.x, v.y, v.z]);
		const positionAttribute = new THREE.Float32BufferAttribute(points, 3);
		this.setAttribute('position', positionAttribute);
		this.attributes.position.needsUpdate = value;
	}

	get verticesNeedUpdate() {
		return this.attributes.position.needsUpdate;
	}

	computeLineDistances() {
		const positions = this.attributes.position.array;
		if (positions.length === 0) return;

		const lineDistances = [0];
		let totalDistance = 0;

		for (let i = 1; i < positions.length / 3; i++) {
			const x1 = positions[(i - 1) * 3];
			const y1 = positions[(i - 1) * 3 + 1];
			const z1 = positions[(i - 1) * 3 + 2];

			const x2 = positions[i * 3];
			const y2 = positions[i * 3 + 1];
			const z2 = positions[i * 3 + 2];

			const dx = x2 - x1;
			const dy = y2 - y1;
			const dz = z2 - z1;

			const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
			totalDistance += distance;
			lineDistances.push(totalDistance);
		}

		const lineDistancesAttribute = new THREE.Float32BufferAttribute(lineDistances, 1);
		this.setAttribute('lineDistance', lineDistancesAttribute);
	}
}
class PlaneGeometry extends Geometry {
	constructor(v0: THREE.Vector3, v1: THREE.Vector3, v2: THREE.Vector3, v3: THREE.Vector3) {
		super();
		super.push(v0, v1, v2, v3);
		// 计算法线
		super.computeVertexNormals();
	}
}
class CapsMesh extends THREE.Mesh {
	constructor(geometry: PlaneGeometry, material: THREE.ShaderMaterial, public axis: AxisKey, public guardian: SelectionBoxFace) {
		super(geometry, material);
	}
}
class SelectionBoxFace {
	lines: SelectionBoxLine[] = []
	constructor(axis: AxisKey, v0: THREE.Vector3, v1: THREE.Vector3, v2: THREE.Vector3, v3: THREE.Vector3, selection: Selection) {
		const frontFaceGeometry = new CAPS.PlaneGeometry(v0, v1, v2, v3);
		frontFaceGeometry.dynamic = true;
		selection.meshGeometries.push(frontFaceGeometry);

		const frontFaceMesh = new CapsMesh(frontFaceGeometry, CAPS.MATERIAL.Invisible, axis, this);
		selection.touchMeshes.add(frontFaceMesh);
		selection.selectables.push(frontFaceMesh);

		const backFaceGeometry = new CAPS.PlaneGeometry(v3, v2, v1, v0);
		backFaceGeometry.dynamic = true;
		selection.meshGeometries.push(backFaceGeometry);

		const backFaceMesh = new THREE.Mesh(backFaceGeometry, CAPS.MATERIAL.BoxBackFace);
		selection.displayMeshes.add(backFaceMesh);
	}

	rayOver() {
		this.highlightLines(true);
	}

	rayOut() {
		this.highlightLines(false);
	}

	highlightLines(b: boolean) {
		for (let i = 0; i < this.lines.length; i++) {
			this.lines[i].setHighlight(b);
		}
	}
}


class SelectionBoxLine {
	line: THREE.LineSegments;
	constructor(v0: THREE.Vector3, v1: THREE.Vector3, f0: SelectionBoxFace, f1: SelectionBoxFace, selection: Selection) {
		const lineGeometry = new Geometry();
		lineGeometry.push(v0, v1);
		// 手动计算线段距离
		lineGeometry.computeLineDistances();
		lineGeometry.dynamic = true;
		selection.lineGeometries.push(lineGeometry);

		this.line = new THREE.LineSegments(lineGeometry, CAPS.MATERIAL.BoxWireframe);
		selection.displayMeshes.add(this.line);

		f0.lines.push(this);
		f1.lines.push(this);
	}

	setHighlight(b: boolean) {
		this.line.material = b ? CAPS.MATERIAL.BoxWireActive : CAPS.MATERIAL.BoxWireframe;
	}
}
class Selection {
	faces: SelectionBoxFace[] = [];
	box: THREE.BoxGeometry = new THREE.BoxGeometry(1, 1, 1);
	boxMesh: THREE.Mesh;
	vertices: THREE.Vector3[];
	touchMeshes: THREE.Object3D = new THREE.Object3D();
	displayMeshes: THREE.Object3D = new THREE.Object3D();
	meshGeometries: PlaneGeometry[] = [];
	lineGeometries: Geometry[] = [];
	selectables: THREE.Mesh[] = [];

	constructor(public limitLow: THREE.Vector3, public limitHigh: THREE.Vector3) {
		this.boxMesh = new THREE.Mesh(this.box, CAPS.MATERIAL.cap());
		this.vertices = [
			new THREE.Vector3(), new THREE.Vector3(),
			new THREE.Vector3(), new THREE.Vector3(),
			new THREE.Vector3(), new THREE.Vector3(),
			new THREE.Vector3(), new THREE.Vector3()
		];
		this.updateVertices();
		const v = this.vertices;
		const f = this.faces;
		this.faces.push(new CAPS.SelectionBoxFace('y1', v[0], v[1], v[5], v[4], this));
		this.faces.push(new CAPS.SelectionBoxFace('z1', v[0], v[2], v[3], v[1], this));
		this.faces.push(new CAPS.SelectionBoxFace('x1', v[0], v[4], v[6], v[2], this));
		this.faces.push(new CAPS.SelectionBoxFace('x2', v[7], v[5], v[1], v[3], this));
		this.faces.push(new CAPS.SelectionBoxFace('y2', v[7], v[3], v[2], v[6], this));
		this.faces.push(new CAPS.SelectionBoxFace('z2', v[7], v[6], v[4], v[5], this));

		const l0 = new CAPS.SelectionBoxLine(v[0], v[1], f[0], f[1], this);
		const l1 = new CAPS.SelectionBoxLine(v[0], v[2], f[1], f[2], this);
		const l2 = new CAPS.SelectionBoxLine(v[0], v[4], f[0], f[2], this);
		const l3 = new CAPS.SelectionBoxLine(v[1], v[3], f[1], f[3], this);
		const l4 = new CAPS.SelectionBoxLine(v[1], v[5], f[0], f[3], this);
		const l5 = new CAPS.SelectionBoxLine(v[2], v[3], f[1], f[4], this);
		const l6 = new CAPS.SelectionBoxLine(v[2], v[6], f[2], f[4], this);
		const l7 = new CAPS.SelectionBoxLine(v[3], v[7], f[3], f[4], this);
		const l8 = new CAPS.SelectionBoxLine(v[4], v[5], f[0], f[5], this);
		const l9 = new CAPS.SelectionBoxLine(v[4], v[6], f[2], f[5], this);
		const l10 = new CAPS.SelectionBoxLine(v[5], v[7], f[3], f[5], this);
		const l11 = new CAPS.SelectionBoxLine(v[6], v[7], f[4], f[5], this);

		this.setBox();
		this.setUniforms();
	}

	updateVertices() {
		this.vertices[0].set(this.limitLow.x, this.limitLow.y, this.limitLow.z);
		this.vertices[1].set(this.limitHigh.x, this.limitLow.y, this.limitLow.z);
		this.vertices[2].set(this.limitLow.x, this.limitHigh.y, this.limitLow.z);
		this.vertices[3].set(this.limitHigh.x, this.limitHigh.y, this.limitLow.z);
		this.vertices[4].set(this.limitLow.x, this.limitLow.y, this.limitHigh.z);
		this.vertices[5].set(this.limitHigh.x, this.limitLow.y, this.limitHigh.z);
		this.vertices[6].set(this.limitLow.x, this.limitHigh.y, this.limitHigh.z);
		this.vertices[7].set(this.limitHigh.x, this.limitHigh.y, this.limitHigh.z);
	}

	updateGeometries() {
		for (let i = 0; i < this.meshGeometries.length; i++) {
			this.meshGeometries[i].verticesNeedUpdate = true;
			this.meshGeometries[i].computeBoundingSphere();
			this.meshGeometries[i].computeBoundingBox();
		}
		for (let i = 0; i < this.lineGeometries.length; i++) {
			this.lineGeometries[i].verticesNeedUpdate = true;
		}
	}

	setBox() {
		const width = new THREE.Vector3();
		width.subVectors(this.limitHigh, this.limitLow);

		this.boxMesh.scale.copy(width);
		width.multiplyScalar(0.5).add(this.limitLow);
		this.boxMesh.position.copy(width);
	}

	setUniforms() {
		const uniforms = CAPS.UNIFORMS.clipping;
		uniforms.clippingLow.value.copy(this.limitLow);
		uniforms.clippingHigh.value.copy(this.limitHigh);
	}

	setValue(axis: AxisKey, value: number) {
		const buffer = 0.4;
		const limit = 14;

		if (axis === 'x1') {
			this.limitLow.x = Math.max(-limit, Math.min(this.limitHigh.x - buffer, value));
		} else if (axis === 'x2') {
			this.limitHigh.x = Math.max(this.limitLow.x + buffer, Math.min(limit, value));
		} else if (axis === 'y1') {
			this.limitLow.y = Math.max(-limit, Math.min(this.limitHigh.y - buffer, value));
		} else if (axis === 'y2') {
			this.limitHigh.y = Math.max(this.limitLow.y + buffer, Math.min(limit, value));
		} else if (axis === 'z1') {
			this.limitLow.z = Math.max(-limit, Math.min(this.limitHigh.z - buffer, value));
		} else if (axis === 'z2') {
			this.limitHigh.z = Math.max(this.limitLow.z + buffer, Math.min(limit, value));
		}

		this.setBox();
		this.setUniforms();

		this.updateVertices();
		this.updateGeometries();
	}
}
class Simulation {
	capsScene: THREE.Scene = new THREE.Scene();
	backStencil: THREE.Scene = new THREE.Scene();
	frontStencil: THREE.Scene = new THREE.Scene();
	selection: Selection;
	showCaps: boolean = true
	constructor(
		public renderer: THREE.WebGLRenderer,
		public camera: THREE.PerspectiveCamera,
		public scene: THREE.Scene,
		public controls: THREE.Controls<{}>,

	) {
		this.selection = new CAPS.Selection(
			new THREE.Vector3(-7, -14, -14),
			new THREE.Vector3(14, 9, 3)
		);
		this.init();
	}

	init() {
		const self = this;
		loadModel({ gltf: '/glb/2.glb' }, "glb").then(m => {
			self.initScene(m);
		})
		this.camera.position.set(20, 20, 30);
		this.camera.lookAt(new THREE.Vector3(0, 0, 0));
		this.capsScene.add(this.selection.boxMesh);
		this.scene.add(this.selection.touchMeshes);
		this.scene.add(this.selection.displayMeshes);

		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setClearColor(0xffffff);
		this.renderer.autoClear = false;

		CAPS.picking(this); // must come before 

		const onWindowResize = () => {
			this.camera.aspect = window.innerWidth / window.innerHeight;
			this.camera.updateProjectionMatrix();
			this.renderer.setSize(window.innerWidth, window.innerHeight);
		};
		window.addEventListener('resize', onWindowResize, false);
	}

	initScene(collada: THREE.Object3D) {
		const setMaterial = (node: THREE.Object3D, material: THREE.ShaderMaterial | ((...age: any[]) => THREE.ShaderMaterial)) => {
			if (node instanceof THREE.Mesh || node instanceof THREE.Line) {
				if (typeof material === 'function') {
					node.material = material(node.material);
				} else {
					node.material = material;
				}
			}
			if (node.children) {
				for (let i = 0; i < node.children.length; i++) {
					setMaterial(node.children[i], material);
				}
			}
		};
		const scale = 0.3
		const back = collada.clone();
		setMaterial(back, CAPS.MATERIAL.backStencil);
		back.scale.set(scale, scale, scale);
		back.updateMatrix();
		this.backStencil.add(back);

		const front = collada.clone();
		setMaterial(front, CAPS.MATERIAL.frontStencil);
		front.scale.set(scale, scale, scale);
		front.updateMatrix();
		this.frontStencil.add(front);

		setMaterial(collada, CAPS.MATERIAL.sheet);
		collada.scale.set(scale, scale, scale);
		collada.updateMatrix();
		this.scene.add(collada);
	}

	update() {
		this.renderer.render(this.backStencil, this.camera);
		this.renderer.render(this.capsScene, this.camera);
		this.renderer.render(this.frontStencil, this.camera);
	}
}
const MeshStandardMaterialToShaderMaterial = (msm: THREE.MeshStandardMaterial, sm: THREE.ShaderMaterial) => {
	// 迁移基础属性
	if (msm.color) {
		sm.uniforms['color'].value.copy(msm.color);
	}
	sm.uniforms['roughness'].value = msm.roughness;
	sm.uniforms['metalness'].value = msm.metalness;
	if (msm.emissive) {
		sm.uniforms['emissive'].value.copy(msm.emissive);
	}
	sm.uniforms['opacity'].value = msm.opacity;

	// 迁移纹理属性
	if (msm.envMap) {
		sm.uniforms['envMap'].value = msm.envMap;
		sm.uniforms['envMapIntensity'].value = msm.envMapIntensity;
	}

	if (msm.lightMap) {
		sm.uniforms['lightMap'].value = msm.lightMap;
		sm.uniforms['lightMapIntensity'].value = msm.lightMapIntensity;
	}

	if (msm.aoMap) {
		sm.uniforms['aoMap'].value = msm.aoMap;
		sm.uniforms['aoMapIntensity'].value = msm.aoMapIntensity;
	}

	if (msm.bumpMap) {
		sm.uniforms['bumpMap'].value = msm.bumpMap;
		sm.uniforms['bumpScale'].value = msm.bumpScale;
	}

	if (msm.normalMap) {
		sm.uniforms['normalMap'].value = msm.normalMap;
		sm.uniforms['normalScale'].value.copy(msm.normalScale);
	}

	if (msm.displacementMap) {
		sm.uniforms['displacementMap'].value = msm.displacementMap;
		sm.uniforms['displacementScale'].value = msm.displacementScale;
		sm.uniforms['displacementBias'].value = msm.displacementBias;
	}

	if (msm.alphaMap) {
		sm.uniforms['alphaMap'].value = msm.alphaMap;
	}

	// 确保其他属性也被正确设置
	sm.side = msm.side;
	sm.transparent = msm.transparent;
	sm.depthTest = msm.depthTest;
	sm.depthWrite = msm.depthWrite;
	sm.blending = msm.blending;
	sm.alphaTest = msm.alphaTest;
	sm.blendSrc = msm.blendSrc;
	sm.blendDst = msm.blendDst;
	sm.blendEquation = msm.blendEquation;
	sm.dithering = msm.dithering;
	sm.premultipliedAlpha = msm.premultipliedAlpha;
	sm.visible = msm.visible;
	sm.toneMapped = msm.toneMapped;
}
const CAPS = {
	PlaneGeometry,
	SelectionBoxFace,
	SelectionBoxLine,
	Selection,
	Simulation,
	UNIFORMS: {

		clipping: {
			color: { type: "c", value: new THREE.Color(0x3d9ecb) },
			clippingLow: { type: "v3", value: new THREE.Vector3(0, 0, 0) },
			clippingHigh: { type: "v3", value: new THREE.Vector3(0, 0, 0) }
		},

		caps: {
			color: { type: "c", value: new THREE.Color(0xf83610) }
		}

	},
	SCHEDULE: {
		postpone: (callback: Function, context: any, wait: number) => {
			return (...args: any[]) => {
				setTimeout(() => {
					callback.apply(context, args);
				}, wait);
			};
		},
	},
	SHADER: {
		vertex: `
			uniform vec3 color;
			varying vec3 pixelNormal;
	
			void main() {
	
				pixelNormal = normal;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
	
			}`,

		vertexClipping: `
			uniform vec3 color;
			uniform vec3 clippingLow;
			uniform vec3 clippingHigh;
	
			varying vec3 pixelNormal;
			varying vec4 worldPosition;
			varying vec3 camPosition;
	
			void main() {
	
				pixelNormal = normal;
				worldPosition = modelMatrix * vec4( position, 1.0 );
				camPosition = cameraPosition;
	
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
	
			}`,

		fragment: `
			uniform vec3 color;
			varying vec3 pixelNormal;
	
			void main( void ) {
	
				float shade = (
					  3.0 * pow ( abs ( pixelNormal.y ), 2.0 )
					+ 2.0 * pow ( abs ( pixelNormal.z ), 2.0 )
					+ 1.0 * pow ( abs ( pixelNormal.x ), 2.0 )
				) / 3.0;
	
				gl_FragColor = vec4( color * shade, 1.0 );
	
			}`,

		fragmentClipping: `
			uniform vec3 color;
			uniform vec3 clippingLow;
			uniform vec3 clippingHigh;
	
			varying vec3 pixelNormal;
			varying vec4 worldPosition;
	
			void main( void ) {
	
				float shade = (
					  3.0 * pow ( abs ( pixelNormal.y ), 2.0 )
					+ 2.0 * pow ( abs ( pixelNormal.z ), 2.0 )
					+ 1.0 * pow ( abs ( pixelNormal.x ), 2.0 )
				) / 3.0;
	
				if (
					   worldPosition.x < clippingLow.x
					|| worldPosition.x > clippingHigh.x
					|| worldPosition.y < clippingLow.y
					|| worldPosition.y > clippingHigh.y
					|| worldPosition.z < clippingLow.z
					|| worldPosition.z > clippingHigh.z
				) {
	
					discard;
	
				} else {
	
					gl_FragColor = vec4( color * shade, 1.0 );
	
				}
	
			}`,

		fragmentClippingFront: `
			uniform vec3 color;
			uniform vec3 clippingLow;
			uniform vec3 clippingHigh;
	
			varying vec3 pixelNormal;
			varying vec4 worldPosition;
			varying vec3 camPosition;
	
			void main( void ) {
	
				float shade = (
					  3.0 * pow ( abs ( pixelNormal.y ), 2.0 )
					+ 2.0 * pow ( abs ( pixelNormal.z ), 2.0 )
					+ 1.0 * pow ( abs ( pixelNormal.x ), 2.0 )
				) / 3.0;
	
				if (
					   worldPosition.x < clippingLow.x  && camPosition.x < clippingLow.x
					|| worldPosition.x > clippingHigh.x && camPosition.x > clippingHigh.x
					|| worldPosition.y < clippingLow.y  && camPosition.y < clippingLow.y
					|| worldPosition.y > clippingHigh.y && camPosition.y > clippingHigh.y
					|| worldPosition.z < clippingLow.z  && camPosition.z < clippingLow.z
					|| worldPosition.z > clippingHigh.z && camPosition.z > clippingHigh.z
				) {
	
					discard;
	
				} else {
	
					gl_FragColor = vec4( color * shade, 1.0 );
	
				}
	
			}`,

		invisibleVertexShader: `
			void main() {
				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
				gl_Position = projectionMatrix * mvPosition;
			}`,

		invisibleFragmentShader: `
			void main( void ) {
				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				discard;
			}`

	},
	MATERIAL: {
		BoxBackFace: new THREE.MeshBasicMaterial({ color: 0xEEDDCC, transparent: true }),
		BoxWireframe: new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 }),
		BoxWireActive: new THREE.LineBasicMaterial({ color: 0xf83610, linewidth: 4 }),
		cap: () => {
			return new THREE.ShaderMaterial({
				uniforms: CAPS.UNIFORMS.caps,
				vertexShader: CAPS.SHADER.vertex,
				fragmentShader: CAPS.SHADER.fragment
			})
		},

		sheet: (material?: THREE.MeshStandardMaterial): THREE.ShaderMaterial => {
			const shaderMaterial = new THREE.ShaderMaterial({
				// 设置默认值
				uniforms: {
					...CAPS.UNIFORMS.clipping,
					color: { value: new THREE.Color(0xffffff) }, // 默认白色
					roughness: { value: 0.5 },
					metalness: { value: 0.5 },
					emissive: { value: new THREE.Color(0x000000) },
					opacity: { value: 1.0 },
					envMap: { value: null },
					envMapIntensity: { value: 1.0 },
					lightMap: { value: null },
					lightMapIntensity: { value: 1.0 },
					aoMap: { value: null },
					aoMapIntensity: { value: 1.0 },
					bumpMap: { value: null },
					bumpScale: { value: 1 },
					normalMap: { value: null },
					normalScale: { value: new THREE.Vector2(1, 1) },
					displacementMap: { value: null },
					displacementScale: { value: 1 },
					displacementBias: { value: 0 },
					specularMap: { value: null },
					alphaMap: { value: null }
				},
				vertexShader: CAPS.SHADER.vertexClipping,
				fragmentShader: CAPS.SHADER.fragmentClipping,
			});
			if (material) MeshStandardMaterialToShaderMaterial(material, shaderMaterial)
			return shaderMaterial;
		},
		backStencil: {} as THREE.ShaderMaterial,
		frontStencil: {} as THREE.ShaderMaterial,
		Invisible: {} as THREE.ShaderMaterial
	},
	picking: (simulation: Simulation) => {

		let intersected: CapsMesh | null = null;
		const mouse = new THREE.Vector2();
		const ray = new THREE.Raycaster();

		const normals = {
			x1: new THREE.Vector3(-1, 0, 0),
			x2: new THREE.Vector3(1, 0, 0),
			y1: new THREE.Vector3(0, -1, 0),
			y2: new THREE.Vector3(0, 1, 0),
			z1: new THREE.Vector3(0, 0, -1),
			z2: new THREE.Vector3(0, 0, 1)
		};

		const plane = new THREE.Mesh(new THREE.PlaneGeometry(100, 100, 4, 4), CAPS.MATERIAL.Invisible);
		simulation.scene.add(plane);

		const targeting = (event: MouseEvent | TouchEvent) => {
			setToNormalizedDeviceCoordinates(mouse, event, window);
			ray.setFromCamera(mouse, simulation.camera);
			const intersects = ray.intersectObjects(simulation.selection.selectables);
			if (intersects.length > 0) {
				const candidate = intersects[0].object as CapsMesh;
				if (intersected !== candidate) {
					if (intersected !== null) {
						intersected.guardian.rayOut();
					}
					candidate.guardian.rayOver();
					intersected = candidate;
					simulation.renderer.domElement.style.cursor = 'pointer';
				}
			} else if (intersected !== null) {
				intersected.guardian.rayOut();
				intersected = null;
				simulation.renderer.domElement.style.cursor = 'auto';
			}
		};

		const beginDrag = (event: MouseEvent | TouchEvent) => {
			setToNormalizedDeviceCoordinates(mouse, event, window);
			ray.setFromCamera(mouse, simulation.camera);
			const intersects = ray.intersectObjects(simulation.selection.selectables);
			if (intersects.length > 0) {
				event.preventDefault();
				event.stopPropagation();
				simulation.controls.enabled = false;
				const intersectionPoint = intersects[0].point;
				const object = intersects[0].object as CapsMesh
				const axis = object.axis;
				if (axis === 'x1' || axis === 'x2') {
					intersectionPoint.setX(0);
				} else if (axis === 'y1' || axis === 'y2') {
					intersectionPoint.setY(0);
				} else if (axis === 'z1' || axis === 'z2') {
					intersectionPoint.setZ(0);
				}
				plane.position.copy(intersectionPoint);
				const newNormal = simulation.camera.position.clone().sub(
					simulation.camera.position.clone().projectOnVector(normals[axis])
				);
				plane.lookAt(newNormal.add(intersectionPoint));
				simulation.renderer.domElement.style.cursor = 'move';
				const continueDrag = (event: MouseEvent | TouchEvent) => {
					event.preventDefault();
					event.stopPropagation();
					setToNormalizedDeviceCoordinates(mouse, event, window);
					ray.setFromCamera(mouse, simulation.camera);
					const intersects = ray.intersectObject(plane);
					if (intersects.length > 0) {
						let value: number = NaN;
						if (axis === 'x1' || axis === 'x2') {
							value = intersects[0].point.x;
						} else if (axis === 'y1' || axis === 'y2') {
							value = intersects[0].point.y;
						} else if (axis === 'z1' || axis === 'z2') {
							value = intersects[0].point.z;
						}
						simulation.selection.setValue(axis, value);
					}
				};
				const endDrag = () => {
					simulation.controls.enabled = true;
					simulation.renderer.domElement.style.cursor = 'pointer';
					document.removeEventListener('mousemove', continueDrag, true);
					document.removeEventListener('touchmove', continueDrag, true);
					document.removeEventListener('mouseup', endDrag, false);
					document.removeEventListener('touchend', endDrag, false);
					document.removeEventListener('touchcancel', endDrag, false);
					document.removeEventListener('touchleave', endDrag, false);
				};

				document.addEventListener('mousemove', continueDrag, true);
				document.addEventListener('touchmove', continueDrag, true);
				document.addEventListener('mouseup', endDrag, false);
				document.addEventListener('touchend', endDrag, false);
				document.addEventListener('touchcancel', endDrag, false);
				document.addEventListener('touchleave', endDrag, false);

			}

		};

		simulation.renderer.domElement.addEventListener('mousemove', targeting, true);
		simulation.renderer.domElement.addEventListener('mousedown', beginDrag, false);
		simulation.renderer.domElement.addEventListener('touchstart', beginDrag, false);

	}
}

CAPS.MATERIAL.backStencil = new THREE.ShaderMaterial({
	uniforms: CAPS.UNIFORMS.clipping,
	vertexShader: CAPS.SHADER.vertexClipping,
	fragmentShader: CAPS.SHADER.fragmentClippingFront,
	colorWrite: false,
	depthWrite: false,
	side: THREE.BackSide
})

CAPS.MATERIAL.frontStencil = new THREE.ShaderMaterial({
	uniforms: CAPS.UNIFORMS.clipping,
	vertexShader: CAPS.SHADER.vertexClipping,
	fragmentShader: CAPS.SHADER.fragmentClippingFront,
	colorWrite: false,
	depthWrite: false,
})
CAPS.MATERIAL.Invisible = new THREE.ShaderMaterial({
	vertexShader: CAPS.SHADER.invisibleVertexShader,
	fragmentShader: CAPS.SHADER.invisibleFragmentShader
})
export default CAPS