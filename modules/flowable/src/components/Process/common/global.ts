import type { ProcessModelerStore } from './types'

const modelerStore: ProcessModelerStore = {
  userList: [],
  roleList: [],
  expList: [],
  modeler: null,
  modeling: null,
  moddle: null,
  canvas: null,
  bpmnFactory: null,
  elRegistry: null,
  element: null
}

export default modelerStore
