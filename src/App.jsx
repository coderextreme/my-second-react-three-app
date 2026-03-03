import React, { useEffect, useRef, useState } from 'react';
import './App.css';

import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import WebGPU from 'three/addons/capabilities/WebGPU.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';

import { loadX3DHumanoid } from './X3DHumanoidLoader.js';

// Hyperjump JSON Schema validation (install: npm i @hyperjump/json-schema)
import { registerSchema, validate } from "@hyperjump/json-schema/draft-2020-12";
import { BASIC } from "@hyperjump/json-schema/experimental";
import selectObjectFromJson from './selectObjectFromJson.js';

// ─── X3D JSON Schema URI ────────────────────────────────────────────────────
const X3D_SCHEMA_URI = 'http://localhost:5173/x3d-4.1-JSONSchema.json';

export default function App() {
  const containerRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [jsonInput, setJsonInput] = useState('');
  const [validation, setValidation] = useState(null); // { valid, errors }

  // ── X3D JSON scene (@ = simple field, - = SFNode / MFNode field) ──────────
  const defaultScene = {
    "X3D": {
      "encoding":"UTF-8",
      "@version": "4.1",
      "@profile": "Immersive",
      "head": {
        "meta": [
          {
            "@name":"title",
            "@content":"unknown.x3d"
          },
          {
            "@name":"creator",
            "@content":"John Carlson"
          },
          {
            "@name":"generator",
            "@content":"Claude AI"
          },
          {
            "@name":"description",
            "@content":"a scene rendered with WebGPU"
          }
        ]
      },
      "Scene": {
        "-children": [
          // ── Background ────────────────────────────────────────────────────
          {
            "Background": {
              "@DEF": "MainBackground",
              "@skyColor": [0.0, 0.2, 0.7, 0.0, 0.5, 1.0, 1.0, 1.0, 1.0],
              "@skyAngle": [1.309, 1.5708],
              "@groundColor": [0.1, 0.1, 0.0, 0.4, 0.25, 0.2, 0.6, 0.6, 0.6],
              "@groundAngle": [1.309, 1.5708]
            }
          },

          // ── Lights ────────────────────────────────────────────────────────
          {
            "DirectionalLight": {
              "@DEF": "SunLight",
              "@direction": [0, -1, -1],
              "@color": [1, 1, 0.9],
              "@intensity": 0.8
            }
          },
          {
            "PointLight": {
              "@DEF": "RedLight",
              "@location": [5, 3, 5],
              "@color": [1, 0.2, 0.2],
              "@intensity": 0.6
            }
          },
          {
            "SpotLight": {
              "@DEF": "SpotLight1",
              "@location": [-5, 5, 5],
              "@direction": [1, -1, -1],
              "@color": [0.2, 0.2, 1],
              "@intensity": 0.7,
              "@angle": 0.78
            }
          },

          // ── Animated Box ──────────────────────────────────────────────────
          {
            "Transform": {
              "@DEF": "BoxTransform",
              "@translation": [-8, 1, 0],
              "@rotation": [0, 1, 0, 0.785],
              "-children": [
                {
                  "Shape": {
                    "-geometry": {
                      "Box": { "@size": [2, 2, 2] }
                    },
                    "-appearance": {
                      "Appearance": {
                        "-material": {
                          "Material": {
                            "@DEF": "RedMaterial",
                            "@diffuseColor": [1, 0.2, 0.2],
                            "@specularColor": [1, 1, 1],
                            "@shininess": 0.8
                          }
                        }
                      }
                    }
                  }
                }
              ]
            }
          },

          // ── Transparent Sphere ────────────────────────────────────────────
          {
            "Transform": {
              "@translation": [-4, 1.5, 0],
              "-children": [
                {
                  "Shape": {
                    "-geometry": { "Sphere": { "@radius": 1.5 } },
                    "-appearance": {
                      "Appearance": {
                        "-material": {
                          "Material": {
                            "@diffuseColor": [0.2, 1, 0.2],
                            "@transparency": 0.3
                          }
                        }
                      }
                    }
                  }
                }
              ]
            }
          },

          // ── Cone ──────────────────────────────────────────────────────────
          {
            "Transform": {
              "@translation": [0, 1, 0],
              "-children": [
                {
                  "Shape": {
                    "-geometry": { "Cone": { "@height": 3, "@bottomRadius": 1.5 } },
                    "-appearance": {
                      "Appearance": {
                        "-material": { "Material": { "@diffuseColor": [0.2, 0.2, 1] } }
                      }
                    }
                  }
                }
              ]
            }
          },

          // ── Cylinder ──────────────────────────────────────────────────────
          {
            "Transform": {
              "@translation": [4, 1, 0],
              "@rotation": [1, 0, 0, 1.57],
              "-children": [
                {
                  "Shape": {
                    "-geometry": { "Cylinder": { "@height": 3, "@radius": 1 } },
                    "-appearance": {
                      "Appearance": {
                        "-material": { "Material": { "@diffuseColor": [1, 1, 0.2] } }
                      }
                    }
                  }
                }
              ]
            }
          },

          // ── Torus ─────────────────────────────────────────────────────────
          {
            "Transform": {
              "@translation": [8, 1, 0],
              "-children": [
                {
                  "Shape": {
                    "-geometry": {
                      "Torus": { "@outerRadius": 1.5, "@innerRadius": 0.5 }
                    },
                    "-appearance": {
                      "Appearance": {
                        "-material": { "Material": { "@diffuseColor": [1, 0.5, 0.2] } }
                      }
                    }
                  }
                }
              ]
            }
          },

          // ── IndexedFaceSet (Pyramid) ───────────────────────────────────────
          {
            "Transform": {
              "@translation": [0, 0, -5],
              "-children": [
                {
                  "Shape": {
                    "-geometry": {
                      "IndexedFaceSet": {
                        "-coord": {
                          "Coordinate": {
                            "@point": [
                              0,2,0, -1,0,1, 1,0,1, 1,0,-1, -1,0,-1
                            ]
                          }
                        },
                        "@coordIndex": [0, 1, 2, -1, 0, 2, 3, -1, 0, 3, 4, -1, 0, 4, 1, -1, 1, 4, 3, 2, -1],
                        "-color": {
                          "Color": {
                            "@color": [
                              1,0,0, 0,1,0, 0,0,1, 1,1,0, 0.5,0.5,0.5
                            ]
                          }
                        }
                      }
                    },
                    "-appearance": {
                      "Appearance": {
                        "-material": { "Material": { "@diffuseColor": [0.8, 0.8, 0.8] } }
                      }
                    }
                  }
                }
              ]
            }
          },

          // ── IndexedLineSet ────────────────────────────────────────────────
          {
            "Transform": {
              "@translation": [0, 3, 5],
              "-children": [
                {
                  "Shape": {
                    "-geometry": {
                      "IndexedLineSet": {
                        "-coord": {
                          "Coordinate": {
                            "@point": [
                              -2,0,0, 2,0,0,
                               0,0,-2, 0,0,2,
                               0,-2,0, 0,2,0
                            ]
                          }
                        },
                        "@coordIndex": [0, 1, -1, 2, 3, -1, 4, 5, -1],
                        "-color": {
                          "Color": {
                            "@color": [
                              1,0,0, 1,0,0,
                              0,1,0, 0,1,0,
                              0,0,1, 0,0,1
                            ]
                          }
                        }
                      }
                    }
                  }
                }
              ]
            }
          },

          // ── Billboard Text ────────────────────────────────────────────────
          {
            "Billboard": {
              "@DEF": "TextBillboard",
              "-children": [
                {
                  "Transform": {
                    "@translation": [0, 6, 0],
                    "-children": [
                      {
                        "Shape": {
                          "-geometry": {
                            "Text": {
                              "@string": ["X3D", "WebGPU"],
                              "-fontStyle": { "FontStyle": { "@size": 0.8 } }
                            }
                          },
                          "-appearance": {
                            "Appearance": {
                              "-material": {
                                "Material": {
                                  "@diffuseColor": [1, 1, 0],
                                  "@emissiveColor": [0.5, 0.5, 0]
                                }
                              }
                            }
                          }
                        }
                      }
                    ]
                  }
                }
              ]
            }
          },

          // ── Animation nodes ───────────────────────────────────────────────
          {
            "TimeSensor": {
              "@DEF": "Clock",
              "@cycleInterval": 5,
              "@loop": true,
              "@enabled": true
            }
          },
          {
            "PositionInterpolator": {
              "@DEF": "BoxMover",
              "@key": [0, 0.25, 0.5, 0.75, 1],
              "@keyValue": [
                -8,1,0, -8,3,0, -8,1,0, -8,-1,0, -8,1,0
              ]
            }
          },
          {
            "OrientationInterpolator": {
              "@DEF": "BoxRotator",
              "@key": [0, 0.5, 1],
              "@keyValue": [
                0,1,0,0, 0,1,0,3.14159, 0,1,0,6.28318
              ]
            }
          },
          {
            "ColorInterpolator": {
              "@DEF": "ColorChanger",
              "@key": [0, 0.33, 0.66, 1],
              "@keyValue": [
                1,0,0, 0,1,0, 0,0,1, 1,0,0
              ]
            }
          },
	        { "Inline": { "@url" : [ "src/HumanoidComplete.json" ] } },
          // ── Routes ────────────────────────────────────────────────────────
          { "ROUTE": { "@fromNode": "Clock",       "@fromField": "fraction_changed", "@toNode": "BoxMover",    "@toField": "set_fraction"   } },
          { "ROUTE": { "@fromNode": "BoxMover",    "@fromField": "value_changed",    "@toNode": "BoxTransform","@toField": "set_translation" } },
          { "ROUTE": { "@fromNode": "Clock",       "@fromField": "fraction_changed", "@toNode": "BoxRotator",  "@toField": "set_fraction"   } },
          { "ROUTE": { "@fromNode": "BoxRotator",  "@fromField": "value_changed",    "@toNode": "BoxTransform","@toField": "set_rotation"   } },
          { "ROUTE": { "@fromNode": "Clock",       "@fromField": "fraction_changed", "@toNode": "ColorChanger","@toField": "set_fraction"   } },
          { "ROUTE": { "@fromNode": "ColorChanger","@fromField": "value_changed",    "@toNode": "RedMaterial", "@toField": "set_diffuseColor"} }
        ]
      }
    }
  };

  useEffect(() => {
    setJsonInput(JSON.stringify(defaultScene, null, 2));
  }, []);

  // ── Schema validation via @hyperjump/json-schema ─────────────────────────
  const runSchemaValidation = async (instance) => {
    try {
      const schemaResp = await fetch(X3D_SCHEMA_URI);
      if (!schemaResp.ok) throw new Error(`HTTP ${schemaResp.status}`);
      const schema = await schemaResp.json();
      registerSchema(schema, X3D_SCHEMA_URI);
      const output = await validate(X3D_SCHEMA_URI, instance, BASIC);
					for (let e in output.errors) {
						let error = output.errors[e];
						if (!error.keyword.endsWith("validate")) {
							console.log("keyword:", error.keyword.substr(error.keyword.lastIndexOf("/")+1));
							////////////////////////////////////////////////////////
							let schemaPath = error.absoluteKeywordLocation.substr(error.absoluteKeywordLocation.lastIndexOf("#")+2).replaceAll("/", " > ");
							console.log("schema location:", schemaPath);
							let schemaSelectedObject = selectObjectFromJson(schema, schemaPath);
							console.log( "schema value:", JSON.stringify(schemaSelectedObject,
								function(k, v) {
								    let v2 = JSON.parse(JSON.stringify(v));
								    if (typeof v2 === 'object') {
									    for (let o in v2) {}
								    }
								    return v2;
								}));

							////////////////////////////////////////////////////////
							let instancePath = error.instanceLocation.substr(error.instanceLocation.lastIndexOf("#")+2).replaceAll("/", " > ");
							console.log("instance location:", instancePath)
							let instanceSelectedObject = selectObjectFromJson(instance, instancePath);
							console.log("instance value:", JSON.stringify(instanceSelectedObject));
							console.log( "instance shorthand value:", JSON.stringify(instanceSelectedObject,
								function(k, v) {
								    let v2 = JSON.parse(JSON.stringify(v));
								    if (typeof v2 === 'object') {
									    for (let o in v2) {
										if (typeof v2[o] === 'object') {
											    v2[o] = "|omitted|";
										}
									    }
								    }
								    return v2;
								}));
							console.log();
						}
					}
      setValidation({ valid: output.valid, errors: output.errors ?? [] });
    } catch (e) {
      setValidation({ valid: null, message: `Schema unavailable: ${e.message}` });
    }
  };

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
    const mixers = []; // Allows for processing any dynamically loaded HAnim mixers

    const init = () => {
      async function fetchData() {
      try {
        setLoading(true);
        const container = containerRef.current;
        if (!container) return;

        // 1. Parse + validate JSON
        const x3dData = JSON.parse(jsonInput);
        runSchemaValidation(x3dData); // async, non-blocking

        // 2. Setup Three.js
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a2e);
        clock = new THREE.Clock();

        const width = container.clientWidth;
        const height = container.clientHeight;

        camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.set(0, 5, 20);

        // 3. Setup WebGPU Renderer
        renderer = new WebGPURenderer({ antialias: true });
        await renderer.init();
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
 	      renderer.outputColorSpace = THREE.SRGBColorSpace;

        container.innerHTML = '';
        container.appendChild(renderer.domElement);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        scene.add(ambientLight);

        // 4. Parse main X3D scene graph recursively
        // (This waits for ALL inline scenes/humanoids to resolve gracefully)
        if (x3dData.X3D?.Scene) {
          await parseNode(x3dData.X3D.Scene, scene);
        }

        // 5. Process Routes (This runs globally, resolving refs for main and all inline scenes!)
        processRoutes();

        // 6. Animation Loop
        const animate = () => {
          // getDelta() must be called ONLY ONCE per frame!
          const delta = clock.getDelta();
          const elapsedTime = clock.elapsedTime;

          // Update ALL mixers retrieved from Inline loading / humanoid parsing
          mixers.forEach(mixer => mixer.update(delta));

          timeSensors.forEach(sensor => {
            if (sensor.enabled && sensor.loop) {
              sensor.fraction_changed =
                (elapsedTime % sensor.cycleInterval) / sensor.cycleInterval;
            }
          });

          routeUpdates.forEach(fn => fn());
          billboards.forEach(b => b.lookAt(camera.position));

          controls.update();
          renderer.render(scene, camera);
        };

        renderer.setAnimationLoop(animate);

        // 7. Resize Handling
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
      fetchData();
    };

    // ── Parser ──────────────────────────────────────────────────────────────

    const chunk = (arr, n) => {
      const out = [];
      for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
      return out;
    };

    const parseNode = async (node, parent) => {
      const children = node['-children'];
      if (children) {
        for (const child of children) {
          await parseChild(child, parent);
        }
      }
    };

    const parseChild = async (child, parent) => {
      const defName = Object.values(child)[0]?.['@DEF'];
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

      } else if (child.Inline) {
        // Handle external scene fetching (Including Humanoids)
        const urlArray = child.Inline['@url'];
        if (urlArray && urlArray.length > 0) {
          const url = urlArray[0];
          object = new THREE.Group();

          try {
            let inlineJson;
            try {
              // 1. Standard web loading (Expects url available from server, e.g. /public)
              const response = await fetch(url);
              if (!response.ok) throw new Error(`HTTP ${response.status}`);
              inlineJson = await response.json();
            } catch (fetchErr) {
              // 2. Fallback to Dynamic Import (Useful if running in strict Vite local '/src' folders)
              console.warn(`Fetch failed for Inline ${url}, attempting dynamic import...`, fetchErr.message);
              const cleanUrl = url.startsWith('src/') ? url.substring(4) : url;
              const module = await import(/* @vite-ignore */ `./${cleanUrl}`);
              inlineJson = module.default || module;
            }

            // A) Parse standard X3D recursive nodes inside the dynamically loaded file.
            // This injects any local TimeSensors & Routes directly into the global pool so they animate.
            if (inlineJson.X3D?.Scene) {
              await parseNode(inlineJson.X3D.Scene, object);
            }

            // B) Invoke specialized loader to resolve specific HAnim nodes
            const humanoidResult = await loadX3DHumanoid(inlineJson, scene);
            if (humanoidResult) {
              const { mesh, mixer } = humanoidResult;
              if (mesh) {
                mesh.frustumCulled = false;
                object.add(mesh);
              }
              if (mixer) {
                mixers.push(mixer);
              }
            }

          } catch (err) {
            console.error(`Failed to load Inline scene from ${url}:`, err);
          }
        }

      } else if (child.Shape) {
        object = await createShape(child.Shape);

      // ── Lights ───────────────────────────────────────────────────────────
      } else if (child.DirectionalLight) {
        const d = child.DirectionalLight;
        object = new THREE.DirectionalLight(
          new THREE.Color(...(d['@color'] || [1, 1, 1])),
          d['@intensity'] ?? 1
        );
        if (d['@direction'])
          object.position.copy(
            new THREE.Vector3(...d['@direction']).negate().multiplyScalar(10)
          );

      } else if (child.PointLight) {
        const p = child.PointLight;
        object = new THREE.PointLight(
          new THREE.Color(...(p['@color'] || [1, 1, 1])),
          p['@intensity'] ?? 1
        );
        if (p['@location']) object.position.set(...p['@location']);

      } else if (child.SpotLight) {
        const s = child.SpotLight;
        object = new THREE.SpotLight(
          new THREE.Color(...(s['@color'] || [1, 1, 1])),
          s['@intensity'] ?? 1
        );
        if (s['@location']) object.position.set(...s['@location']);
        if (s['@direction']) {
          const target = new THREE.Object3D();
          target.position
            .copy(object.position)
            .add(new THREE.Vector3(...s['@direction']));
          object.target = target;
          scene.add(target);
        }
        if (s['@angle'] !== undefined) object.angle = s['@angle'];

      // ── Environment ───────────────────────────────────────────────────────
      } else if (child.Background) {
        const bg = child.Background;
        if (bg['@skyColor']) {
          const [r, g, b] = bg['@skyColor'];
          scene.background = new THREE.Color(r, g, b);
        }
        if (defName) defRegistry.set(defName, scene.background);

      // ── Animation ─────────────────────────────────────────────────────────
      } else if (child.TimeSensor) {
        const raw = child.TimeSensor;
        const ts = {
          cycleInterval: raw['@cycleInterval'] ?? 1,
          loop:    raw['@loop']    !== false,
          enabled: raw['@enabled'] !== false,
          fraction_changed: 0
        };
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

    // ── Factories ────────────────────────────────────────────────────────────

    const createTransform = (data) => {
      const group = new THREE.Group();
      if (data['@translation']) group.position.set(...data['@translation']);
      if (data['@rotation']) {
        const [x, y, z, angle] = data['@rotation'];
        group.setRotationFromAxisAngle(new THREE.Vector3(x, y, z).normalize(), angle);
      }
      if (data['@scale']) group.scale.set(...data['@scale']);
      return group;
    };

    const createShape = async (data) => {
      const geo = await createGeometry(data['-geometry']);
      const mat = createMaterial(data['-appearance']);

      if (geo && geo.isGroup) {
        geo.traverse((child) => {
          if (child.isMesh) {
            child.material = new THREE.MeshBasicMaterial({
              color: mat.color,
              side: THREE.FrontSide
            });
          }
        });
        return geo;
      }

      if (geo && mat) {
        const hasVertexColors = geo.hasAttribute('color');

        if (geo.isLineGeometry) {
          return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
            color: hasVertexColors ? 0xffffff : mat.color,
            vertexColors: hasVertexColors
          }));
        }

        if (geo.isPointGeometry) {
          return new THREE.Points(geo, new THREE.PointsMaterial({
            color: hasVertexColors ? 0xffffff : mat.color,
            vertexColors: hasVertexColors,
            size: 0.1
          }));
        }

        mat.vertexColors = hasVertexColors;
        return new THREE.Mesh(geo, mat);
      }
      return null;
    };

    const createGeometry = async (data) => {
      if (!data) return null;

      if (data.Box)
        return new THREE.BoxGeometry(...(data.Box['@size'] || [1, 1, 1]));

      if (data.Sphere)
        return new THREE.SphereGeometry(data.Sphere['@radius'] ?? 1, 32, 32);

      if (data.Cone)
        return new THREE.ConeGeometry(
          data.Cone['@bottomRadius'] ?? 1,
          data.Cone['@height'] ?? 2,
          32
        );

      if (data.Cylinder)
        return new THREE.CylinderGeometry(
          data.Cylinder['@radius'] ?? 1,
          data.Cylinder['@radius'] ?? 1,
          data.Cylinder['@height'] ?? 2,
          32
        );

      if (data.Torus)
        return new THREE.TorusGeometry(
          data.Torus['@outerRadius'] ?? 1,
          data.Torus['@innerRadius'] ?? 0.4,
          16, 32
        );

      if (data.IndexedFaceSet) return createIndexedFaceSet(data.IndexedFaceSet);
      if (data.IndexedLineSet) return createIndexedLineSet(data.IndexedLineSet);
      if (data.PointSet)       return createPointSet(data.PointSet);
      if (data.Text)           return createTextGeometry(data.Text);
      if (data.Extrusion)      return createExtrusion(data.Extrusion);
      if (data.ElevationGrid)  return createElevationGrid(data.ElevationGrid);

      return null;
    };

    const createMaterial = (appearance) => {
      const m = appearance?.Appearance?.['-material']?.Material;
      if (!m) return new THREE.MeshStandardMaterial({ color: 0x888888 });

      const params = {
        color: m['@diffuseColor']
          ? new THREE.Color(...m['@diffuseColor'])
          : 0xffffff,
        roughness: 1 - (m['@shininess'] ?? 0.2),
        metalness: 0.1
      };

      if (m['@emissiveColor'])
        params.emissive = new THREE.Color(...m['@emissiveColor']);

      if (m['@transparency']) {
        params.transparent = true;
        params.opacity = 1 - m['@transparency'];
      }

      const mat = new THREE.MeshStandardMaterial(params);
      if (m['@DEF']) defRegistry.set(m['@DEF'], mat);
      return mat;
    };

    // ── Geometry helpers ─────────────────────────────────────────────────────

    const createIndexedFaceSet = (ifs) => {
      const geo = new THREE.BufferGeometry();
      const rawPoints = ifs['-coord']?.Coordinate?.['@point'] || [];
      const rawColors = ifs['-color']?.Color?.['@color'] || [];
      const points  = chunk(rawPoints, 3);
      const colors  = chunk(rawColors, 3);
      const indices = ifs['@coordIndex'] || [];
      const vertices = [], vertexColors = [];

      let face = [];
      indices.forEach(idx => {
        if (idx === -1) {
          for (let i = 1; i < face.length - 1; i++) {
            const [a, b, c] = [face[0], face[i], face[i + 1]];
            vertices.push(...points[a], ...points[b], ...points[c]);
            if (colors.length)
              vertexColors.push(
                ...(colors[a] || [1, 1, 1]),
                ...(colors[b] || [1, 1, 1]),
                ...(colors[c] || [1, 1, 1])
              );
          }
          face = [];
        } else face.push(idx);
      });

      geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      if (vertexColors.length)
        geo.setAttribute('color', new THREE.Float32BufferAttribute(vertexColors, 3));
      geo.computeVertexNormals();
      return geo;
    };

    const createIndexedLineSet = (ils) => {
      const geo = new THREE.BufferGeometry();
      const rawPoints = ils['-coord']?.Coordinate?.['@point'] || [];
      const rawColors = ils['-color']?.Color?.['@color'] || [];
      const points = chunk(rawPoints, 3);
      const colors = chunk(rawColors, 3);
      const indices = ils['@coordIndex'] || [];
      const vertices = [], vertexColors = [];

      let line = [];
      indices.forEach(idx => {
        if (idx === -1) { line = []; return; }
        line.push(idx);
        if (line.length === 2) {
          vertices.push(...points[line[0]], ...points[line[1]]);
          if (colors.length)
            vertexColors.push(
              ...(colors[line[0]] || [1, 1, 1]),
              ...(colors[line[1]] || [1, 1, 1])
            );
          line.shift();
        }
      });

      geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      if (vertexColors.length)
        geo.setAttribute('color', new THREE.Float32BufferAttribute(vertexColors, 3));
      geo.isLineGeometry = true;
      return geo;
    };

    const createPointSet = (ps) => {
      const geo = new THREE.BufferGeometry();
      const rawPoints = ps['-coord']?.Coordinate?.['@point'] || [];
      const rawColors = ps['-color']?.Color?.['@color'] || [];
      geo.setAttribute('position', new THREE.Float32BufferAttribute(rawPoints, 3));
      if (rawColors.length)
        geo.setAttribute('color', new THREE.Float32BufferAttribute(rawColors, 3));
      geo.isPointGeometry = true;
      return geo;
    };

    const createTextGeometry = async (textData) => {
      const font = await new Promise((resolve, reject) => {
        new FontLoader().load(
          'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
          resolve, undefined, reject
        );
      });

      const strings = textData['@string'] || ['Text'];
      const size    = textData['-fontStyle']?.FontStyle?.['@size'] ?? 1;

      if (strings.length === 1) {
        const geometry = new TextGeometry(strings[0], { font, size, depth: 0, curveSegments: 12 });
        geometry.computeVertexNormals();
        return geometry;
      }

      const group = new THREE.Group();
      strings.forEach((str, index) => {
        const geometry = new TextGeometry(str, { font, size, depth: 0, curveSegments: 12 });
        geometry.computeVertexNormals();
        const mesh = new THREE.Mesh(geometry);
        mesh.position.y = -index * size * 1.2;
        group.add(mesh);
      });
      return group;
    };

    const createExtrusion = (ext) => {
      const crossSection = ext['@crossSection'] || [[1,1],[1,-1],[-1,-1],[-1,1],[1,1]];
      const spine        = ext['@spine']        || [[0,0,0],[0,1,0]];
      const shape = new THREE.Shape();
      crossSection.forEach((p, i) => {
        if (i === 0) shape.moveTo(p[0], p[1]);
        else         shape.lineTo(p[0], p[1]);
      });
      return new THREE.ExtrudeGeometry(shape, {
        steps: spine.length, depth: 1, bevelEnabled: false
      });
    };

    const createElevationGrid = (eg) => {
      const xDim    = eg['@xDimension'] ?? 2;
      const zDim    = eg['@zDimension'] ?? 2;
      const xSpacing= eg['@xSpacing']   ?? 1;
      const zSpacing= eg['@zSpacing']   ?? 1;
      const heights = eg['@height']     || [];
      const geo     = new THREE.BufferGeometry();
      const vertices = [];

      for (let z = 0; z < zDim - 1; z++) {
        for (let x = 0; x < xDim - 1; x++) {
          const [i1,i2,i3,i4] = [
            z*xDim+x, z*xDim+(x+1), (z+1)*xDim+(x+1), (z+1)*xDim+x
          ];
          const [h1,h2,h3,h4] = [heights[i1]||0, heights[i2]||0, heights[i3]||0, heights[i4]||0];
          vertices.push(
            x*xSpacing,     h1, z*zSpacing,
            (x+1)*xSpacing, h2, z*zSpacing,
            (x+1)*xSpacing, h3, (z+1)*zSpacing,
            x*xSpacing,     h1, z*zSpacing,
            (x+1)*xSpacing, h3, (z+1)*zSpacing,
            x*xSpacing,     h4, (z+1)*zSpacing
          );
        }
      }
      geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      geo.computeVertexNormals();
      return geo;
    };

    // ── Interpolators ─────────────────────────────────────────────────────────

    const createInterpolator = (data, dims) => ({
      key:     data['@key'],
      keyValue: chunk(data['@keyValue'], dims),
      value_changed: null,
      set_fraction(f) {
        for (let i = 0; i < this.key.length - 1; i++) {
          if (f >= this.key[i] && f <= this.key[i + 1]) {
            const t  = (f - this.key[i]) / (this.key[i + 1] - this.key[i]);
            const v1 = this.keyValue[i];
            const v2 = this.keyValue[i + 1];
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

    // ── Routes ────────────────────────────────────────────────────────────────
    const processRoutes = () => {
      routes.forEach(r => {
        const from = defRegistry.get(r['@fromNode']);
        const to   = defRegistry.get(r['@toNode']);
        if (!from || !to) return;

        routeUpdates.push(() => {
          if (from.fraction_changed !== undefined && to.set_fraction)
            to.set_fraction(from.fraction_changed);

          if (from.value_changed) {
            const tf = r['@toField'];
            if (tf === 'set_translation' && to.position)
              to.position.set(...from.value_changed);
            else if (tf === 'set_rotation' && to.setRotationFromAxisAngle) {
              const [x, y, z, a] = from.value_changed;
              to.setRotationFromAxisAngle(new THREE.Vector3(x, y, z).normalize(), a);
            }
            else if (tf === 'set_scale' && to.scale)
              to.scale.set(...from.value_changed);
            else if (tf === 'set_diffuseColor' && to.color)
              to.color.setRGB(...from.value_changed);
          }
        });
      });
    };

    init();

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      if (renderer) {
        renderer.setAnimationLoop(null);
        try { renderer.dispose(); } catch (e) {}
      }
    };
  }, [jsonInput]);

  // ── Validation badge ──────────────────────────────────────────────────────
  const validationBadge = (() => {
    if (!validation) return null;
    if (validation.valid === null)
      return <span className="badge badge-warn" title={validation.message}>⚠ Schema N/A</span>;
    return validation.valid
      ? <span className="badge badge-ok">✔ X3D Valid</span>
      : <span className="badge badge-err" title={JSON.stringify(validation.errors, null, 2)}>✘ Invalid ({validation.errors?.length ?? '?'} error(s))</span>;
  })();

  return (
    <div className="app-container">
      <div className="header">
        <h1>X3D WebGPU Renderer</h1>
        {validationBadge}
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
          <button
            className="btn"
            onClick={() => {
              const temp = jsonInput;
              setJsonInput('');
              setTimeout(() => setJsonInput(temp), 10);
            }}
          >
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
