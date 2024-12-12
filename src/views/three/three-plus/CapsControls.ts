import * as THREE from 'three'
import { loadModel } from './ThreeHelper';

// calculate mouse position in normalized device coordinates
type AxisKey = "x1" | "y1" | "z1" | "x2" | "y2" | "z2";
export function setToNormalizedDeviceCoordinates(
	vector: THREE.Vector2,
	event: MouseEvent | TouchEvent,
	window: Window
): THREE.Vector2 {
	vector.x = event instanceof MouseEvent ? event.clientX : (event.touches && event.touches[0].clientX);
	vector.y = event instanceof MouseEvent ? event.clientY : (event.touches && event.touches[0].clientY);
	vector.x = (vector.x / window.innerWidth) * 2 - 1;
	vector.y = - (vector.y / window.innerHeight) * 2 + 1;
	return vector;
}

class PlaneGeometry extends THREE.BufferGeometry {
	dynamic: boolean = true
	verticesNeedUpdate: boolean = true
	constructor(v0: THREE.Vector3, v1: THREE.Vector3, v2: THREE.Vector3, v3: THREE.Vector3) {
		super();

		// 创建顶点数组
		const vertices = new Float32Array([
			v0.x, v0.y, v0.z,
			v1.x, v1.y, v1.z,
			v2.x, v2.y, v2.z,
			v3.x, v3.y, v3.z
		]);

		// 创建索引数组
		const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

		// 创建顶点属性
		this.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
		this.setIndex(new THREE.BufferAttribute(indices, 1));

		// 计算法线
		this.computeVertexNormals();
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
		const lineGeometry = new THREE.BufferGeometry();

		// 创建顶点数组
		const vertices = new Float32Array([
			v0.x, v0.y, v0.z,
			v1.x, v1.y, v1.z
		]);

		// 设置顶点属性
		lineGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

		// 手动计算线段距离
		const distances = [0, v0.distanceTo(v1)];
		lineGeometry.setAttribute('lineDistance', new THREE.BufferAttribute(new Float32Array(distances), 1));
		(lineGeometry as PlaneGeometry).dynamic = true;
		selection.lineGeometries.push(lineGeometry as PlaneGeometry);

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
	faces: SelectionBoxFace[]
	limitLow: THREE.Vector3;
	limitHigh: THREE.Vector3;
	box: THREE.BoxGeometry;
	boxMesh: THREE.Mesh;
	vertices: THREE.Vector3[];
	touchMeshes: THREE.Object3D;
	displayMeshes: THREE.Object3D;
	meshGeometries: PlaneGeometry[];
	lineGeometries: PlaneGeometry[];
	selectables: THREE.Mesh[];

	constructor(low: THREE.Vector3, high: THREE.Vector3) {
		this.limitLow = low;
		this.limitHigh = high;

		this.box = new THREE.BoxGeometry(1, 1, 1);
		this.boxMesh = new THREE.Mesh(this.box, CAPS.MATERIAL.cap);

		this.vertices = [
			new THREE.Vector3(), new THREE.Vector3(),
			new THREE.Vector3(), new THREE.Vector3(),
			new THREE.Vector3(), new THREE.Vector3(),
			new THREE.Vector3(), new THREE.Vector3()
		];
		this.updateVertices();

		const v = this.vertices;

		this.touchMeshes = new THREE.Object3D();
		this.displayMeshes = new THREE.Object3D();
		this.meshGeometries = [];
		this.lineGeometries = [];
		this.selectables = [];
		this.faces = [];
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
	capsScene: THREE.Scene;
	backStencil: THREE.Scene;
	frontStencil: THREE.Scene;
	selection: Selection;
	throttledRender: Function;
	showCaps: boolean = true
	constructor(
		public renderer: THREE.WebGLRenderer,
		public camera: THREE.PerspectiveCamera,
		public scene: THREE.Scene,
		public controls: THREE.Controls<{}>,

	) {
		this.capsScene = new THREE.Scene();
		this.backStencil = new THREE.Scene();
		this.frontStencil = new THREE.Scene();
		this.selection = new CAPS.Selection(
			new THREE.Vector3(-7, -14, -14),
			new THREE.Vector3(14, 9, 3)
		);
		const throttledRender = CAPS.SCHEDULE.deferringThrottle(this._render.bind(this), this, 40);
		this.throttledRender = throttledRender;
		this.init();
	}

	init() {
		const self = this;
		loadModel({ gltf: '/glb/5.glb' }, "glb").then(m => {
			m.scale.set(2, 2, 2)
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

		CAPS.picking(this); // must come before OrbitControls, so it can cancel them
		// @ts-ignore
		this.controls.addEventListener('change', throttledRender);

		const onWindowResize = () => {
			this.camera.aspect = window.innerWidth / window.innerHeight;
			this.camera.updateProjectionMatrix();
			this.renderer.setSize(window.innerWidth, window.innerHeight);
			this.throttledRender();
		};
		window.addEventListener('resize', onWindowResize, false);

		const showCapsInput = document.getElementById('showCaps') as HTMLInputElement;
		this.showCaps = showCapsInput.checked;
		const onShowCaps = () => {
			this.showCaps = showCapsInput.checked;
			this.throttledRender();
		};
		showCapsInput.addEventListener('change', onShowCaps, false);

		this.throttledRender();
	}

	initScene(collada: THREE.Object3D) {
		const setMaterial = (node: THREE.Object3D, material: THREE.ShaderMaterial) => {
			// 打印node原型链
			console.log(node.constructor.name);
			if (node instanceof THREE.Mesh || node instanceof THREE.Line) {
				node.material = material;
			}
			if (node.children) {
				for (let i = 0; i < node.children.length; i++) {
					setMaterial(node.children[i], material);
				}
			}
		};
		const scale = 1
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

		this.throttledRender();
	}

	_render() {
		this.renderer.clear();

		const gl = this.renderer.getContext();

		if (this.showCaps) {
			gl.enable(gl.STENCIL_TEST);

			gl.stencilFunc(gl.ALWAYS, 1, 0xff);
			gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR);
			this.renderer.render(this.backStencil, this.camera);

			gl.stencilFunc(gl.ALWAYS, 1, 0xff);
			gl.stencilOp(gl.KEEP, gl.KEEP, gl.DECR);
			this.renderer.render(this.frontStencil, this.camera);

			gl.stencilFunc(gl.EQUAL, 1, 0xff);
			gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
			this.renderer.render(this.capsScene, this.camera);

			gl.disable(gl.STENCIL_TEST);
		}

		this.renderer.render(this.scene, this.camera);
	}
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

		deferringThrottle: (callback: Function, context: any, wait: number) => {
			// wait 60 = 16fps // wait 40 = 25fps // wait 20 = 50fps

			const execute = (args: any[]) => {
				callback.apply(context, args);
				setTimeout(() => {
					if (deferredCalls) {
						deferredCalls = false;
						execute(args);
					} else {
						blocked = false;
					}
				}, wait);
			};

			let blocked = false;
			let deferredCalls = false;
			let args: any[] | undefined;

			return (...newArgs: any[]) => {
				if (blocked) {
					args = newArgs;
					deferredCalls = true;
					return;
				} else {
					blocked = true;
					deferredCalls = false;
					execute(newArgs);
				}
			};
		}
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
		sheet: {} as THREE.ShaderMaterial,
		cap: {} as THREE.ShaderMaterial,
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
					simulation.throttledRender();

				}

			} else if (intersected !== null) {

				intersected.guardian.rayOut();
				intersected = null;

				simulation.renderer.domElement.style.cursor = 'auto';
				simulation.throttledRender();

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
				simulation.throttledRender();

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
						simulation.throttledRender();

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
CAPS.MATERIAL.sheet = new THREE.ShaderMaterial({
	uniforms: CAPS.UNIFORMS.clipping,
	vertexShader: CAPS.SHADER.vertexClipping,
	fragmentShader: CAPS.SHADER.fragmentClipping
})

CAPS.MATERIAL.cap = new THREE.ShaderMaterial({
	uniforms: CAPS.UNIFORMS.caps,
	vertexShader: CAPS.SHADER.vertex,
	fragmentShader: CAPS.SHADER.fragment
})

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