// Define an 8th Wall XR Camera Pipeline Module that adds a cube to a threejs scene on startup.

import {ParseUrl} from './url-parser'
import {ProcessInputs} from './process-inputs'
import {UpdateCurve, UpdateFunctionMesh, UpdateVFld, MakeArrow} from './geometry-gen/make-geometry'
import {BaseComponentGui, GuiCallbacks} from './gui-init'
import { GUI } from 'dat.gui'

// allows vars to be updated by externalgui callback
const vars = {
'scenescale': 0.5,
'axisscale': 1,
'size': 30,
'scale': 10,
't': 0,
'axisvecs': {'x': 9, 'y': 9, 'z': 1},
}

// these get updated with callback functions
const functionMeshes = []
const spaceCurveMeshes = []
const vectorFieldMeshes = []

const updateFunctionMeshes = () => {
functionMeshes.forEach((func) => {
  UpdateFunctionMesh(func.ce, func.equation, vars.scale, vars.size, func.mesh)
})
}

const updateCurveMeshes = () => {
spaceCurveMeshes.forEach((sCrv) => {
  UpdateCurve(sCrv, vars.scale)
})
}

const updateSpaceCurvePoints = () => {
spaceCurveMeshes.forEach((sCrv) => {
  const newpoint = {'x': 0, 'y': 0, 'z': 0}
  sCrv.ce.assign('t', vars.t)
  for (const element of ['x', 'y', 'z']) {
    const result = `${sCrv.eqs[element].evaluate()}`
    if (isNaN(result) === false) {
      newpoint[element] = Number(result)
    }
  }
  sCrv.point.position.set(newpoint.x, newpoint.z, newpoint.y)
})
}

const updateVFldMeshes = () => {
vectorFieldMeshes.forEach((vFld) => {
  UpdateVFld(vars, vFld)
})
}

const callbacks = {
'axisUpdate': [
  updateFunctionMeshes,
  updateCurveMeshes,
  updateVFldMeshes,
],
'updateSpaceCurvePoints': updateSpaceCurvePoints,
}

export const initScenePipelineModule = () => {
  const purple = 0xAD50FF

  // Populates a cube into an XR scene and sets the initial camera position.
  const initXrScene = ({scene, camera, renderer}) => {
    // Enable shadows in the rednerer.
    renderer.shadowMap.enabled = true

    // Add some light to the scene.
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    directionalLight.position.set(5, 10, 7)
    directionalLight.castShadow = true
    scene.add(directionalLight)

    // Set the initial camera position relative to the scene we just laid out. This must be at a
    // height greater than y=0.
    camera.position.set(0, 2, 2)

    const params = {
      showAxes: true,
      axisMax: 10,
      scale: 1.0,
      t: 0,
      xVectors: vars.axisvecs.x,
      yVectors: vars.axisvecs.y,
      zVectors: vars.axisvecs.z,
    }

    /* could use axishelper but planes are more helpful visually */
    /* order: x, y, z */
    const axisPlanes = [
      [new THREE.PlaneGeometry(10, 10), 0xff0000],
      [new THREE.PlaneGeometry(10, 10), 0x0000ff],
      [new THREE.PlaneGeometry(10, 10), 0x00ff00],
    ]
    /* necessary rotations for x and z */
    axisPlanes[0][0].rotateX(Math.PI / 2)
    axisPlanes[2][0].rotateY(Math.PI / 2)

    /* make group of planes, set all to receive shadow */
    const axes = new THREE.Group()
    for (const plane of axisPlanes) {
      const axis = new THREE.Mesh(plane[0], new THREE.MeshBasicMaterial({
        color: plane[1],
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4,
      }))
      axes.add(axis)
    }

    /* TODO: add outlines to axes to increase visibility */

    axes.scale.set(vars.scenescale, vars.scenescale, vars.scenescale)
    axes.receiveShadow = true
    axes.castShadow = false
    axes.visible = true

    scene.add(axes)

    /* lines to make axes usable even if user doesnt like the planes */
    const lineAxes = new THREE.Group()
    const origin = new THREE.Vector3(0, 0, 0)
    const lines = [
      [new THREE.Vector3(0, 30, 0), 0x0000ff, '+z'],  // +z
      [new THREE.Vector3(0, -30, 0), 0x0000ff, '-z'],  // -z
      [new THREE.Vector3(0, 0, 30), 0x00ff00, '+y'],  // +y
      [new THREE.Vector3(0, 0, -30), 0x00ff00, '-y'],  // -y
      [new THREE.Vector3(30, 0, 0), 0xff0000, '+x'],  // +x
      [new THREE.Vector3(-30, 0, 0), 0xff0000, '-x'],  // -x
    ]
    lines.forEach((line) => {
      const axis = MakeArrow(origin, line[0], line[1], 3)
      /* TODO: figure out labels */
      lineAxes.add(axis)
    })
    scene.add(lineAxes)

    // GUI - allows users to toggle axis visibility
    const gui = new GUI({width: 250})
    gui.domElement.id = 'gui'

    const inputvalues = ParseUrl()
    const components = ProcessInputs(inputvalues)
    const componentGroup = new THREE.Group()

    /* makes component visibility togglable */
    const componentGui = gui.addFolder('Components')
    if (components.length > 0) {
      /* eslint-disable-next-line no-console */
      console.log(components)
      for (const group of components) {
        let [name, mesh] = group
        if (name.includes('Func')) {
          functionMeshes.push({...mesh})
          mesh = mesh.group
        } else if (name.includes('SCrv')) {
          spaceCurveMeshes.push({...mesh})
          let tempgroup = new THREE.Group()
          tempgroup.add(mesh.mesh)
          tempgroup.add(mesh.point)
          mesh = tempgroup
        } else if (name.includes('VFld')) {
          vectorFieldMeshes.push({...mesh})
          mesh = mesh.group
        }
        componentGroup.add(mesh)
        BaseComponentGui(params, componentGui, mesh, name, vars, callbacks)
      }
    }

    /* eslint-disable-next-line no-console */
    console.log(componentGroup)
    componentGroup.scale.set(vars.scenescale, vars.scenescale, vars.scenescale)
    scene.add(componentGroup)

    /* sets up the rest of the gui */
    GuiCallbacks(params, gui, vars, axes, componentGroup, callbacks, renderer, scene, camera)
  }

  // Return a camera pipeline module that adds scene elements on start.
  return {
    // Camera pipeline modules need a name. It can be whatever you want but must be unique within
    // your app.
    name: 'threejsinitscene',

    // onStart is called once when the camera feed begins. In this case, we need to wait for the
    // XR8.Threejs scene to be ready before we can access it to add content. It was created in
    // XR8.Threejs.pipelineModule()'s onStart method.
    onStart: ({canvas}) => {
      const {scene, camera, renderer} = XR8.Threejs.xrScene()  // Get the 3js scene from XR8.Threejs

      initXrScene({scene, camera, renderer})  // Add objects set the starting camera position.

      // prevent scroll/pinch gestures on canvas
      canvas.addEventListener('touchmove', (event) => {
        event.preventDefault()
      })

      // Sync the xr controller's 6DoF position and camera paremeters with our scene.
      XR8.XrController.updateCameraProjectionMatrix(
        {origin: camera.position, facing: camera.quaternion}
      )

      // Recenter content when the canvas is tapped.
      canvas.addEventListener(
        'touchstart', (e) => {
          e.touches.length === 1 && XR8.XrController.recenter()
        }, true
      )
    },
  }
}
