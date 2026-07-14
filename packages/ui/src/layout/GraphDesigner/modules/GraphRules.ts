import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider'

export default class GraphRules extends RuleProvider {
  static $inject = ['eventBus']

  constructor(eventBus: any) {
    super(eventBus)
  }

  init() {
    this.addRule(
      [
        'shape.create',
        'shape.move',
        'elements.move',
        'elements.delete',
        'connection.create',
        'connection.reconnect',
        'connection.reconnectStart',
        'connection.reconnectEnd',
        'connection.updateWaypoints'
      ],
      1500,
      () => true
    )
  }
}
