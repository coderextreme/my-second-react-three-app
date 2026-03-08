// The X_ITE renderer handles loading `scene.json` parsing natively in the HTML.
// All Rigid Body components, joints, masses, and forces have successfully been 
// extracted from JS into standard X3D components in the JSON.

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('x3d-canvas');
    
    canvas.addEventListener('load', () => {
        console.log("X3D Scene and Rigid Body Simulation successfully loaded.");
        console.log("Physics routing and events are natively bound via X3D <ROUTE> inside the JSON file.");
    });
});
