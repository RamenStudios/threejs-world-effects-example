import {MarchingCubes} from './mcubes/marching-cubes'

/// /////////////////////////////////////////
///  NOTE: FOR ALL, YOU MUST SWITCH Y AND Z
///  SINCE 8TH WALL TREATS Y AS UP AXIS
/// /////////////////////////////////////////

const shadowHelper = (mesh) => {
  mesh.castShadow = true
  mesh.receiveShadow = false
}

/// /////////////////////////////////////////
///  START OF VECTORS
/// TODO: GET RID OF LINE + ARROW, JUST DO ARROW
/// /////////////////////////////////////////
/* makes arrow-ed companion to thick line */
export const MakeArrow = (init, vec, color = 0x0000ff) => {
  const dir = new THREE.Vector3(vec.x, vec.y, vec.z)
  dir.normalize()
  const length = init.distanceTo(vec) + 0.25
  const headlength = length * 0.15
  const headwidth = headlength
  const arrowHelper = new THREE.ArrowHelper(dir, init, length, color, headlength, headwidth)
  return arrowHelper
}

/* from three.js docs: https://threejs.org/docs/?q=line#api/en/objects/Line */
/* makes vectors */
export const MakeLine = (init, vec, isVFld = false) => {
  const linemat = new THREE.LineBasicMaterial({
    color: 0x0000ff,
  })
  const material = new THREE.LineMaterial({
    color: 0x0000ff,
    linewidth: 0.1,
    worldUnits: true,
  })

  const points = []
  points.push(init)
  let newvec  // makes later call easier
  if (isVFld) {
    material.linewidth = 0.05
    const norm = vec.normalize()
    newvec = new THREE.Vector3(init.x + norm.x, init.y + norm.y, init.z + norm.z)
    points.push(newvec)
  } else {
    points.push(vec)
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const linegeo = new THREE.LineGeometry().fromLine(new THREE.Line(geometry, linemat))
  const lineGroup = new THREE.Group()

  // if line for a vfld, color var
  if (!isVFld) {
    lineGroup.add(MakeArrow(init, vec))
  } else {
    const colorvec = vec.normalize()
    const color = new THREE.Color().setRGB(colorvec.x, colorvec.y, colorvec.z)
    material.color = color
    lineGroup.add(MakeArrow(init, newvec, color))
  }
  const line = new THREE.Line2(linegeo, material)
  lineGroup.add(line)
  return lineGroup
}
/// /////////////////////////////////////////
/// END OF VECTORS
/// /////////////////////////////////////////

/* makes vector field */
export const MakeVFld = (ce, eqs, scale = 10, axisvecs = null, update = false) => {
  const vecs = new THREE.Group()
  if (axisvecs === null) {
    axisvecs = {'x': 9, 'y': 9, 'z': 1}
  }

  const doublesize = scale * 2  // just to avoid recalculating 3 times lol

  // generate the list of vectors
  for (let x = -scale; x < scale; x += (doublesize / axisvecs.x)) {
    for (let y = -scale; y < scale; y += (doublesize / axisvecs.y)) {
      for (let z = -scale; z < scale; z += (doublesize / axisvecs.z)) {
        ce.assign('x', x)
        ce.assign('y', y)
        ce.assign('z', z)

        let add = true  // prevents nan values from being included in vecs
        const values = {'x': null, 'y': null, 'z': null}

        for (const element of ['x', 'y', 'z']) {
          const result = `${eqs[element].evaluate()}`
          if (isNaN(result) === false) {
            values[element] = Number(result)
          } else {
            add = false
            break
          }
        }
        if (add) {
          vecs.add(MakeLine(new THREE.Vector3(x, z, y), new THREE.Vector3(values.x, values.z, values.y), true))
        }
      }
    }
  }

  // if making new, return whole group. otherwise only need vecs
  if (update) {
    return vecs
  } else {
    return {
      'group': vecs,
      'ce': ce,
      'eqs': eqs,
    }
  }
}

export const UpdateVFld = (vars, vFld) => {
  vFld.group = MakeVFld(vFld.ce, vFld.eqs, vars.scale, vars.axisvecs, true)
}

/// /////////////////////////////////////////
///  START OF SPHERES/POINTS
/// /////////////////////////////////////////
/* makes spheres */
export const MakeSphere = (coords) => {
  const geometry = new THREE.SphereGeometry(0.1, 8, 8)
  // geometry.translate(coords.x, coords.z, coords.y)
  const material = new THREE.MeshToonMaterial({
    color: 0xffff00,
    side: THREE.DoubleSide,
  })
  const sphere = new THREE.Mesh(geometry, material)
  shadowHelper(sphere)
  sphere.position.set(coords.x, coords.z, coords.y)
  return sphere
}
/// /////////////////////////////////////////
/// END OF SPHERES/POINTS
/// /////////////////////////////////////////

/// /////////////////////////////////////////
///  START OF SPACE CURVES
/// /////////////////////////////////////////
/* makes space curves */
export const MakeCurve = (ce, eqs, scale) => {
  const points = []
  let zeropoint = {'x': 0, 'y': 0, 'z': 0}

  for (let t = -scale; t < scale; t += 0.1) {
    let add = true  // prevents nan values from being pushed to points
    const values = {'x': null, 'y': null, 'z': null}
    ce.assign('t', t)

    for (const element of ['x', 'y', 'z']) {
      const result = `${eqs[element].evaluate()}`
      if (isNaN(result) === false) {
        values[element] = Number(result)
      } else {
        add = false
        break
      }
    }
    if (add) {
      points.push(new THREE.Vector3(values.x, values.z, values.y))
    }
  }

  // get the zero point
  ce.assign('t', 0)
  for (const element of ['x', 'y', 'z']) {
    const result = `${eqs[element].evaluate()}`
    if (isNaN(result) === false) {
      zeropoint[element] = Number(result)
    } else {
      zeropoint[element] = 0
    }
  }

  // placeholder mats
  const linemat = new THREE.LineBasicMaterial({
    color: 0x0000ff,
  })
  const material = new THREE.LineMaterial({
    color: 0x0000ff,
    linewidth: 0.05,
    worldUnits: true,
  })

  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const linegeo = new THREE.LineGeometry().fromLine(new THREE.Line(geometry, linemat))
  return {
    'point': MakeSphere(new THREE.Vector3(zeropoint.x, zeropoint.y, zeropoint.z)),
    'mesh': new THREE.Line2(linegeo, material),
    'ce': ce,
    'eqs': eqs,
  }
}

/* CALLBACK FOR UPDATES */
export const UpdateCurve = (curve, scale) => {
  const points = []
  for (let t = -scale; t < scale; t += 0.1) {
    let add = true  // prevents nan values from being pushed to points
    const values = {'x': null, 'y': null, 'z': null}
    curve.ce.assign('t', t)

    for (const element of ['x', 'y', 'z']) {
      const result = `${curve.eqs[element].evaluate()}`
      if (isNaN(result) === false) {
        values[element] = Number(result)
      } else {
        add = false
        break
      }
    }
    if (add) {
      points.push(new THREE.Vector3(values.x, values.z, values.y))
    }
  }
  curve.mesh.geometry.dispose()
  const linemat = new THREE.LineBasicMaterial({
    color: 0x0000ff,
  })
  const material = new THREE.LineMaterial({
    color: 0x0000ff,
    linewidth: 0.05,
    worldUnits: true,
  })
  curve.mesh.geometry = new THREE.LineGeometry().fromLine(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), linemat))
}
/// /////////////////////////////////////////
/// END OF SPACE CURVES
/// /////////////////////////////////////////


