import React, { useEffect, useRef, useState } from 'react';
import './App.css';

import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import WebGPU from 'three/addons/capabilities/WebGPU.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';

const loader = new FontLoader();

export default function App() {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [jsonInput, setJsonInput] = useState('');

  // --- RESTORED COMPREHENSIVE SCENE ---
  const defaultScene = {
    "X3D": {
      "version": "3.3",
      "profile": "Immersive",
      "Scene": {
        "children": [
          {
            "Background": {
              "DEF": "MainBackground",
              "skyColor": [[0.0, 0.2, 0.7], [0.0, 0.5, 1.0], [1.0, 1.0, 1.0]],
              "skyAngle": [1.309, 1.571],
              "groundColor": [[0.1, 0.1, 0.0], [0.4, 0.25, 0.2], [0.6, 0.6, 0.6]],
              "groundAngle": [1.309, 1.571]
            }
          },
          { "DirectionalLight": { "DEF": "SunLight", "direction": [0, -1, -1], "color": [1, 1, 0.9], "intensity": 0.8 } },
          { "PointLight": { "DEF": "RedLight", "location": [5, 3, 5], "color": [1, 0.2, 0.2], "intensity": 0.6 } },
          { "SpotLight": { "DEF": "SpotLight1", "location": [-5, 5, 5], "direction": [1, -1, -1], "color": [0.2, 0.2, 1], "intensity": 0.7, "angle": 0.78 } },

          // Animated Box
          {
            "Transform": {
              "DEF": "BoxTransform",
              "translation": [-8, 1, 0],
              "rotation": [0, 1, 0, 0.785],
              "children": [
                {
                  "Shape": {
                    "geometry": { "Box": { "size": [2, 2, 2] } },
                    "appearance": { "Appearance": { "material": { "Material": { "DEF": "RedMaterial", "diffuseColor": [1, 0.2, 0.2], "specularColor": [1, 1, 1], "shininess": 0.8 } } } }
                  }
                }
              ]
            }
          },
          // Transparent Sphere
          {
            "Transform": {
              "translation": [-4, 1.5, 0],
              "children": [{ "Shape": { "geometry": { "Sphere": { "radius": 1.5 } }, "appearance": { "Appearance": { "material": { "Material": { "diffuseColor": [0.2, 1, 0.2], "transparency": 0.3 } } } } } }]
            }
          },
          // Cone
          { "Transform": { "translation": [0, 1, 0], "children": [{ "Shape": { "geometry": { "Cone": { "height": 3, "bottomRadius": 1.5 } }, "appearance": { "Appearance": { "material": { "Material": { "diffuseColor": [0.2, 0.2, 1] } } } } } }] } },
          // Cylinder
          { "Transform": { "translation": [4, 1, 0], "rotation": [1, 0, 0, 1.57], "children": [{ "Shape": { "geometry": { "Cylinder": { "height": 3, "radius": 1 } }, "appearance": { "Appearance": { "material": { "Material": { "diffuseColor": [1, 1, 0.2] } } } } } }] } },
          // Torus
          { "Transform": { "translation": [8, 1, 0], "children": [{ "Shape": { "geometry": { "Torus": { "outerRadius": 1.5, "innerRadius": 0.5 } }, "appearance": { "Appearance": { "material": { "Material": { "diffuseColor": [1, 0.5, 0.2] } } } } } }] } },

          // IndexedFaceSet (Pyramid)
          {
            "Transform": {
              "translation": [0, 0, -5],
              "children": [{
                "Shape": {
                  "geometry": {
                    "IndexedFaceSet": {
                      "coord": { "Coordinate": { "point": [[0, 2, 0], [-1, 0, 1], [1, 0, 1], [1, 0, -1], [-1, 0, -1]] } },
                      "coordIndex": [0, 1, 2, -1, 0, 2, 3, -1, 0, 3, 4, -1, 0, 4, 1, -1, 1, 4, 3, 2, -1],
                      "color": { "Color": { "color": [[1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 0], [0.5, 0.5, 0.5]] } }
                    }
                  },
                  "appearance": { "Appearance": { "material": { "Material": { "diffuseColor": [0.8, 0.8, 0.8] } } } }
                }
              }]
            }
          },

          // IndexedLineSet
          {
            "Transform": {
              "translation": [0, 3, 5],
              "children": [{
                "Shape": {
                  "geometry": {
                    "IndexedLineSet": {
                      "coord": { "Coordinate": { "point": [[-2, 0, 0], [2, 0, 0], [0, 0, -2], [0, 0, 2], [0, -2, 0], [0, 2, 0]] } },
                      "coordIndex": [0, 1, -1, 2, 3, -1, 4, 5, -1],
                      "color": { "Color": { "color": [[1, 0, 0], [1, 0, 0], [0, 1, 0], [0, 1, 0], [0, 0, 1], [0, 0, 1]] } }
                    }
                  }
                }
              }]
            }
          },

          // Billboard Text
          {
            "Billboard": {
              "DEF": "TextBillboard",
              "children": [{
                "Transform": {
                  "translation": [0, 6, 0],
                  "children": [{
                    "Shape": {
                      "geometry": { "Text": { "string": ["X3D", "WebGPU"], "fontStyle": { "FontStyle": { "size": 0.8 } } } },
                      "appearance": { "Appearance": { "material": { "Material": { "diffuseColor": [1, 1, 0], "emissiveColor": [0.5, 0.5, 0] } } } }
                    }
                  }]
                }
              }]
            }
          },

          // Animation Logic
          { "TimeSensor": { "DEF": "Clock", "cycleInterval": 5, "loop": true, "enabled": true } },
          { "PositionInterpolator": { "DEF": "BoxMover", "key": [0, 0.25, 0.5, 0.75, 1], "keyValue": [[-8, 1, 0], [-8, 3, 0], [-8, 1, 0], [-8, -1, 0], [-8, 1, 0]] } },
          { "OrientationInterpolator": { "DEF": "BoxRotator", "key": [0, 0.5, 1], "keyValue": [[0, 1, 0, 0], [0, 1, 0, 3.14159], [0, 1, 0, 6.28318]] } },
          { "ColorInterpolator": { "DEF": "ColorChanger", "key": [0, 0.33, 0.66, 1], "keyValue": [[1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 0, 0]] } },

          // Routes
          { "ROUTE": { "fromNode": "Clock", "fromField": "fraction_changed", "toNode": "BoxMover", "toField": "set_fraction" } },
          { "ROUTE": { "fromNode": "BoxMover", "fromField": "value_changed", "toNode": "BoxTransform", "toField": "set_translation" } },
          { "ROUTE": { "fromNode": "Clock", "fromField": "fraction_changed", "toNode": "BoxRotator", "toField": "set_fraction" } },
          { "ROUTE": { "fromNode": "BoxRotator", "fromField": "value_changed", "toNode": "BoxTransform", "toField": "set_rotation" } },
          { "ROUTE": { "fromNode": "Clock", "fromField": "fraction_changed", "toNode": "ColorChanger", "toField": "set_fraction" } },
          { "ROUTE": { "fromNode": "ColorChanger", "fromField": "value_changed", "toNode": "RedMaterial", "toField": "set_diffuseColor" } }
        ]
      }
    }
  };

  useEffect(() => {
    setJsonInput(JSON.stringify(defaultScene, null, 2));
  }, []);

  useEffect(() => {
    if (!jsonInput) return;

    if (WebGPU && !WebGPU.isAvailable()) {
      setError('WebGPU is not supported in this browser. Please use Chrome/Edge 113+');
      setLoading(false);
      return;
    }

    let renderer, scene, camera, controls, clock;
    let resizeObserver;

    // Registries
    const defRegistry = new Map();
    const routes = [];
    const timeSensors = [];
    const routeUpdates = [];
    const billboards = [];

    const init = async () => {
      try {
        setLoading(true);
        const container = containerRef.current;
        if (!container) return;

        // 1. Setup Three.js
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a2e);
        clock = new THREE.Clock();

        const width = container.clientWidth;
        const height = container.clientHeight;

        camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.set(0, 5, 20);

        // 2. Setup WebGPU Renderer
        renderer = new WebGPURenderer({ antialias: true });
        await renderer.init();
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);

        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        scene.add(ambientLight);

        // 3. Parse X3D
        const x3dData = JSON.parse(jsonInput);
        if (x3dData.X3D?.Scene) {
          await parseNode(x3dData.X3D.Scene, scene);
        }

        // 4. Process Routes
        processRoutes();

        // 5. Animation Loop
        const animate = () => {
          const elapsedTime = clock.getElapsedTime();

          // A. Update TimeSensors
          timeSensors.forEach(sensor => {
            if (sensor.enabled && sensor.loop) {
              const fraction = (elapsedTime % sensor.cycleInterval) / sensor.cycleInterval;
              sensor.fraction_changed = fraction;
            }
          });

          // B. Execute Route Transfers
          routeUpdates.forEach(fn => fn());

          // C. Update Billboards
          billboards.forEach(b => b.lookAt(camera.position));

          // D. Render
          controls.update();
          renderer.render(scene, camera);
        };

        renderer.setAnimationLoop(animate);

        // 6. Resize Handling
        resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0) {
              camera.aspect = width / height;
              camera.updateProjectionMatrix();
              renderer.setSize(width, height);
            }
          }
        });
        resizeObserver.observe(container);

        setLoading(false);
        setError(null);

      } catch (err) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    };

    // --- PARSER LOGIC ---

    const parseNode = async (node, parent) => {
      if (node.children) {
        for (const child of node.children) {
          await parseChild(child, parent);
        }
      }
    };

    const parseChild = async (child, parent) => {
      const defName = child.DEF || Object.values(child)[0]?.DEF;
      let object = null;

      if (child.Transform) {
        object = createTransform(child.Transform);
        await parseNode(child.Transform, object);
      } else if (child.Group) {
        object = new THREE.Group();
        await parseNode(child.Group, object);
      } else if (child.Billboard) {
        object = new THREE.Group();
        billboards.push(object);
        await parseNode(child.Billboard, object);
      } else if (child.Shape) {
        object = await createShape(child.Shape);

      // Lights
      } else if (child.DirectionalLight) {
        const d = child.DirectionalLight;
        object = new THREE.DirectionalLight(new THREE.Color(...(d.color || [1,1,1])), d.intensity || 1);
        if (d.direction) object.position.copy(new THREE.Vector3(...d.direction).negate().multiplyScalar(10));
      } else if (child.PointLight) {
        const p = child.PointLight;
        object = new THREE.PointLight(new THREE.Color(...(p.color || [1,1,1])), p.intensity || 1);
        if (p.location) object.position.set(...p.location);
      } else if (child.SpotLight) {
        const s = child.SpotLight;
        object = new THREE.SpotLight(new THREE.Color(...(s.color || [1,1,1])), s.intensity || 1);
        if (s.location) object.position.set(...s.location);
        if (s.direction) {
          const target = new THREE.Object3D();
          target.position.copy(object.position).add(new THREE.Vector3(...s.direction));
          object.target = target;
          scene.add(target);
        }
        if (s.angle) object.angle = s.angle;

      // Environment
      } else if (child.Background) {
        if (child.Background.skyColor) scene.background = new THREE.Color(...child.Background.skyColor[0]);
        if (defName) defRegistry.set(defName, scene.background);

      // Animation
      } else if (child.TimeSensor) {
        const ts = { ...child.TimeSensor, fraction_changed: 0, enabled: true, loop: true };
        timeSensors.push(ts);
        if (defName) defRegistry.set(defName, ts);
      } else if (child.PositionInterpolator) {
        const pi = createInterpolator(child.PositionInterpolator, 3);
        if (defName) defRegistry.set(defName, pi);
      } else if (child.OrientationInterpolator) {
        const oi = createInterpolator(child.OrientationInterpolator, 4);
        if (defName) defRegistry.set(defName, oi);
      } else if (child.ColorInterpolator) {
        const ci = createInterpolator(child.ColorInterpolator, 3);
        if (defName) defRegistry.set(defName, ci);
      } else if (child.ROUTE) {
        routes.push(child.ROUTE);
      }

      if (object) {
        parent.add(object);
        if (defName) defRegistry.set(defName, object);
      }
    };

    // --- FACTORIES ---

    const createTransform = (data) => {
      const group = new THREE.Group();
      if (data.translation) group.position.set(...data.translation);
      if (data.rotation) {
        const [x, y, z, angle] = data.rotation;
        group.setRotationFromAxisAngle(new THREE.Vector3(x,y,z).normalize(), angle);
      }
      if (data.scale) group.scale.set(...data.scale);
      return group;
    };

