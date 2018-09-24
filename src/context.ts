export class CognacContext<T> extends Map<any, any> {
  private _done: boolean = false

  constructor (public data: T) {
    super()
  }

  done () {
    this._done = true
  }

  isDone (): boolean {
    return this._done
  }
}
