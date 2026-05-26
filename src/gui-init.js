export const BaseComponentGui = (params, gui, mesh, name, vars, callbacks) => {
    const newparam = `show${name.replace(' ', '')}`
    params[newparam] = true  //  new visibility param
    let currgui = gui
    if (name.includes('VFld')) {
      currgui = gui.addFolder(name.replace(' ', ''))
      currgui.add(params, 'xVectors', 5, 50, 1).name('X Vectors').onChange((value) => {
        vars.axisvecs.x = value
        callbacks.axisUpdate[2]()
      })
      currgui.add(params, 'yVectors', 5, 50, 1).name('Y Vectors').onChange((value) => {
        vars.axisvecs.y = value
        callbacks.axisUpdate[2]()
      })
      currgui.add(params, 'zVectors', 5, 50, 1).name('Z Vectors').onChange((value) => {
        vars.axisvecs.z = value
        callbacks.axisUpdate[2]()
      })
    }
    currgui.add(params, newparam).name(`show ${name.toLowerCase()}`).onChange((value) => {
      mesh.visible = value
    })
      
  }
  
  export const GuiCallbacks = (params, gui, vars, axes, componentGroup, callbacks, renderer, scene, camera) => {
    // allow entire graph to be rescaled
    gui.add(params, 'scale', 0.1, 1.0, 0.1).name('scale').onChange((value) => {
      vars.scenescale = value / 2
      const tempscale = vars.axisscale * vars.scenescale
      componentGroup.scale.set(vars.scenescale, vars.scenescale, vars.scenescale)
      axes.scale.set(tempscale, tempscale, tempscale)
    })
    // allow space curve animation
    gui.add(params, 't', -vars.scale, vars.scale, 0.1).name('t').onChange((value) => {
      vars.t = value
      callbacks['updateSpaceCurvePoints']()
      renderer.render(scene, camera)
    })
    // alllow axes to be toggled and to expand for inputs which may exceed default range
    const axisGui = gui.addFolder('Axes')
    axisGui.add(params, 'showAxes').name('show axes').onChange((value) => {
      axes.visible = value
    })
    // changing the axis max also changes meshes!
    axisGui.add(params, 'axisMax', 10, 100, 1).name('axis max').onFinishChange((value) => {
      vars.axisscale = (value / 10)
      const tempscale = vars.axisscale * vars.scenescale
      axes.scale.set(tempscale, tempscale, tempscale)
      vars.scale = value
      vars.size = vars.scale + 20
      // works but is sooooo slow
      callbacks.axisUpdate.forEach((callback) => {
        callback()
      })
      renderer.render(scene, camera)
    })
  }