const createShape = async (data) => {
  let geo = await createGeometry(data.geometry);
  let mat = createMaterial(data.appearance);
  
  // Handle Groups (for multi-line text)
  if (geo && geo.isGroup) {
    geo.traverse((child) => {
      if (child.isMesh) {
        // Use simpler material for flat text
        const textMat = new THREE.MeshBasicMaterial({ 
          color: mat.color,
          side: THREE.FrontSide 
        });
        child.material = textMat;
      }
    });
    return geo;
  }
  
  if (geo && mat) {
    if (geo.isLineGeometry) return new THREE.LineSegments(geo, mat);
    if (geo.isPointGeometry) return new THREE.Points(geo, mat);
    return new THREE.Mesh(geo, mat);
  }
  return null;
};

    const createGeometry = async (data) => {
      if (!data) return null;
      if (data.Box) return new THREE.BoxGeometry(...(data.Box.size || [1,1,1]));
      if (data.Sphere) return new THREE.SphereGeometry(data.Sphere.radius || 1, 32, 32);
      if (data.Cone) return new THREE.ConeGeometry(data.Cone.bottomRadius || 1, data.Cone.height || 2, 32);
      if (data.Cylinder) return new THREE.CylinderGeometry(data.Cylinder.radius || 1, data.Cylinder.radius || 1, data.Cylinder.height || 2, 32);
      if (data.Torus) return new THREE.TorusGeometry(data.Torus.outerRadius || 1, data.Torus.innerRadius || 0.4, 16, 32);
      if (data.IndexedFaceSet) return createIndexedFaceSet(data.IndexedFaceSet);
      if (data.IndexedLineSet) return createIndexedLineSet(data.IndexedLineSet);
      if (data.PointSet) return createPointSet(data.PointSet);
      if (data.Text) return createTextGeometry(data.Text);
      if (data.Extrusion) return createExtrusion(data.Extrusion);
      if (data.ElevationGrid) return createElevationGrid(data.ElevationGrid);
      return null;
    };

    const createMaterial = (appearance) => {
      if (!appearance?.Appearance?.material?.Material) return new THREE.MeshStandardMaterial({ color: 0x888888 });
      const m = appearance.Appearance.material.Material;
      const params = {
        color: m.diffuseColor ? new THREE.Color(...m.diffuseColor) : 0xffffff,
        roughness: 1 - (m.shininess || 0.2),
        metalness: 0.1,
        vertexColors: false
      };

      if (m.emissiveColor) params.emissive = new THREE.Color(...m.emissiveColor);
      if (m.transparency) {
        params.transparent = true;
        params.opacity = 1 - m.transparency;
      }

      const mat = new THREE.MeshStandardMaterial(params);
      if (m.DEF) defRegistry.set(m.DEF, mat);
      return mat;
    };

    // --- GEOMETRY HELPERS ---

    const createIndexedFaceSet = (ifs) => {
      const geo = new THREE.BufferGeometry();
      const points = ifs.coord?.Coordinate?.point || [];
      const indices = ifs.coordIndex || [];
      const colors = ifs.color?.Color?.color || [];
      const vertices = [];
      const vertexColors = [];

      let currentFace = [];
      indices.forEach(idx => {
        if (idx === -1) {
          // Triangulate fan
          for (let i = 1; i < currentFace.length - 1; i++) {
            const a = currentFace[0];
            const b = currentFace[i];
            const c = currentFace[i+1];
            vertices.push(...points[a], ...points[b], ...points[c]);
            if (colors.length > 0) {
              vertexColors.push(...(colors[a] || [1,1,1]), ...(colors[b] || [1,1,1]), ...(colors[c] || [1,1,1]));
            }
          }
          currentFace = [];
        } else currentFace.push(idx);
      });

      geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      if (vertexColors.length > 0) geo.setAttribute('color', new THREE.Float32BufferAttribute(vertexColors, 3));
      geo.computeVertexNormals();
      return geo;
    };

    const createIndexedLineSet = (ils) => {
      const geo = new THREE.BufferGeometry();
      const points = ils.coord?.Coordinate?.point || [];
      const indices = ils.coordIndex || [];
      const colors = ils.color?.Color?.color || [];
      const vertices = [];
      const vertexColors = [];

      let currentLine = [];
      indices.forEach(idx => {
        if (idx === -1) currentLine = [];
        else {
          currentLine.push(idx);
          if (currentLine.length === 2) {
            vertices.push(...points[currentLine[0]], ...points[currentLine[1]]);
            if (colors.length > 0) {
              vertexColors.push(...(colors[currentLine[0]] || [1,1,1]), ...(colors[currentLine[1]] || [1,1,1]));
            }
            currentLine.shift();
          }
        }
      });

      geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      if (vertexColors.length > 0) geo.setAttribute('color', new THREE.Float32BufferAttribute(vertexColors, 3));
      geo.isLineGeometry = true;
      return geo;
    };

    const createPointSet = (ps) => {
      const geo = new THREE.BufferGeometry();
      const points = ps.coord?.Coordinate?.point || [];
      const colors = ps.color?.Color?.color || [];
      geo.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3));
      if (colors.length > 0) geo.setAttribute('color', new THREE.Float32BufferAttribute(colors.flat(), 3));
      geo.isPointGeometry = true;
      return geo;
    };

