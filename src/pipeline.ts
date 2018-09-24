import * as Bluebird from 'bluebird'
import * as EventEmitter from 'events'
import { CognacSourceInterface } from './source'
import { CognacContext } from './context'

export class CognacPipeline<T> extends EventEmitter {
  private middleware = []
  constructor (
    private source: CognacSourceInterface<T>
  ) {
    super()
    this.source.subscribe(this.exec.bind(this))
    this.on('error', d => d)
  }

  private async exec (data: T) {
    const context: CognacContext<T> = new CognacContext<T>(data)

    try {

      if (this.source.onContextCreate) {
        await this.source.onContextCreate(context)
      }

      if (context.isDone()) {
        return
      }

      if (this.middleware.length > 0) {
        let i = 0

        do {
          const next = this.middleware[i]

          await next(context)

          i ++
        } while (i < this.middleware.length && !context.isDone())
      }

      if (this.source.onDone) {
        await this.source.onDone(context)
      }

      return
    } catch (err) {
      this.emit('error', err, context)
      throw err;
    }
  }

  async start () {
    await this.source.start()
  }

  async stop () {
    await this.source.stop()
  }

  add (fn: (context: CognacContext<T>) => any) {
    this.middleware.push(fn)
  }

  sink (fn: (context: CognacContext<T>) => any) {
    this.add(async (context: CognacContext<T>) => {
      await fn(context)

      if (!context.isDone()) {
        context.done()
      }
    })
  }
}