/// ///////////////////////////////////////////////////////////////////////////////////////////////
/// adapted from tamani-coding's marching cubes example
/// the repo is here: https://github.com/tamani-coding/threejs-marching-cubes-example/blob/main/README.md
/// usage according to MIT license:
/// Copyright (c) 2023 tamani-coding

/// Permission is hereby granted, free of charge, to any person obtaining a copy
/// of this software and associated documentation files (the "Software"), to deal
/// in the Software without restriction, including without limitation the rights
/// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
/// copies of the Software, and to permit persons to whom the Software is
/// furnished to do so, subject to the following conditions:

/// The above copyright notice and this permission notice shall be included in all
/// copies or substantial portions of the Software.

/// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
/// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
/// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
/// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
/// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
/// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
/// SOFTWARE.
/// ///////////////////////////////////////////////////////////////////////////////////////////////
/* helper for getting points, so I don't rewrite the snipper */
const FunctionPointGetter = (ce, equation, scalein, sizein) => {
  /* generates points using marching cubes alg */
  const trianglePoints = MarchingCubes(ce, equation, scalein, sizein)
  const maxPolygons = 30000
  const vertices = Array(3 * maxPolygons).fill(0)
  /* faces */
  for (let i = 0; i < trianglePoints.length; i++) {
    const [x, y, z] = trianglePoints[i]
    vertices[i * 3]     = x
    vertices[i * 3 + 1] = z
    vertices[i * 3 + 2] = y
  }
  const positionAttribute = new THREE.Float32BufferAttribute(vertices, 3)
  return [positionAttribute, trianglePoints]
}

