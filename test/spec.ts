import { expect } from 'chai'
import { stub, spy } from 'sinon'

import { CognacPipeline, CognacSourceInterface } from '../src'

class FakeMessageType {
  constructor (public data: any) {}
}

class FakeSource implements CognacSourceInterface<FakeMessageType> {
  private subscriber: (data: FakeMessageType) => Promise<void>
  start () {}
  stop () {}
  onContextCreate () {}
  onDone () {}
  subscribe(fn: (data: FakeMessageType) => Promise<void>) {
    this.subscriber = fn
  }
  receive (data: any) {
    return this.subscriber(new FakeMessageType(data))
  }
}

const wait = time => new Promise(resolve => setTimeout(resolve, time))

describe('CognacPipeline', () => {
  let source: FakeSource
    , pipeline: CognacPipeline<FakeMessageType>

  beforeEach(() => {
    source = new FakeSource()
    pipeline = new CognacPipeline<FakeMessageType>(source)
  })

  describe('class method', () => {
    describe('#stop', () => {
      let fake
      beforeEach(() => {
        fake = stub(source, 'stop')
      })
      afterEach(() => fake.restore())
      it('calls the underlying source stop method', () => {
        pipeline.stop()
        expect(fake.called).to.be.true
      })
    })
    describe('#start', () => {
      let fake
      beforeEach(() => {
        fake = stub(source, 'start')
      })
      afterEach(() => fake.restore())
      it('calls the underlying source start method', () => {
        pipeline.start()
        expect(fake.called).to.be.true
      })
    })
  })

  describe('full chain', () => {
    let fakeMiddleware1
      , fakeMiddleware2
      , fakeMiddleware3
      , sink
      , processed

    beforeEach(() => {
      processed = []

      fakeMiddleware1 = stub()
      fakeMiddleware2 = stub()
      fakeMiddleware3 = stub()

      sink = stub()

      fakeMiddleware1.callsFake(() => {
        return new Promise(resolve => setTimeout(() => {
          processed.push(1)
          resolve()
        }, 100))
      })

      fakeMiddleware2.callsFake(() => {
        return new Promise(resolve => setTimeout(() => {
          processed.push(2)
          resolve()
        }, 50))
      })

      fakeMiddleware3.callsFake(() => {
        return new Promise(resolve => setTimeout(() => {
          processed.push(3)
          resolve()
        }, 25))
      })

      sink.callsFake(() => {
        processed.push('sink')
      })

      pipeline.add(fakeMiddleware1)
      pipeline.add(fakeMiddleware2)
      pipeline.add(fakeMiddleware3)
      pipeline.sink(sink)
    })

    it('works', async () => {
      await source.receive('hello')

      expect(fakeMiddleware1.called).to.be.true
      expect(fakeMiddleware2.called).to.be.true
      expect(fakeMiddleware3.called).to.be.true
      expect(sink.called).to.be.true

      expect(processed).to.eql([1, 2, 3, 'sink'])
    })
  })

  describe('intercepted chain', () => {
    let fakeMiddleware1
      , fakeMiddleware2
      , fakeMiddleware3
      , sink
      , processed

    beforeEach(() => {
      processed = []

      fakeMiddleware1 = stub()
      fakeMiddleware2 = stub()
      fakeMiddleware3 = stub()

      sink = stub()

      fakeMiddleware1.callsFake(() => {
        return new Promise(resolve => setTimeout(() => {
          processed.push(1)
          resolve()
        }, 100))
      })

      fakeMiddleware2.callsFake(context => {
        return new Promise(resolve => setTimeout(() => {
          processed.push(2)
          context.done()
          resolve()
        }, 50))
      })

      fakeMiddleware3.callsFake(() => {
        return new Promise(resolve => setTimeout(() => {
          processed.push(3)
          resolve()
        }, 25))
      })

      sink.callsFake(() => {
        processed.push('sink')
      })

      pipeline.add(fakeMiddleware1)
      pipeline.add(fakeMiddleware2)
      pipeline.add(fakeMiddleware3)
      pipeline.sink(sink)
    })

    it('works', async () => {
      await source.receive('hello')

      expect(fakeMiddleware1.called).to.be.true
      expect(fakeMiddleware2.called).to.be.true
      expect(fakeMiddleware3.called).to.be.false
      expect(sink.called).to.be.false

      expect(processed).to.eql([1, 2])
    })
  })

  describe('errored chain', () => {
        let fakeMiddleware1
      , fakeMiddleware2
      , fakeMiddleware3
      , sink
      , processed

    beforeEach(() => {
      processed = []

      fakeMiddleware1 = stub()
      fakeMiddleware2 = stub()
      fakeMiddleware3 = stub()

      sink = stub()

      fakeMiddleware1.callsFake(() => {
        return new Promise(resolve => setTimeout(() => {
          processed.push(1)
          resolve()
        }, 100))
      })

      fakeMiddleware2.callsFake(() => {
        return new Promise((resolve, reject) => setTimeout(() => {
          processed.push(2)
          reject('damn')
        }, 50))
      })

      fakeMiddleware3.callsFake(() => {
        return new Promise(resolve => setTimeout(() => {
          processed.push(3)
          resolve()
        }, 25))
      })

      sink.callsFake(() => {
        processed.push('sink')
      })

      pipeline.add(fakeMiddleware1)
      pipeline.add(fakeMiddleware2)
      pipeline.add(fakeMiddleware3)
      pipeline.sink(sink)
    })

    it('works', async () => {
      let e = new Error('did not throw as expected')
      try {
       await source.receive('hello')
       throw e
      } catch (err) {
        if (err === e) throw err
        expect(fakeMiddleware1.called).to.be.true
        expect(fakeMiddleware2.called).to.be.true
        expect(fakeMiddleware3.called).to.be.false
        expect(sink.called).to.be.false

        expect(processed).to.eql([1, 2])
        expect(err).to.equal('damn')
      }
    })
  })

  describe('errored sink', () => {
    let fakeMiddleware1
      , fakeMiddleware2
      , fakeMiddleware3
      , sink
      , processed

    beforeEach(() => {
      processed = []

      fakeMiddleware1 = stub()
      fakeMiddleware2 = stub()
      fakeMiddleware3 = stub()

      sink = stub()

      fakeMiddleware1.callsFake(() => {
        return new Promise(resolve => setTimeout(() => {
          processed.push(1)
          resolve()
        }, 100))
      })

      fakeMiddleware2.callsFake(() => {
        return new Promise(resolve => setTimeout(() => {
          processed.push(2)
          resolve()
        }, 50))
      })

      fakeMiddleware3.callsFake(() => {
        return new Promise(resolve => setTimeout(() => {
          processed.push(3)
          resolve()
        }, 25))
      })

      sink.callsFake(() => {
        processed.push('sink')
        throw new Error('damn')
      })

      pipeline.add(fakeMiddleware1)
      pipeline.add(fakeMiddleware2)
      pipeline.add(fakeMiddleware3)
      pipeline.sink(sink)
    })

    it('works', async () => {
      let e = new Error('did not throw as expected')
      try {
       await source.receive('hello')
       throw e
      } catch (err) {
        if (err === e) throw err

        expect(fakeMiddleware1.called).to.be.true
        expect(fakeMiddleware2.called).to.be.true
        expect(fakeMiddleware3.called).to.be.true
        expect(sink.called).to.be.true

        expect(processed).to.eql([1, 2, 3, 'sink'])
      }
    })

  })
})
