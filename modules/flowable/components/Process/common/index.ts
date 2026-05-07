import Viewer from 'bpmn-js/lib/Viewer'
import ZoomScrollModule from 'diagram-js/lib/navigation/zoomscroll'
import MoveCanvasModule from 'diagram-js/lib/navigation/movecanvas'

export class CustomViewer extends Viewer {
  static get _modules(): unknown[] {
    const viewerPrototype = Viewer.prototype as { _modules?: unknown[] }
    return [...(viewerPrototype._modules ?? []), ZoomScrollModule, MoveCanvasModule]
  }
}
