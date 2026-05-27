import {MakeLine, MakeVFld, MakeCurve, MakeSphere, MakeFunctionMesh} from './geometry-gen/make-geometry'
import * as THREE from 'three'
import * as CE from '@cortex-js/compute-engine';

const UP = new THREE.Vector3(0, 0, 1)
/* parentheses shorthand */
const PL = '//left('
const PR = '//right)'

/*
  NOTE: FOR ALL, YOU MUST SWITCH Y AND Z
  SINCE 8TH WALL TREATS Y AS UP AXIS
 */

/* helper keeps me from having to rewrite */
/* create the equation w/ added safeguards for potential missing vars */
const EquationHelper = (value, type) => {
  if (type === 'func') {
    return `${PL}${value.left}${PR}-${PL}${value.right}${PR}
            +${PL}0*x${PR}+${PL}0*y${PR}+${PL}0*z${PR}`
  } else if (type === 'vfld') {
    return `${PL}${value}${PR}+${PL}0*x${PR}+${PL}0*y${PR}+
            ${PL}0*z${PR}`
  } else {
    return `${PL}${value}${PR}+${PL}0*t${PR}`
  }
}

const ProcessFunc = (value) => {
  let ce = null
  /* parse the latex input */
  try {
    ce = new CE.ComputeEngine()
  } catch (e) {
    /* eslint-disable-next-line no-console */
    console.log(`INVALID CE ERROR: ${e}`)
    return -1
  }
  /* create the equation w/ added safeguards for potential missing vars */
  const eqstring = EquationHelper(value, 'func')
  /* eslint-disable-next-line no-console */
  console.log(eqstring)
  const eq = ce.parse(eqstring.replaceAll('//', '\\'))  // fixes latex delimiters
  /* eslint-disable-next-line no-console */
  console.log(eq.json)
  return MakeFunctionMesh(ce, eq)
}

const ProcessCurve = (value) => {
  let ce = null
  /* parse the latex input */
  try {
    ce = new CE.ComputeEngine()
  } catch (e) {
    /* eslint-disable-next-line no-console */
    console.log(`INVALID CE ERROR: ${e}`)
    return -1
  }
  try {
    const eqs = {}
    for (const element of ['x', 'y', 'z']) {
      let eqstring = EquationHelper(value[element], 'scrv')
      eqs[element] = ce.parse(eqstring.replaceAll('//', '\\'))  // fixes latex delimiters
    }
    const curve = MakeCurve(ce, eqs, 10)
    return curve
  } catch (e) {
    /* eslint-disable-next-line no-console */
    console.log(`INVALID CURVE ERROR: ${e}`)
    return -1
  }
}

const ProcessVec = (value) => {
  let ce = null
  /* parse the latex input */
  try {
    ce = new CE.ComputeEngine()
  } catch (e) {
    /* eslint-disable-next-line no-console */
    console.log(`INVALID CE ERROR: ${e}`)
    return -1
  }
  try {
    /* direction vector */
    const vec = new THREE.Vector3(
      Number(`${ce.parse(value.vec.x).value}`),
      Number(`${ce.parse(value.vec.z).value}`),
      Number(`${ce.parse(value.vec.y).value}`)
    )
    /* ie, known point of intersection */
    const init = new THREE.Vector3(
      Number(`${ce.parse(value.init.x).value}`),
      Number(`${ce.parse(value.init.z).value}`),
      Number(`${ce.parse(value.init.y).value}`)
    )
    /* make the line eddboy */
    return MakeLine(init, vec)
  } catch (e) {
    /* eslint-disable-next-line no-console */
    console.log(`VEC PARSING ERROR: ${e}`)
    return -1
  }
}

const ProcessVFld = (value) => {
  let ce = null
  /* parse the latex input */
  try {
    ce = new CE.ComputeEngine()
  } catch (e) {
    /* eslint-disable-next-line no-console */
    console.log(`INVALID CE ERROR: ${e}`)
    return -1
  }
  try {
    const eqs = {}
    for (const element of ['x', 'y', 'z']) {
      let eqstring = EquationHelper(value[element], 'vfld')
      eqs[element] = ce.parse(eqstring.replaceAll('//', '\\'))  // fixes latex delimiters
    }
    const vfld = MakeVFld(ce, eqs, 10)
    /* eslint-disable-next-line no-console */
    console.log('vfld made')
    return vfld
  } catch (e) {
    /* eslint-disable-next-line no-console */
    console.log(`INVALID VFLD ERROR: ${e}`)
    return -1
  }
}

const ProcessPt = (value) => {
  let ce = null
  /* parse the latex input */
  try {
    ce = new CE.ComputeEngine()
  } catch (e) {
    /* eslint-disable-next-line no-console */
    console.log(`INVALID CE ERROR: ${e}`)
    return -1
  }
  try {
    /* point coords */
    const vec = new THREE.Vector3(
      Number(`${ce.parse(value.x).value}`),
      Number(`${ce.parse(value.y).value}`),
      Number(`${ce.parse(value.z).value}`)
    )
    return MakeSphere(vec)
  } catch (e) {
    /* eslint-disable-next-line no-console */
    console.log(`PT PARSING ERROR: ${e}`)
    return -1
  }
}

export const ProcessInputs = (inputs) => {
  const components = []
  if (inputs) {
    for (const [key, value] of Object.entries(inputs)) {
      /* type of graph component changes how we process */
      const type = key.split(' ')[0]
      /* eslint-disable-next-line no-console */
      console.log(`TYPE: ${type}`)
      /* eslint-disable-next-line no-console */
      console.log(value)
      let returnval = -1
      switch (type) {
        case 'Func':
          returnval = ProcessFunc(value)
          break
        case 'Vec':
          returnval = ProcessVec(value)
          break
        case 'Pt':
          returnval = ProcessPt(value)
          break
        case 'SCrv':
          returnval = ProcessCurve(value)
          break
        case 'VFld':
          returnval = ProcessVFld(value)
          break
        default:
          returnval = -1
      }
      if (returnval !== -1) {
        components.push([key, returnval])
      }
    }
  }
  // TODO: ADD ERROR FLAGS
  return components
}