/* helper for function mesh material, so I don't rewrite the snippet */
const MakeFunctionMaterial = (geometry) => {
  geometry.computeBoundingBox()
  const material = new THREE.ShaderMaterial({
    uniforms: {
      color1: {
        value: new THREE.Color(0X2D0075),
      },
      color2: {
        value: new THREE.Color(0x60EFFF),
      },
      bboxMin: {
        value: geometry.boundingBox.min,
      },
      bboxMax: {
        value: geometry.boundingBox.max,
      },
    },
    vertexShader: `
      uniform vec3 bboxMin;
      uniform vec3 bboxMax;
    
      varying vec2 vUv;

      void main() {
        vUv.y = (position.y - bboxMin.y) / (bboxMax.y - bboxMin.y);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 color1;
      uniform vec3 color2;
    
      varying vec2 vUv;
      
      void main() {
        
        gl_FragColor = vec4(mix(color1, color2, vUv.y), 1.0);
      }
    `,
    wireframe: false,
    side: THREE.DoubleSide,
  })
  return material
}

/* generates the BufferGeometry mesh from given equation */
export const MakeFunctionMesh = (ce, equation, scalein = null, sizein = null) => {
  const [positionAttribute, trianglePoints] = FunctionPointGetter(ce, equation, scalein, sizein)
  const meshBufferGeometry = new THREE.BufferGeometry()
	meshBufferGeometry.setAttribute('position', positionAttribute)
  meshBufferGeometry.setDrawRange(0, trianglePoints.length)
  meshBufferGeometry.computeVertexNormals()

  /* make gradient material */
  /* from https://stackoverflow.com/questions/52614371/apply-color-gradient-to-material-on-mesh-three-js/52615186#52615186 */
  const material = MakeFunctionMaterial(meshBufferGeometry)

  const mesh = new THREE.Mesh(meshBufferGeometry, material)
  shadowHelper(mesh)

  /* return group as appropriate */
  const funcgroup = new THREE.Group()
  funcgroup.add(mesh)
  return {
    'group': funcgroup,
    'mesh': mesh,
    'ce': ce,
    'equation': equation,
  }
}
/// /////////////////////////////////////////
/// /////////////////////////////////////////

/// /////////////////////////////////////////
/// START OF UPDATE FUNCTIONS
/// /////////////////////////////////////////

/* updates BufferGeometry for a given equation */
export const UpdateFunctionMesh = (ce, equation, scalein, sizein, mesh) => {
  const [positionAttribute, trianglePoints] = FunctionPointGetter(ce, equation, scalein, sizein)
  mesh.geometry.setAttribute('position', positionAttribute)
  mesh.geometry.setDrawRange(0, trianglePoints.length)
  mesh.geometry.computeVertexNormals()
  mesh.material = MakeFunctionMaterial(mesh.geometry)
}