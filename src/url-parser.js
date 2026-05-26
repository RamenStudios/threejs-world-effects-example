/* default equation set */
// const defaultfunc = {'left': 'x^2+y^2+z^2', 'right': '1'}
// const defaultfunc = {'left': 'x^2', 'right': 'z'}
// const defaultfunc = {'left': 'x^2+y^2', 'right': 'z'}
// const defaultfunc = {'left': 'x^2+y^2', 'right': 'z^2'}
// const defaultfunc = {'left': 'x^2-y^2', 'right': 'z^2'}
const defaultfunc = {left: '//left(x+1//right)^2+y^2', right: 'z'}
// const defaultfunc =  {'left': 'x^2+y^2', 'right': '1'}

const defaultvec = {'vec': {'x': '1', 'y': '1', 'z': '1'}, 'init': {'x': '0', 'y': '0', 'z': '0'}}
const defaultvec2 = {'vec': {'x': '-1', 'y': '-1', 'z': '-1'}, 'init': {'x': '0', 'y': '0', 'z': '0'}}
const defaultpt = {'x': '1', 'y': '1', 'z': '1'}
const defaultscrv = {'x': '//cos//left(t//right)', 'y': '//sin//left(t//right)', 'z': '0.1t'}
const defaultvfld = {'x': 'x-xy', 'y': 'x-y', 'z': '0'}
// const defaults = {'Vec 1': defaultvec, 'Pt 1': defaultpt, 'Func 1': defaultfunc}
// const defaults = {'Vec 1': defaultvec, 'Vec 2': defaultvec2, 'Pt 1': defaultpt}
// const defaults = {'Vec 1': defaultvec2}
// const defaults = {'Func 1': defaultfunc, 'Func 2': {'left': 'x^2+//left(y+1//right)^2+z^2', 'right': '1'}}
// const defaults = {'Pt 1': defaultpt, 'Pt 2': {'x': '0', 'y': '0', 'z': '1'}}
const defaults = {'SCrv 1': defaultscrv, 'VFld 1': defaultvfld}

const BASE_URL = 'https://ndlearning.8thwall.app/realmath/'

/* **********************
 * The equation JSONs from input page are embedded into the URL
 * The equations are then gleaned from the URL
*********************** */
export const ParseUrl = () => {
  const url = decodeURIComponent((window.location.href).slice(BASE_URL.length))  // ignores base url
  /* eslint-disable-next-line no-console */
  console.log(`CURRENT URL JSON: ${url}`)
  try {
    return JSON.parse(url)
  } catch (e) {
    /* eslint-disable-next-line no-console */
    console.log(`INVALID URL ERROR: ${e}`)
    return defaults
  }
}