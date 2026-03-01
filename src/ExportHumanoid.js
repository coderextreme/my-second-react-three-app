import { createHumanoid } from './HumanoidComplete.js';

const { mesh, animations } = createHumanoid();
scene.add(mesh);

const mixer = new THREE.AnimationMixer(mesh);
const walkAction = mixer.clipAction(THREE.AnimationClip.findByName(animations, 'Walk'));
walkAction.play();

// Main loop
function animate() {
	mixer.update(clock.getDelta());
	renderer.render(scene, camera);
	requestAnimationFrame(animate);
}
