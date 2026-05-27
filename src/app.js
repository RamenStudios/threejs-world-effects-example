// app.js is the main entry point for your three.js 8th Wall app.

import {initScenePipelineModule} from './threejs-scene-init'
import * as THREE from 'three';
import {XR8Promise} from '@8thwall/engine-binary'

window.THREE = THREE

const onxrloaded = () => {  
  XR8.addCameraPipelineModules([  // Add camera pipeline modules.
    // Existing pipeline modules.
    XR8.GlTextureRenderer.pipelineModule(),      // Draws the camera feed.
    XR8.Threejs.pipelineModule(),                // Creates a ThreeJS AR Scene.
    XR8.XrController.pipelineModule(),           // Enables SLAM tracking.
    LandingPage.pipelineModule(),         // Detects unsupported browsers and gives hints.
    XRExtras.FullWindowCanvas.pipelineModule(),  // Modifies the canvas to fill the window.
    XRExtras.Loading.pipelineModule(),           // Manages the loading screen on startup.
    XRExtras.RuntimeError.pipelineModule(),      // Shows an error image on runtime error.
    // Custom pipeline modules.
    initScenePipelineModule(),  // Sets up the threejs camera and scene content.
  ])

  const canvas = document.getElementById('camerafeed')
  console.log(canvas)
  // Open the camera and start running the camera run loop.
  try {
    XR8.run({canvas})
  } catch (e) {
    console.log(`unable to load XR8 ${e}`)
  }
}

console.log(window.XR8)
XR8Promise.then(() => onxrloaded())

//window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)