const createTextGeometry = async (textData) => {
  function loadFont(url) {
    return new Promise((resolve, reject) => {
      const loader = new FontLoader();
      loader.load(url, resolve, undefined, reject);
    });
  }

  const font = await loadFont('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json');
	/* helvetiker_regular.typeface.json
helvetiker_bold.typeface.json
optimer_regular.typeface.json
optimer_bold.typeface.json
gentilis_regular.typeface.json
gentilis_bold.typeface.json
droid_sans_regular.typeface.json
droid_sans_bold.typeface.json
droid_serif_regular.typeface.json
droid_serif_bold.typeface.json */
  const strings = textData.string || ["Text"];
  const size = textData.fontStyle?.FontStyle?.size || 1;

  // Single line
  if (strings.length === 1) {
    const geometry = new TextGeometry(strings[0], {
      font: font,
      size: size,
      depth: 0,
      curveSegments: 12,
    });
    geometry.computeVertexNormals();
    return geometry;
  }

  // Multi-line: return a Group
  const group = new THREE.Group();
  const lineHeight = size * 1.2;

  strings.forEach((str, index) => {
    const geometry = new TextGeometry(str, {
      font: font,
      size: size,
      depth: 0,
      curveSegments: 12,
    });

    geometry.computeVertexNormals();  // Compute normals for each geometry

    const mesh = new THREE.Mesh(geometry);
    mesh.position.y = -index * lineHeight;
    group.add(mesh);
  });

  return group;
};

    const createExtrusion = (ext) => {
      const crossSection = ext.crossSection || [[1, 1], [1, -1], [-1, -1], [-1, 1], [1, 1]];
      const spine = ext.spine || [[0, 0, 0], [0, 1, 0]];
      const shape = new THREE.Shape();
      crossSection.forEach((p, i) => {
        if (i === 0) shape.moveTo(p[0], p[1]);
        else shape.lineTo(p[0], p[1]);
      });
      return new THREE.ExtrudeGeometry(shape, {
        steps: spine.length,
        depth: 1, // Simplified depth mapping from spine
        bevelEnabled: false
      });
    };

    const createElevationGrid = (eg) => {
      const xDim = eg.xDimension || 2;
      const zDim = eg.zDimension || 2;
      const xSpacing = eg.xSpacing || 1;
      const zSpacing = eg.zSpacing || 1;
      const heights = eg.height || [];
      const geo = new THREE.BufferGeometry();
      const vertices = [];

      // Create quad faces
      for (let z = 0; z < zDim - 1; z++) {
        for (let x = 0; x < xDim - 1; x++) {
          const i1 = z * xDim + x;
          const i2 = z * xDim + (x + 1);
          const i3 = (z + 1) * xDim + (x + 1);
          const i4 = (z + 1) * xDim + x;

          const h1 = heights[i1] || 0;
          const h2 = heights[i2] || 0;
          const h3 = heights[i3] || 0;
          const h4 = heights[i4] || 0;

          // Triangle 1
          vertices.push(x*xSpacing, h1, z*zSpacing);
          vertices.push((x+1)*xSpacing, h2, z*zSpacing);
          vertices.push((x+1)*xSpacing, h3, (z+1)*zSpacing);

          // Triangle 2
          vertices.push(x*xSpacing, h1, z*zSpacing);
          vertices.push((x+1)*xSpacing, h3, (z+1)*zSpacing);
          vertices.push(x*xSpacing, h4, (z+1)*zSpacing);
        }
      }
      geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geo.computeVertexNormals();
      return geo;
    };

    // --- INTERPOLATOR LOGIC ---
    const createInterpolator = (data, dims) => ({
      key: data.key,
      keyValue: data.keyValue,
      value_changed: null,
      set_fraction: function(f) {
        for(let i=0; i<this.key.length-1; i++) {
          if (f >= this.key[i] && f <= this.key[i+1]) {
            const t = (f - this.key[i]) / (this.key[i+1] - this.key[i]);
            const v1 = this.keyValue[i];
            const v2 = this.keyValue[i+1];

            if (dims === 3) {
              this.value_changed = [
                v1[0] + t * (v2[0] - v1[0]),
                v1[1] + t * (v2[1] - v1[1]),
                v1[2] + t * (v2[2] - v1[2])
              ];
            } else if (dims === 4) {
              this.value_changed = [
                v1[0], v1[1], v1[2],
                v1[3] + t * (v2[3] - v1[3])
              ];
            }
            return;
          }
        }
        this.value_changed = this.keyValue[0];
      }
    });

    // --- ROUTE PROCESSING ---
    const processRoutes = () => {
      routes.forEach(r => {
        const from = defRegistry.get(r.fromNode);
        const to = defRegistry.get(r.toNode);

        if (from && to) {
          routeUpdates.push(() => {
            if (from.fraction_changed !== undefined && to.set_fraction) {
              to.set_fraction(from.fraction_changed);
            }
            if (from.value_changed) {
              if (r.toField === 'set_translation' && to.position) to.position.set(...from.value_changed);
              else if (r.toField === 'set_rotation' && to.setRotationFromAxisAngle) {
                const [x,y,z,a] = from.value_changed;
                to.setRotationFromAxisAngle(new THREE.Vector3(x,y,z).normalize(), a);
              }
              else if (r.toField === 'set_scale' && to.scale) to.scale.set(...from.value_changed);
              else if (r.toField === 'set_diffuseColor' && to.color) to.color.setRGB(...from.value_changed);
            }
          });
        }
      });
    };

    init();

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      if (renderer) {
        renderer.setAnimationLoop(null);
        try { renderer.dispose(); } catch(e){}
      }
    };
  }, [jsonInput]);

  return (
    <div className="app-container">
      <div className="header">
        <h1>X3D WebGPU Renderer</h1>
      </div>

      {error && <div className="error-bar">{error}</div>}

      <div className="main-content">
        <div className="sidebar">
          <textarea
	    id="jsonContent"
            className="json-input"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            spellCheck={false}
          />
          <button className="btn" onClick={() => {
		  /*
	  <div id="myModal" style="display:none; position:fixed; top:20%; left:30%; background:white; border:1px solid #ccc; padding:20px;">
  		<button onclick="document.getElementById('myModal').style.display='none'">Close</button>
	  </div>
	        function displayInModal(data) {
		  const modal = document.getElementById('myModal');
		  const content = document.getElementById('jsonContent');
		  content.textContent = JSON.stringify(data, null, 2); // Preserves formatting
		  modal.style.display = 'block';
		}
	        async function showJsonPopup(url) {
		  try {
		    const response = await fetch(url);
		    if (!response.ok) throw new Error('Network response was not ok');
		    const data = await response.json();

		    // Pass the data to your chosen popup method
		    displayInModal(data);
		  } catch (error) {
		    console.error('Error fetching JSON:', error);
		  }
		}
		showJsonPopup(prompt("Please enter a URL:"));
		  */
             const temp = jsonInput; setJsonInput(''); setTimeout(() => setJsonInput(temp), 10);
          }}>
            Reload Scene
          </button>
        </div>

        <div className="canvas-container">
          <div ref={containerRef} className="canvas-wrapper" />
          <div className="status">WebGPU Active</div>
        </div>
      </div>
    </div>
  );
}
